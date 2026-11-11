from __future__ import annotations

import base64
import json
import os
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import httpx
from bson import ObjectId
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings, SettingsConfigDict
from pymongo import MongoClient
from pymongo.errors import PyMongoError
import gridfs
from PIL import Image
import io


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "mriradai"
    nvidia_api_key: str = ""
    nvidia_model: str = "moonshotai/kimi-k2.5"
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    upload_max_mb: int = 50

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=3000)
db = client[settings.mongodb_database]
fs = gridfs.GridFS(db)
analyses = db["analyses"]
feedback = db["feedback"]
app = FastAPI(title="MRI-RadAI research prototype API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

DISCLAIMER = ("Research prototype only; not for clinical use. This image description does not detect cancer or lesions. "
              "The separate nnU-Net experiment is intended to segment prostate anatomy zones (PZ/TZ) only. "
              "A qualified radiologist must review original imaging and patient context.")
ALLOWED_TYPES = {"image/png": "png", "image/jpeg": "jpg"}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def serialize(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: serialize(item) for key, item in value.items() if key != "_id"}
    if isinstance(value, list):
        return [serialize(item) for item in value]
    return value


def run_analysis(analysis_id: str) -> None:
    """Run an explicitly non-diagnostic image description through NVIDIA NIM."""
    doc = analyses.find_one({"analysis_id": analysis_id})
    if not doc:
        return
    if not settings.nvidia_api_key:
        analyses.update_one({"analysis_id": analysis_id}, {"$set": {
            "status": "failed", "error": "NVIDIA_API_KEY is not configured.", "updated_at": utcnow()
        }})
        return
    content: list[dict[str, Any]] = [{"type": "text", "text": (
        "Describe only visible image characteristics for a research interface. This is a single image, "
        "not a complete prostate MRI study. Do not diagnose cancer, assign PI-RADS, infer a lesion, "
        "or recommend treatment. Return JSON with summary, visible_features, limitations. "
        "State uncertainty and that a radiologist must inspect the original DICOM study."
    )}]
    for item in doc["images"]:
        blob = fs.get(ObjectId(item["blob_id"]))
        encoded = base64.b64encode(blob.read()).decode("ascii")
        mime = item["content_type"]
        content.append({"type": "image_url", "image_url": {"url": f"data:{mime};base64,{encoded}"}})
    payload = {
        "model": settings.nvidia_model,
        "messages": [{"role": "user", "content": content}],
        "max_tokens": 800,
        "temperature": 0.2,
        "stream": False,
    }
    try:
        response = httpx.post(
            f"{settings.nvidia_base_url.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {settings.nvidia_api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=90,
        )
        response.raise_for_status()
        result = response.json()["choices"][0]["message"]["content"]
        analyses.update_one({"analysis_id": analysis_id}, {"$set": {
            "status": "completed", "result": result, "updated_at": utcnow()
        }})
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
        analyses.update_one({"analysis_id": analysis_id}, {"$set": {
            "status": "failed", "error": f"NVIDIA analysis failed: {str(exc)[:300]}", "updated_at": utcnow()
        }})


@app.get("/api/health")
def health() -> dict[str, str]:
    try:
        client.admin.command("ping")
        return {"status": "ok", "database": "connected", "nvidia": "configured" if settings.nvidia_api_key else "missing key"}
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="MongoDB is unavailable") from exc


@app.post("/api/analyses", status_code=202)
async def create_analysis(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    sequence_types: list[str] = Form(...),
) -> dict[str, Any]:
    if len(files) != len(sequence_types) or not 1 <= len(files) <= 3:
        raise HTTPException(400, "Upload 1–3 images and select one sequence type for each.")
    image_docs = []
    max_bytes = settings.upload_max_mb * 1024 * 1024
    for file, sequence_type in zip(files, sequence_types):
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(415, "Only PNG and JPEG images are supported in this MVP.")
        data = await file.read()
        if len(data) > max_bytes:
            raise HTTPException(413, f"Each image must be smaller than {settings.upload_max_mb} MB.")
        try:
            with Image.open(io.BytesIO(data)) as image:
                image.verify()
        except Exception as exc:
            raise HTTPException(400, f"{file.filename or 'Image'} is not a valid image.") from exc
        blob_id = fs.put(data, filename=file.filename or "scan", contentType=file.content_type)
        image_docs.append({
            "blob_id": str(blob_id), "filename": file.filename or "scan",
            "content_type": file.content_type, "sequence_type": sequence_type[:20],
        })
    analysis_id = str(uuid4())
    now = utcnow()
    analyses.insert_one({
        "analysis_id": analysis_id, "status": "queued", "images": image_docs,
        "result": None, "error": None, "created_at": now, "updated_at": now,
        "disclaimer": DISCLAIMER,
    })
    background_tasks.add_task(run_analysis, analysis_id)
    return {"analysis_id": analysis_id, "status": "queued", "disclaimer": DISCLAIMER}


@app.get("/api/analyses/{analysis_id}")
def get_analysis(analysis_id: str) -> dict[str, Any]:
    doc = analyses.find_one({"analysis_id": analysis_id})
    if not doc:
        raise HTTPException(404, "Analysis not found")
    doc.pop("images", None)
    return serialize(doc)


@app.post("/api/analyses/{analysis_id}/feedback", status_code=201)
def save_feedback(analysis_id: str, body: dict[str, Any]) -> dict[str, Any]:
    if not analyses.find_one({"analysis_id": analysis_id}, {"_id": 1}):
        raise HTTPException(404, "Analysis not found")
    action = body.get("action")
    if action not in {"agree", "disagree", "needs_review"}:
        raise HTTPException(400, "action must be agree, disagree, or needs_review")
    record = {"analysis_id": analysis_id, "action": action, "note": str(body.get("note", ""))[:2000], "created_at": utcnow()}
    inserted = feedback.insert_one(record)
    record["_id"] = inserted.inserted_id
    return serialize(record)
