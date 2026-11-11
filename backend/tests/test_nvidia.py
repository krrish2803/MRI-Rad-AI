import json

import pytest

from app.config import get_settings
from app.services.nvidia import analyze_images
from app.services.parsing import InvalidModelOutput


def test_analysis_payload_is_scoped_to_technical_quality(tmp_path, monkeypatch):
    path = tmp_path / "slice.png"
    path.write_bytes(b"png-for-mocked-provider")
    captured = {}

    def fake_request(settings, messages):
        captured["messages"] = messages
        return {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "image_quality": {
                                    "rating": "adequate",
                                    "limitations": ["low contrast"],
                                },
                                "image_observations": [
                                    {
                                        "image_index": 1,
                                        "technical_observation": "Visible anatomy is in frame.",
                                    }
                                ],
                                "summary": "Technical review only.",
                            }
                        )
                    }
                }
            ],
            "usage": {"prompt_tokens": 100, "completion_tokens": 30},
        }

    monkeypatch.setattr("app.services.nvidia._request", fake_request)
    settings = get_settings()
    result = analyze_images(
        settings,
        [
            {
                "path": str(path),
                "upload_id": "upload-a",
                "sequence_type": "T2",
                "slice_index": 0,
            }
        ],
    )
    assert result["input_tokens"] == 100
    assert result["output_tokens"] == 30
    assert result["result"]["image_observations"][0]["upload_id"] == "upload-a"
    system_prompt = captured["messages"][0]["content"].lower()
    assert "do not diagnose" in system_prompt
    assert (
        "do not diagnose, detect, locate, or characterize cancer, lesions"
        in system_prompt
    )


def test_invalid_response_gets_one_repair_call(tmp_path, monkeypatch):
    path = tmp_path / "slice.png"
    path.write_bytes(b"png-for-mocked-provider")
    calls = []
    fixed = json.dumps(
        {
            "image_quality": {"rating": "good", "limitations": []},
            "image_observations": [
                {"image_index": 1, "technical_observation": "Readable."}
            ],
            "summary": "Technical review.",
        }
    )

    def fake_request(settings, messages):
        calls.append(messages)
        content = "not valid json" if len(calls) == 1 else fixed
        return {
            "choices": [{"message": {"content": content}}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5},
        }

    monkeypatch.setattr("app.services.nvidia._request", fake_request)
    result = analyze_images(
        get_settings(),
        [
            {
                "path": str(path),
                "upload_id": "upload-a",
                "sequence_type": "ADC",
                "slice_index": 1,
            }
        ],
    )
    assert len(calls) == 2
    assert result["input_tokens"] == 20
    assert result["output_tokens"] == 10


def test_invalid_after_repair_preserves_both_call_usages(tmp_path, monkeypatch):
    path = tmp_path / "slice.png"
    path.write_bytes(b"mock")
    monkeypatch.setattr(
        "app.services.nvidia._request",
        lambda settings, messages: {
            "choices": [{"message": {"content": "not json"}}],
            "usage": {"prompt_tokens": 4, "completion_tokens": 3},
        },
    )
    with pytest.raises(InvalidModelOutput) as error:
        analyze_images(
            get_settings(),
            [
                {
                    "path": str(path),
                    "upload_id": "u",
                    "sequence_type": "T2",
                    "slice_index": 0,
                }
            ],
        )
    assert error.value.input_tokens == 8
    assert error.value.output_tokens == 6
