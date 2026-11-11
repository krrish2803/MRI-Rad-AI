import json
from typing import Any

from pydantic import ValidationError

from app.schemas import VisionResult


class InvalidModelOutput(Exception):
    def __init__(
        self,
        message: str,
        raw_text: str,
        input_tokens: int = 0,
        output_tokens: int = 0,
        cost_usd: float | None = None,
    ):
        super().__init__(message)
        self.raw_text = raw_text
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        self.cost_usd = cost_usd


def extract_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].lstrip()
    start = cleaned.find("{")
    if start < 0:
        raise ValueError("No JSON object found")
    depth = 0
    in_string = False
    escaped = False
    for i in range(start, len(cleaned)):
        char = cleaned[i]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
        elif char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                parsed = json.loads(cleaned[start : i + 1])
                if not isinstance(parsed, dict):
                    raise ValueError("JSON result must be an object")
                return parsed
    raise ValueError("JSON object is incomplete")


def parse_vision_result(text: str, image_count: int) -> VisionResult:
    try:
        result = VisionResult.model_validate(extract_json_object(text))
    except (ValueError, json.JSONDecodeError, ValidationError) as exc:
        raise InvalidModelOutput(str(exc), text) from exc
    indexes = [item.image_index for item in result.image_observations]
    if any(index > image_count for index in indexes):
        raise InvalidModelOutput("image_index exceeds the number of input images", text)
    if set(indexes) != set(range(1, image_count + 1)):
        raise InvalidModelOutput(
            "the response must include exactly one observation per input image", text
        )
    return result
