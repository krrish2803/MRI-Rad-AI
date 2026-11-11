from app import db
from app.api import routes


def upload_file(client, data, sequence="T2", name="scan.png"):
    return client.post(
        "/api/v1/uploads",
        data={"sequence_type": sequence},
        files={"file": (name, data, "application/octet-stream")},
    )


def test_upload_deduplicates_and_serves_preview(client, image_bytes):
    first = upload_file(client, image_bytes)
    assert first.status_code == 201
    body = first.json()
    assert body["source_format"] == "png"
    assert body["slice_count"] == 1
    duplicate = upload_file(client, image_bytes)
    assert duplicate.status_code == 200
    assert duplicate.json()["upload_id"] == body["upload_id"]
    preview = client.get(f"/api/v1/uploads/{body['upload_id']}/slices/0")
    assert preview.status_code == 200
    assert preview.headers["content-type"] == "image/png"


def test_upload_accepts_dicom_and_stores_no_patient_header(client, dicom_bytes):
    response = upload_file(client, dicom_bytes, sequence="ADC", name="scan.dcm")
    assert response.status_code == 201
    body = response.json()
    assert body["source_format"] == "dicom"
    assert body["slice_count"] == 1
    stored = db.uploads().find_one({"upload_id": body["upload_id"]})
    assert "PatientName" not in stored
    assert stored["original_path"] is None


def test_upload_returns_413_for_oversized_image(client, image_bytes, monkeypatch):
    from app.config import get_settings

    monkeypatch.setattr(get_settings(), "max_upload_mb", 0)
    response = upload_file(client, image_bytes)
    assert response.status_code == 413


def test_rejects_bad_magic_and_bad_sequence(client):
    bad = upload_file(client, b"not a png", name="renamed.png")
    assert bad.status_code == 415
    seq = client.post(
        "/api/v1/uploads",
        data={"sequence_type": "CT"},
        files={"file": ("scan.png", b"x", "image/png")},
    )
    assert seq.status_code == 422


def test_analysis_poll_and_feedback_contract(client, image_bytes, monkeypatch):
    uploaded = upload_file(client, image_bytes).json()

    def complete(analysis_id):
        db.analyses().update_one(
            {"analysis_id": analysis_id},
            {
                "$set": {
                    "status": "completed",
                    "result": {
                        "image_quality": {"rating": "good", "limitations": []},
                        "image_observations": [
                            {"image_index": 1, "technical_observation": "Readable."}
                        ],
                        "summary": "Technical quality only.",
                    },
                    "input_tokens": 40,
                    "output_tokens": 20,
                    "processing_ms": 5,
                    "completed_at": __import__("datetime").datetime.now(
                        __import__("datetime").timezone.utc
                    ),
                }
            },
        )

    monkeypatch.setattr(routes, "run_analysis", complete)
    created = client.post(
        "/api/v1/analyses", json={"upload_ids": [uploaded["upload_id"]]}
    )
    assert created.status_code == 202
    analysis_id = created.json()["analysis_id"]
    result = client.get(f"/api/v1/analyses/{analysis_id}").json()
    assert result["status"] == "completed"
    assert (
        result["disclaimer"]
        == "Research prototype. Not for clinical use. Requires radiologist review."
    )
    assert "lesions" not in result
    image_review = client.get(f"/api/v1/image-reviews/{analysis_id}").json()
    assert image_review["review_id"] == analysis_id
    assert image_review["observations"][0]["technical_observation"] == "Readable."
    for feedback_type in ("agree", "disagree", "needs_review"):
        feedback_response = client.post(
            f"/api/v1/analyses/{analysis_id}/feedback",
            json={"feedback_type": feedback_type},
        )
        assert feedback_response.status_code == 201
    assert client.get("/api/v1/analyses?limit=10").json()["items"]


def test_feedback_requires_zone_name_for_boundary_review(
    client, image_bytes, monkeypatch
):
    uploaded = upload_file(client, image_bytes).json()

    def complete(analysis_id):
        db.analyses().update_one(
            {"analysis_id": analysis_id}, {"$set": {"status": "completed"}}
        )

    monkeypatch.setattr(routes, "run_analysis", complete)
    analysis_id = client.post(
        "/api/v1/analyses", json={"upload_ids": [uploaded["upload_id"]]}
    ).json()["analysis_id"]
    response = client.post(
        f"/api/v1/analyses/{analysis_id}/feedback",
        json={"feedback_type": "zone_boundary_issue"},
    )
    assert response.status_code == 422
    saved = client.post(
        f"/api/v1/analyses/{analysis_id}/feedback",
        json={"feedback_type": "zone_boundary_issue", "zone_name": "PZ"},
    )
    assert saved.status_code == 201


def test_feedback_rejected_while_analysis_pending(client, image_bytes, monkeypatch):
    uploaded = upload_file(client, image_bytes).json()
    monkeypatch.setattr(routes, "run_analysis", lambda analysis_id: None)
    analysis_id = client.post(
        "/api/v1/analyses", json={"upload_ids": [uploaded["upload_id"]]}
    ).json()["analysis_id"]
    response = client.post(
        f"/api/v1/analyses/{analysis_id}/feedback",
        json={"feedback_type": "agree"},
    )
    assert response.status_code == 409


def test_missing_nvidia_key_fails_fast(client, image_bytes, monkeypatch):
    from app import config

    settings = config.get_settings()
    monkeypatch.setattr(settings, "nvidia_api_key", None)
    uploaded = upload_file(client, image_bytes).json()
    response = client.post(
        "/api/v1/analyses", json={"upload_ids": [uploaded["upload_id"]]}
    )
    assert response.status_code == 503


def test_zone_jobs_contract_uses_expected_multipart_fields(client, monkeypatch):
    monkeypatch.setattr(routes, "zone_model_status", lambda settings: "trained_model_missing")
    response = client.post(
        "/api/v1/zone-jobs",
        files={
            "t2": ("t2.nii.gz", b"nifti", "application/gzip"),
            "adc": ("adc.nii.gz", b"nifti", "application/gzip"),
        },
    )
    assert response.status_code == 503
    assert "five trained folds" in response.json()["error"]["message"]


def test_health_reports_database_and_vlm(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["db"] == "ok"
    openapi = client.get("/openapi.json").json()
    assert "/api/v1/uploads" in openapi["paths"]
    assert "/api/v1/analyses/{analysis_id}" in openapi["paths"]
    assert "/api/v1/zone-segmentations" in openapi["paths"]
    assert "/api/v1/zone-jobs" in openapi["paths"]
    assert "/api/v1/image-reviews/{review_id}" in openapi["paths"]
