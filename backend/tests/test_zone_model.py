from pathlib import Path

import nibabel as nib
import numpy as np

from app.api import routes
from app.services import zone_model
from app.services.zone_model import normalize_nifti_upload, zone_model_status


def volume_bytes(tmp_path, filename):
    path = tmp_path / filename
    nib.save(nib.Nifti1Image(np.ones((8, 9, 10), dtype=np.float32), np.eye(4)), path)
    return path.read_bytes()


def test_normalizes_nifti_and_discards_header_extensions(tmp_path):
    raw = volume_bytes(tmp_path, "source.nii.gz")
    shape, affine = normalize_nifti_upload(raw, tmp_path / "safe.nii.gz")
    saved = nib.load(str(tmp_path / "safe.nii.gz"))
    assert shape == (8, 9, 10)
    assert np.array_equal(saved.affine, affine)
    assert len(saved.header.extensions) == 0


def test_model_readiness_requires_all_trained_folds(tmp_path, monkeypatch):
    monkeypatch.setattr(
        zone_model.shutil, "which", lambda command: "/mock/nnUNetv2_predict"
    )
    monkeypatch.setenv("nnUNet_results", str(tmp_path))
    model_dir = (
        tmp_path / "Dataset005_Prostate" / "nnUNetTrainer__nnUNetPlans__3d_fullres"
    )
    for fold in range(5):
        checkpoint = model_dir / f"fold_{fold}" / "checkpoint_final.safetensors"
        checkpoint.parent.mkdir(parents=True)
        checkpoint.write_bytes(b"mock checkpoint")
    assert zone_model_status() == "ready"
    (model_dir / "fold_4" / "checkpoint_final.safetensors").unlink()
    assert zone_model_status() == "fold_checkpoints_missing"


def test_zone_segmentation_request_runs_mocked_five_fold_predictor(
    client, tmp_path, monkeypatch
):
    monkeypatch.setattr(
        zone_model.shutil, "which", lambda command: "/mock/nnUNetv2_predict"
    )
    monkeypatch.setattr(routes, "zone_model_status", lambda settings: "ready")
    monkeypatch.setattr(zone_model, "zone_model_status", lambda settings: "ready")

    def fake_run(command, check, timeout, capture_output, text, env):
        input_dir = Path(command[command.index("-i") + 1])
        output_dir = Path(command[command.index("-o") + 1])
        case_name = next(input_dir.glob("*_0000.nii.gz")).name.removesuffix(
            "_0000.nii.gz"
        )
        nib.save(
            nib.Nifti1Image(np.zeros((8, 9, 10), dtype=np.uint8), np.eye(4)),
            output_dir / f"{case_name}.nii.gz",
        )

    monkeypatch.setattr(zone_model.subprocess, "run", fake_run)
    response = client.post(
        "/api/v1/zone-segmentations",
        files={
            "t2_file": (
                "t2.nii.gz",
                volume_bytes(tmp_path, "t2.nii.gz"),
                "application/gzip",
            ),
            "adc_file": (
                "adc.nii.gz",
                volume_bytes(tmp_path, "adc.nii.gz"),
                "application/gzip",
            ),
        },
    )
    assert response.status_code == 202
    body = response.json()
    job = client.get(f"/api/v1/zone-segmentations/{body['segmentation_id']}").json()
    assert job["status"] == "completed"
    assert job["classes"]["1"] == "peripheral zone (PZ)"
    assert "No cancer" in job["scope"]
    downloaded = client.get(job["mask_url"])
    assert downloaded.status_code == 200
    assert downloaded.headers["content-type"] == "application/gzip"


def test_zone_model_is_not_inferred_when_predictor_missing(client, monkeypatch):
    monkeypatch.setattr(
        routes, "zone_model_status", lambda settings: "predictor_not_installed"
    )
    response = client.post(
        "/api/v1/zone-segmentations",
        files={
            "t2_file": ("t2.nii.gz", b"ignored", "application/gzip"),
            "adc_file": ("adc.nii.gz", b"ignored", "application/gzip"),
        },
    )
    assert response.status_code == 503
