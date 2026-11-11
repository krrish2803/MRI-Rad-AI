from __future__ import annotations

import os
import shutil
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from time import monotonic
from typing import Any

import nibabel as nib
import numpy as np

from app.config import get_settings
from app.db import zone_segmentations


class InvalidVolume(Exception):
    pass


def zone_model_status(settings=None) -> str:
    settings = settings or get_settings()
    if not shutil.which(settings.nnunet_predict_command):
        return "predictor_not_installed"
    results_path = os.environ.get("nnUNet_results") or settings.nnunet_results
    if not results_path:
        return "results_path_missing"
    dataset_name = f"Dataset{settings.nnunet_dataset_id:03d}_Prostate"
    dataset_results = Path(results_path) / dataset_name
    candidates = list(dataset_results.glob(f"*__{settings.nnunet_configuration}"))
    if not candidates:
        return "trained_model_missing"
    checkpoint_names = ("checkpoint_final.pth", "checkpoint_final.safetensors")
    for fold in range(5):
        if not any(
            any(
                (candidate / f"fold_{fold}" / name).is_file()
                for name in checkpoint_names
            )
            for candidate in candidates
        ):
            return "fold_checkpoints_missing"
    return "ready"


def normalize_nifti_upload(
    data: bytes, target: Path
) -> tuple[tuple[int, ...], np.ndarray]:
    if len(data) < 4 or data[:2] != b"\x1f\x8b":
        raise InvalidVolume("Upload must be a gzip-compressed NIfTI .nii.gz volume.")
    target.parent.mkdir(parents=True, exist_ok=True)
    source = target.with_name(target.name[:-7] + ".upload.nii.gz")
    source.write_bytes(data)
    try:
        image = nib.load(str(source))
        volume = np.asanyarray(image.dataobj)
        if volume.ndim != 3:
            raise InvalidVolume("Each input must be a single 3D MRI volume.")
        if not np.isfinite(volume).all():
            raise InvalidVolume("NIfTI volume contains invalid numeric values.")
        header = nib.Nifti1Header()
        header.set_data_shape(volume.shape)
        header.set_data_dtype(volume.dtype)
        header.set_zooms(image.header.get_zooms()[:3])
        clean = nib.Nifti1Image(volume, image.affine, header=header)
        clean.header.extensions.clear()
        nib.save(clean, str(target))
        return volume.shape, image.affine.copy()
    except InvalidVolume:
        raise
    except Exception as exc:
        raise InvalidVolume("NIfTI volume could not be read.") from exc
    finally:
        source.unlink(missing_ok=True)


def run_zone_segmentation(segmentation_id: str) -> None:
    jobs = zone_segmentations()
    claim = jobs.update_one(
        {"segmentation_id": segmentation_id, "status": "pending"},
        {"$set": {"status": "processing", "started_at": datetime.now(UTC)}},
    )
    if claim.modified_count != 1:
        return
    job = jobs.find_one({"segmentation_id": segmentation_id})
    start = monotonic()
    settings = get_settings()
    try:
        if zone_model_status(settings) != "ready":
            raise RuntimeError(
                "nnU-Net predictor or trained fold checkpoints are unavailable."
            )
        predictor = shutil.which(settings.nnunet_predict_command)
        child_env = os.environ.copy()
        for key, configured in (
            ("nnUNet_raw", settings.nnunet_raw),
            ("nnUNet_preprocessed", settings.nnunet_preprocessed),
            ("nnUNet_results", settings.nnunet_results),
        ):
            if configured:
                child_env[key] = str(configured)
        input_dir = Path(job["input_dir"])
        output_dir = Path(job["output_dir"])
        output_dir.mkdir(parents=True, exist_ok=True)
        case_id = job["case_id"]
        command = [
            predictor,
            "-i",
            str(input_dir),
            "-o",
            str(output_dir),
            "-d",
            str(settings.nnunet_dataset_id),
            "-c",
            settings.nnunet_configuration,
            "-f",
            "0",
            "1",
            "2",
            "3",
            "4",
        ]
        subprocess.run(
            command,
            check=True,
            timeout=settings.nnunet_timeout_seconds,
            capture_output=True,
            text=True,
            env=child_env,
        )
        mask_path = output_dir / f"{case_id}.nii.gz"
        if not mask_path.is_file():
            raise RuntimeError(
                "nnU-Net completed without producing a segmentation mask."
            )
        prediction = np.asanyarray(nib.load(str(mask_path)).dataobj)
        values = set(np.unique(prediction).astype(int).tolist())
        if not values.issubset({0, 1, 2}):
            raise RuntimeError(
                "nnU-Net returned labels outside background, PZ, and TZ."
            )
        now = datetime.now(UTC)
        jobs.update_one(
            {"segmentation_id": segmentation_id},
            {
                "$set": {
                    "status": "completed",
                    "mask_path": str(mask_path),
                    "label_values": sorted(values),
                    "processing_ms": int((monotonic() - start) * 1000),
                    "completed_at": now,
                }
            },
        )
    # Persist every model-worker failure without returning subprocess details to the UI.
    except Exception as exc:  # noqa: BLE001
        now = datetime.now(UTC)
        reason = str(exc)
        if isinstance(exc, subprocess.TimeoutExpired):
            message = "nnU-Net inference timed out."
        elif "not installed" in reason:
            message = "nnU-Net model service is not configured."
        else:
            message = "Zone segmentation could not be completed. Check model installation and trained fold checkpoints."
        jobs.update_one(
            {"segmentation_id": segmentation_id},
            {
                "$set": {
                    "status": "failed",
                    "error_message": message,
                    "processing_ms": int((monotonic() - start) * 1000),
                    "completed_at": now,
                }
            },
        )


def segmentation_response(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "segmentation_id": job["segmentation_id"],
        "status": job["status"],
        "model": "nnU-Net v2 3d_fullres",
        "classes": {
            "0": "background",
            "1": "peripheral zone (PZ)",
            "2": "transition zone (TZ)",
        },
        "scope": "Prostate anatomy segmentation only. No cancer or lesion predictions.",
        "label_values": job.get("label_values"),
        "mask_url": (
            f"/api/v1/zone-segmentations/{job['segmentation_id']}/mask"
            if job.get("status") == "completed"
            else None
        ),
        "processing_ms": job.get("processing_ms"),
        "error_message": job.get("error_message"),
        "created_at": job["created_at"].isoformat(),
    }
