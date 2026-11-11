from datetime import UTC, datetime
from time import monotonic

from app.config import get_settings
from app.db import analyses, uploads
from app.services.nvidia import PROMPT_VERSION, analyze_images

DISCLAIMER = "Research prototype. Not for clinical use. Requires radiologist review."


def run_analysis(analysis_id: str) -> None:
    started = monotonic()
    collection = analyses()
    now = datetime.now(UTC)
    claim = collection.update_one(
        {"analysis_id": analysis_id, "status": "pending"},
        {"$set": {"status": "processing", "started_at": now, "updated_at": now}},
    )
    if claim.modified_count != 1:
        return
    doc = collection.find_one({"analysis_id": analysis_id})
    try:
        settings = get_settings()
        selected = []
        for item in doc["selected_slices"]:
            upload = uploads().find_one({"upload_id": item["upload_id"]})
            if not upload:
                raise RuntimeError("An uploaded image is unavailable.")
            selected.append(
                {**item, "path": upload["slice_paths"][item["slice_index"]]}
            )
        response = analyze_images(settings, selected)
        completed = datetime.now(UTC)
        collection.update_one(
            {"analysis_id": analysis_id},
            {
                "$set": {
                    "status": "completed",
                    "result": response["result"],
                    "raw_result": response["raw_result"],
                    "model": settings.nvidia_model,
                    "prompt_version": PROMPT_VERSION,
                    "input_tokens": response["input_tokens"],
                    "output_tokens": response["output_tokens"],
                    "cost_usd": response["cost_usd"],
                    "processing_ms": int((monotonic() - started) * 1000),
                    "completed_at": completed,
                    "updated_at": completed,
                    "error_message": None,
                }
            },
        )
    # Persist every worker failure as a generic state; never expose an exception to the UI.
    except Exception as exc:  # noqa: BLE001
        completed = datetime.now(UTC)
        if exc.__class__.__name__ == "InvalidModelOutput":
            message = "Model output could not be validated after one repair attempt."
            collection.update_one(
                {"analysis_id": analysis_id},
                {
                    "$set": {
                        "raw_result": getattr(exc, "raw_text", ""),
                        "input_tokens": getattr(exc, "input_tokens", 0),
                        "output_tokens": getattr(exc, "output_tokens", 0),
                        "cost_usd": getattr(exc, "cost_usd", None),
                    }
                },
            )
        elif "Timeout" in exc.__class__.__name__:
            message = "Model request timed out. Please submit again."
        elif "HTTPStatusError" in exc.__class__.__name__:
            message = "Model service unavailable. Please try again later."
        else:
            message = "Analysis could not be completed. Please check service configuration and try again."
        collection.update_one(
            {"analysis_id": analysis_id},
            {
                "$set": {
                    "status": "failed",
                    "error_message": message,
                    "processing_ms": int((monotonic() - started) * 1000),
                    "completed_at": completed,
                    "updated_at": completed,
                }
            },
        )
