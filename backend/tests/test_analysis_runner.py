from datetime import UTC, datetime

from app import db
from app.services import analysis_runner


def test_runner_persists_result_and_is_idempotent(client, tmp_path, monkeypatch):
    now = datetime.now(UTC)
    slice_path = tmp_path / "slice.png"
    slice_path.write_bytes(b"normalized-image")
    db.uploads().insert_one({"upload_id": "upload-1", "slice_paths": [str(slice_path)]})
    db.analyses().insert_one(
        {
            "analysis_id": "analysis-1",
            "status": "pending",
            "selected_slices": [
                {"upload_id": "upload-1", "sequence_type": "T2", "slice_index": 0}
            ],
            "created_at": now,
        }
    )
    calls = []

    def analyze(settings, images):
        calls.append(images)
        return {
            "result": {"summary": "Technical quality."},
            "raw_result": "{}",
            "input_tokens": 9,
            "output_tokens": 2,
            "cost_usd": None,
        }

    monkeypatch.setattr(analysis_runner, "analyze_images", analyze)
    analysis_runner.run_analysis("analysis-1")
    saved = db.analyses().find_one({"analysis_id": "analysis-1"})
    assert saved["status"] == "completed"
    assert saved["result"]["summary"] == "Technical quality."
    assert saved["input_tokens"] == 9 and saved["output_tokens"] == 2
    assert saved["prompt_version"] == "image-quality-only-v1.0"
    analysis_runner.run_analysis("analysis-1")
    assert len(calls) == 1


def test_runner_stores_generic_failure_and_raw_invalid_output(
    client, tmp_path, monkeypatch
):
    now = datetime.now(UTC)
    slice_path = tmp_path / "slice.png"
    slice_path.write_bytes(b"normalized-image")
    db.uploads().insert_one({"upload_id": "upload-2", "slice_paths": [str(slice_path)]})
    db.analyses().insert_one(
        {
            "analysis_id": "analysis-2",
            "status": "pending",
            "selected_slices": [
                {"upload_id": "upload-2", "sequence_type": "ADC", "slice_index": 0}
            ],
            "created_at": now,
        }
    )

    class InvalidModelOutput(Exception):
        raw_text = "invalid hidden model response"

    def fail(settings, images):
        raise InvalidModelOutput("bad json")

    monkeypatch.setattr(analysis_runner, "analyze_images", fail)
    analysis_runner.run_analysis("analysis-2")
    saved = db.analyses().find_one({"analysis_id": "analysis-2"})
    assert saved["status"] == "failed"
    assert (
        saved["error_message"]
        == "Model output could not be validated after one repair attempt."
    )
    assert saved["raw_result"] == "invalid hidden model response"
