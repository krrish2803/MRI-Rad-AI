from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    Form,
    HTTPException,
    Query,
    Response,
    UploadFile,
)
from fastapi.responses import FileResponse
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.config import get_settings
from app.db import analyses, feedback, uploads, zone_segmentations
from app.schemas import AnalysisAccepted, AnalysisCreate, FeedbackCreate, UploadResponse
from app.services.analysis_runner import DISCLAIMER, run_analysis
from app.services.image_io import (
    InvalidImage,
    UnsupportedImage,
    detect_format,
    normalize_image,
)
from app.services.nvidia import PROMPT_VERSION
from app.services.selection import default_slice_indices, validate_slice_indices
from app.services.zone_model import (
    InvalidVolume,
    normalize_nifti_upload,
    run_zone_segmentation,
    segmentation_response,
    zone_model_status,
)

router = APIRouter()


def _db_guard() -> None:
    try:
        uploads().database.command("ping")
    except PyMongoError as exc:
        raise HTTPException(503, "Database service unavailable.") from exc


def _upload_response(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "upload_id": doc["upload_id"],
        "sequence_type": doc["sequence_type"],
        "source_format": doc["source_format"],
        "slice_count": doc["slice_count"],
        "width": doc["width"],
        "height": doc["height"],
        "size_bytes": doc["size_bytes"],
        "status": "ready",
        "created_at": doc["created_at"].isoformat(),
    }


@router.get("/health")
def health() -> dict[str, str]:
    settings = get_settings()
    zone_status = zone_model_status(settings)
    try:
        uploads().database.command("ping")
        return {
            "status": "ok",
            "db": "ok",
            "vlm": "configured" if settings.nvidia_api_key else "not_configured",
            "zone_model": zone_status,
        }
    except PyMongoError:
        return {
            "status": "error",
            "db": "error",
            "vlm": "configured" if settings.nvidia_api_key else "not_configured",
            "zone_model": zone_status,
        }


@router.post("/api/v1/uploads", response_model=UploadResponse, status_code=201)
async def create_upload(
    response: Response,
    file: UploadFile = File(...),  # noqa: B008
    sequence_type: str = Form(...),
):
    _db_guard()
    sequence_type = sequence_type.upper()
    if sequence_type not in {"T2", "DWI", "ADC", "OTHER"}:
        raise HTTPException(422, "sequence_type must be T2, DWI, ADC, or OTHER.")
    settings = get_settings()
    raw = await file.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if len(raw) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f"File exceeds the {settings.max_upload_mb} MB limit.")
    try:
        source_format = detect_format(raw)
    except UnsupportedImage as exc:
        raise HTTPException(415, str(exc)) from exc
    upload_id = str(uuid4())
    upload_dir = settings.storage_dir / "uploads" / upload_id
    try:
        normalized = normalize_image(
            raw,
            source_format,
            upload_dir,
            settings.image_max_side_px,
            settings.keep_original_dicom and source_format == "dicom",
        )
    except InvalidImage as exc:
        if upload_dir.exists():
            import shutil

            shutil.rmtree(upload_dir, ignore_errors=True)
        raise HTTPException(422, str(exc)) from exc
    filename = Path(file.filename or "image").name[:200]
    now = datetime.now(UTC)
    document = {
        "upload_id": upload_id,
        "sha256": sha256(raw).hexdigest(),
        "sequence_type": sequence_type,
        "source_format": source_format,
        "original_filename": filename,
        "size_bytes": len(raw),
        "slice_count": normalized["slice_count"],
        "width": normalized["width"],
        "height": normalized["height"],
        "slice_paths": normalized["slice_paths"],
        "original_path": normalized["original_path"],
        "created_at": now,
    }
    try:
        uploads().insert_one(document)
    except DuplicateKeyError:
        import shutil

        shutil.rmtree(upload_dir, ignore_errors=True)
        existing = uploads().find_one(
            {"sha256": document["sha256"], "sequence_type": sequence_type}
        )
        response.status_code = 200
        return _upload_response(existing)
    except PyMongoError as exc:
        import shutil

        shutil.rmtree(upload_dir, ignore_errors=True)
        raise HTTPException(503, "Could not store upload metadata.") from exc
    return _upload_response(document)


@router.get("/api/v1/uploads/{upload_id}")
def get_upload(upload_id: UUID):
    _db_guard()
    doc = uploads().find_one({"upload_id": str(upload_id)})
    if not doc:
        raise HTTPException(404, "Upload not found.")
    return _upload_response(doc)


@router.get("/api/v1/uploads/{upload_id}/slices/{index}")
def get_upload_slice(upload_id: UUID, index: int):
    _db_guard()
    doc = uploads().find_one({"upload_id": str(upload_id)})
    if not doc:
        raise HTTPException(404, "Upload not found.")
    if index < 0 or index >= doc["slice_count"]:
        raise HTTPException(404, "Slice not found.")
    path = Path(doc["slice_paths"][index])
    if not path.is_file():
        raise HTTPException(404, "Derived slice is unavailable.")
    return FileResponse(path, media_type="image/png")


@router.post("/api/v1/analyses", response_model=AnalysisAccepted, status_code=202)
def create_analysis(body: AnalysisCreate, background_tasks: BackgroundTasks):
    _db_guard()
    settings = get_settings()
    if not settings.nvidia_api_key:
        raise HTTPException(503, "NVIDIA_API_KEY is not configured.")
    docs = []
    for upload_id in body.upload_ids:
        doc = uploads().find_one({"upload_id": str(upload_id)})
        if not doc:
            raise HTTPException(404, "One or more uploads were not found.")
        docs.append(doc)
    sequences = [doc["sequence_type"] for doc in docs]
    if len(set(sequences)) != len(sequences):
        raise HTTPException(
            400, "Choose no more than one upload for each sequence type."
        )
    selected = []
    requested = body.slice_indices or {}
    for doc in docs:
        if str(doc["upload_id"]) in requested:
            try:
                indexes = validate_slice_indices(
                    requested[str(doc["upload_id"])], doc["slice_count"]
                )
            except ValueError as exc:
                raise HTTPException(422, str(exc)) from exc
        else:
            indexes = default_slice_indices(
                doc["slice_count"], settings.slices_per_sequence
            )
        selected.extend(
            {
                "upload_id": doc["upload_id"],
                "sequence_type": doc["sequence_type"],
                "slice_index": index,
            }
            for index in indexes
        )
    if len(selected) > settings.max_images_per_analysis:
        raise HTTPException(
            409,
            f"Analysis selects {len(selected)} images; maximum is {settings.max_images_per_analysis}.",
        )
    analysis_id = str(uuid4())
    now = datetime.now(UTC)
    record = {
        "analysis_id": analysis_id,
        "status": "pending",
        "model": settings.nvidia_model,
        "prompt_version": PROMPT_VERSION,
        "upload_ids": [doc["upload_id"] for doc in docs],
        "selected_slices": selected,
        "result": None,
        "raw_result": None,
        "input_tokens": None,
        "output_tokens": None,
        "cost_usd": None,
        "processing_ms": None,
        "error_message": None,
        "created_at": now,
        "started_at": None,
        "completed_at": None,
        "updated_at": now,
        "disclaimer": DISCLAIMER,
    }
    try:
        analyses().insert_one(record)
    except PyMongoError as exc:
        raise HTTPException(503, "Could not create analysis.") from exc
    background_tasks.add_task(run_analysis, analysis_id)
    return {
        "analysis_id": analysis_id,
        "status": "pending",
        "selected_images": len(selected),
        "disclaimer": DISCLAIMER,
    }


def _analysis_response(doc: dict[str, Any]) -> dict[str, Any]:
    selected = []
    for item in doc.get("selected_slices", []):
        selected.append(
            {
                **item,
                "preview_url": f"/api/v1/uploads/{item['upload_id']}/slices/{item['slice_index']}",
            }
        )
    return {
        "analysis_id": doc["analysis_id"],
        "status": doc["status"],
        "result": doc.get("result"),
        "selected_slices": selected,
        "model": doc.get("model"),
        "prompt_version": doc.get("prompt_version"),
        "usage": {
            "input_tokens": doc.get("input_tokens"),
            "output_tokens": doc.get("output_tokens"),
            "cost_usd": doc.get("cost_usd"),
        },
        "processing_ms": doc.get("processing_ms"),
        "error_message": doc.get("error_message"),
        "created_at": doc["created_at"].isoformat(),
        "started_at": doc["started_at"].isoformat() if doc.get("started_at") else None,
        "completed_at": (
            doc["completed_at"].isoformat() if doc.get("completed_at") else None
        ),
        "disclaimer": DISCLAIMER,
        "model_scope": "Technical image quality observations only. No cancer, lesion, or risk predictions.",
    }


@router.get("/api/v1/analyses/{analysis_id}")
def get_analysis(analysis_id: UUID):
    _db_guard()
    doc = analyses().find_one({"analysis_id": str(analysis_id)})
    if not doc:
        raise HTTPException(404, "Analysis not found.")
    return _analysis_response(doc)


@router.get("/api/v1/image-reviews/{review_id}")
def get_image_review(review_id: str):
    """Expose the technical image observations using the research-page contract."""
    try:
        parsed_id = UUID(review_id)
    except ValueError as exc:
        raise HTTPException(404, "Image review not found.") from exc
    analysis = get_analysis(parsed_id)
    result = analysis.get("result") or {}
    return {
        "review_id": analysis["analysis_id"],
        "status": analysis["status"],
        "error_message": analysis.get("error_message"),
        "observations": result.get("image_observations", []),
    }


@router.get("/api/v1/analyses")
def list_analyses(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    _db_guard()
    cursor = (
        analyses()
        .find({}, {"raw_result": 0})
        .sort("created_at", -1)
        .skip(offset)
        .limit(limit)
    )
    items = []
    for doc in cursor:
        item = _analysis_response(doc)
        item.pop("selected_slices", None)
        items.append(item)
    return {"items": items, "limit": limit, "offset": offset}


def _feedback_response(doc: dict[str, Any] | None) -> dict[str, Any]:
    if not doc:
        return {"feedback": None}
    return {
        "feedback": {
            "feedback_id": doc.get("feedback_id"),
            "feedback_type": doc.get("feedback_type"),
            "notes": doc.get("notes", ""),
            "updated_at": doc.get("updated_at", doc.get("created_at")).isoformat()
            if doc.get("updated_at", doc.get("created_at"))
            else None,
        }
    }


def _save_feedback(
    resource_type: str, resource_id: str, body: FeedbackCreate
) -> dict[str, Any]:
    if body.feedback_type == "zone_boundary_issue" and not body.zone_name:
        raise HTTPException(
            422, "zone_name (PZ or TZ) is required for a zone boundary issue."
        )
    now = datetime.now(UTC)
    identity = {"resource_type": resource_type, "resource_id": resource_id}
    feedback().update_one(
        identity,
        {
            "$set": {
                "feedback_type": body.feedback_type.value,
                "zone_name": body.zone_name,
                "notes": body.notes,
                "updated_at": now,
            },
            "$setOnInsert": {
                "feedback_id": str(uuid4()),
                **identity,
                "analysis_id": resource_id if resource_type == "image_review" else None,
                "created_at": now,
            },
        },
        upsert=True,
    )
    return _feedback_response(feedback().find_one(identity))


def _get_feedback(resource_type: str, resource_id: str) -> dict[str, Any]:
    return _feedback_response(
        feedback().find_one({"resource_type": resource_type, "resource_id": resource_id})
    )


@router.get("/api/v1/analyses/{analysis_id}/feedback")
def get_analysis_feedback(analysis_id: UUID):
    _db_guard()
    if not analyses().find_one({"analysis_id": str(analysis_id)}):
        raise HTTPException(404, "Analysis not found.")
    return _get_feedback("image_review", str(analysis_id))


@router.post("/api/v1/analyses/{analysis_id}/feedback", status_code=201)
def create_feedback(analysis_id: UUID, body: FeedbackCreate):
    _db_guard()
    analysis = analyses().find_one({"analysis_id": str(analysis_id)})
    if not analysis:
        raise HTTPException(404, "Analysis not found.")
    if analysis["status"] != "completed":
        raise HTTPException(409, "Feedback is accepted only after analysis completes.")
    return _save_feedback("image_review", str(analysis_id), body)


@router.get("/api/v1/image-reviews/{review_id}/feedback")
def get_image_review_feedback(review_id: str):
    try:
        parsed_id = str(UUID(review_id))
    except ValueError as exc:
        raise HTTPException(404, "Image review not found.") from exc
    return get_analysis_feedback(UUID(parsed_id))


@router.post("/api/v1/image-reviews/{review_id}/feedback", status_code=201)
def save_image_review_feedback(review_id: str, body: FeedbackCreate):
    try:
        parsed_id = str(UUID(review_id))
    except ValueError as exc:
        raise HTTPException(404, "Image review not found.") from exc
    return create_feedback(UUID(parsed_id), body)


@router.get("/api/v1/zone-jobs/{job_id}/feedback")
def get_zone_job_feedback(job_id: UUID):
    _db_guard()
    job = zone_segmentations().find_one({"segmentation_id": str(job_id)})
    if not job:
        raise HTTPException(404, "Zone job not found.")
    return _get_feedback("zone_job", str(job_id))


@router.post("/api/v1/zone-jobs/{job_id}/feedback", status_code=201)
def save_zone_job_feedback(job_id: UUID, body: FeedbackCreate):
    _db_guard()
    job = zone_segmentations().find_one({"segmentation_id": str(job_id)})
    if not job:
        raise HTTPException(404, "Zone job not found.")
    if job["status"] != "completed":
        raise HTTPException(409, "Feedback is accepted only after segmentation completes.")
    return _save_feedback("zone_job", str(job_id), body)


@router.post("/api/v1/zone-segmentations", status_code=202)
async def create_zone_segmentation(
    background_tasks: BackgroundTasks,
    t2_file: UploadFile = File(...),  # noqa: B008
    adc_file: UploadFile = File(...),  # noqa: B008
):
    _db_guard()
    settings = get_settings()
    if zone_model_status(settings) != "ready":
        raise HTTPException(
            503, "nnU-Net predictor and all five trained folds must be installed first."
        )
    max_bytes = settings.max_upload_mb * 1024 * 1024
    t2_data = await t2_file.read(max_bytes + 1)
    adc_data = await adc_file.read(max_bytes + 1)
    if len(t2_data) > max_bytes or len(adc_data) > max_bytes:
        raise HTTPException(
            413, f"Each NIfTI volume must be smaller than {settings.max_upload_mb} MB."
        )
    segmentation_id = str(uuid4())
    case_id = "mri_" + segmentation_id.replace("-", "")
    input_dir = settings.storage_dir / "zone_segmentations" / segmentation_id / "input"
    output_dir = (
        settings.storage_dir / "zone_segmentations" / segmentation_id / "output"
    )
    try:
        t2_shape, t2_affine = normalize_nifti_upload(
            t2_data, input_dir / f"{case_id}_0000.nii.gz"
        )
        adc_shape, adc_affine = normalize_nifti_upload(
            adc_data, input_dir / f"{case_id}_0001.nii.gz"
        )
    except InvalidVolume as exc:
        import shutil as file_shutil

        file_shutil.rmtree(input_dir.parent, ignore_errors=True)
        raise HTTPException(422, str(exc)) from exc
    import numpy as np

    if t2_shape != adc_shape or not np.allclose(t2_affine, adc_affine, atol=1e-4):
        import shutil as file_shutil

        file_shutil.rmtree(input_dir.parent, ignore_errors=True)
        raise HTTPException(
            422, "T2 and ADC must have the same 3D shape and aligned voxel geometry."
        )
    now = datetime.now(UTC)
    document = {
        "segmentation_id": segmentation_id,
        "status": "pending",
        "case_id": case_id,
        "input_dir": str(input_dir),
        "output_dir": str(output_dir),
        "shape": list(t2_shape),
        "created_at": now,
        "started_at": None,
        "completed_at": None,
        "processing_ms": None,
        "error_message": None,
    }
    try:
        zone_segmentations().insert_one(document)
    except PyMongoError as exc:
        import shutil as file_shutil

        file_shutil.rmtree(input_dir.parent, ignore_errors=True)
        raise HTTPException(503, "Could not create zone segmentation job.") from exc
    background_tasks.add_task(run_zone_segmentation, segmentation_id)
    return {
        "segmentation_id": segmentation_id,
        "status": "pending",
        "model": "nnU-Net v2 3d_fullres",
        "scope": "Prostate anatomy segmentation only. No cancer or lesion predictions.",
    }


@router.get("/api/v1/zone-segmentations/{segmentation_id}")
def get_zone_segmentation(segmentation_id: UUID):
    _db_guard()
    job = zone_segmentations().find_one({"segmentation_id": str(segmentation_id)})
    if not job:
        raise HTTPException(404, "Zone segmentation job not found.")
    return segmentation_response(job)


@router.get("/api/v1/zone-segmentations/{segmentation_id}/mask")
def get_zone_mask(segmentation_id: UUID):
    _db_guard()
    job = zone_segmentations().find_one(
        {"segmentation_id": str(segmentation_id), "status": "completed"}
    )
    if not job:
        raise HTTPException(404, "Completed zone mask not found.")
    mask_path = Path(job["mask_path"])
    if not mask_path.is_file():
        raise HTTPException(404, "Zone mask file is unavailable.")
    return FileResponse(
        mask_path, media_type="application/gzip", filename="prostate_zone_mask.nii.gz"
    )


def _research_job_status(status: str) -> str:
    return {
        "pending": "queued",
        "processing": "running",
        "completed": "completed",
        "failed": "failed",
        "cancelled": "cancelled",
    }.get(status, "failed")


def _zone_model_info() -> dict[str, Any]:
    return {
        "model": "nnU-Net v2 3d_fullres",
        "folds": 5,
        "dataset": "MSD Task05 Prostate",
        "training_cases": 32,
    }


@router.post("/api/v1/zone-jobs", status_code=202)
async def create_zone_job(
    background_tasks: BackgroundTasks,
    t2: UploadFile = File(...),  # noqa: B008
    adc: UploadFile = File(...),  # noqa: B008
):
    """Compatibility route for the analysis UI's zone-job contract."""
    result = await create_zone_segmentation(
        background_tasks, t2_file=t2, adc_file=adc
    )
    return {
        "job_id": result["segmentation_id"],
        "status": _research_job_status(result["status"]),
        "model_info": _zone_model_info(),
    }


@router.get("/api/v1/zone-jobs/{job_id}")
def get_zone_job(job_id: UUID):
    job = get_zone_segmentation(job_id)
    return {
        "job_id": job["segmentation_id"],
        "status": _research_job_status(job["status"]),
        "error_message": job.get("error_message"),
        "warnings": job.get("warnings", []),
        "model_info": _zone_model_info(),
    }


@router.get("/api/v1/zone-jobs/{job_id}/mask")
def get_zone_job_mask(job_id: UUID):
    return get_zone_mask(job_id)
