from __future__ import annotations

import base64
import time
from pathlib import Path
from typing import Any

import httpx

from app.config import Settings
from app.services.parsing import InvalidModelOutput, parse_vision_result

PROMPT_VERSION = "image-quality-only-v1.0"
SYSTEM_PROMPT = """You are a technical image-quality assistant for a prostate MRI research prototype.
You do not diagnose, detect, locate, or characterize cancer, lesions, suspicious regions, or any disease.
Do not assign PI-RADS, risk, confidence of disease, or recommend treatment. The only allowed output is:
technical image quality (motion, artifacts, contrast, orientation/readability), a brief technical observation
for each supplied image, and a brief limitation-aware summary. Do not infer clinical findings from anatomy.
Return exactly one JSON object matching the requested schema. Never include patient identifiers."""


def _content_text(message: dict[str, Any]) -> str:
    content = message.get("content", "")
    if isinstance(content, str):
        return content
    return "".join(part.get("text", "") for part in content if isinstance(part, dict))


def _usage(response: dict[str, Any]) -> tuple[int, int]:
    usage = response.get("usage") or {}
    in_tokens = usage.get("prompt_tokens", usage.get("input_tokens", 0)) or 0
    out_tokens = usage.get("completion_tokens", usage.get("output_tokens", 0)) or 0
    return int(in_tokens), int(out_tokens)


def _request(settings: Settings, messages: list[dict[str, Any]]) -> dict[str, Any]:
    body = {
        "model": settings.nvidia_model,
        "messages": messages,
        "max_tokens": 1200,
        "temperature": 0,
        "stream": False,
    }
    last_error = None
    for attempt in range(max(1, settings.nvidia_max_retries)):
        try:
            with httpx.Client(timeout=settings.nvidia_timeout_seconds) as client:
                response = client.post(
                    settings.nvidia_base_url.rstrip("/") + "/chat/completions",
                    headers={
                        "Authorization": "Bearer " + str(settings.nvidia_api_key),
                        "Content-Type": "application/json",
                    },
                    json=body,
                )
            if response.status_code == 429 or response.status_code >= 500:
                last_error = httpx.HTTPStatusError(
                    "NVIDIA service temporarily unavailable",
                    request=response.request,
                    response=response,
                )
                if attempt + 1 < settings.nvidia_max_retries:
                    time.sleep(min(2**attempt, 8))
                    continue
                raise last_error
            response.raise_for_status()
            return response.json()
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            last_error = exc
            if attempt + 1 < settings.nvidia_max_retries:
                time.sleep(min(2**attempt, 8))
                continue
            raise
    raise RuntimeError("NVIDIA request failed") from last_error


def analyze_images(
    settings: Settings, selected_images: list[dict[str, Any]]
) -> dict[str, Any]:
    content: list[dict[str, Any]] = [
        {
            "type": "text",
            "text": (
                "Review the supplied images for technical image quality only. Return JSON with exactly these keys: "
                "image_quality {rating: good|adequate|poor, limitations: string[]}, "
                "image_observations [{image_index: integer starting at 1, technical_observation: string}], "
                "summary: string. Include one observation per image. No medical or lesion findings."
            ),
        }
    ]
    for idx, item in enumerate(selected_images, start=1):
        content.append(
            {
                "type": "text",
                "text": f"Image {idx}. Sequence: {item['sequence_type']}. Slice index: {item['slice_index']}.",
            }
        )
        encoded = base64.b64encode(Path(item["path"]).read_bytes()).decode("ascii")
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": "data:image/png;base64," + encoded},
            }
        )
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": content},
    ]
    response = _request(settings, messages)
    text = _content_text(response.get("choices", [{}])[0].get("message", {}))
    input_tokens, output_tokens = _usage(response)
    try:
        parsed = parse_vision_result(text, len(selected_images))
    except InvalidModelOutput as invalid:
        repair_messages = messages + [
            {"role": "assistant", "content": invalid.raw_text},
            {
                "role": "user",
                "content": "Repair the prior response to valid JSON matching the schema. Validation error: "
                + str(invalid),
            },
        ]
        repaired = _request(settings, repair_messages)
        repair_text = _content_text(repaired.get("choices", [{}])[0].get("message", {}))
        extra_in, extra_out = _usage(repaired)
        input_tokens += extra_in
        output_tokens += extra_out
        try:
            parsed = parse_vision_result(repair_text, len(selected_images))
        except InvalidModelOutput as final_error:
            input_cost = settings.price_input_per_mtok
            output_cost = settings.price_output_per_mtok
            final_error.input_tokens = input_tokens
            final_error.output_tokens = output_tokens
            final_error.cost_usd = (
                None
                if input_cost is None or output_cost is None
                else round(
                    input_tokens * input_cost / 1_000_000
                    + output_tokens * output_cost / 1_000_000,
                    6,
                )
            )
            raise
        text = repair_text
    result = parsed.model_dump()
    result["image_observations"] = [
        {
            **observation,
            "upload_id": selected_images[observation["image_index"] - 1]["upload_id"],
            "sequence_type": selected_images[observation["image_index"] - 1][
                "sequence_type"
            ],
            "slice_index": selected_images[observation["image_index"] - 1][
                "slice_index"
            ],
        }
        for observation in result["image_observations"]
    ]
    input_cost = settings.price_input_per_mtok
    output_cost = settings.price_output_per_mtok
    cost = (
        None
        if input_cost is None or output_cost is None
        else round(
            input_tokens * input_cost / 1_000_000
            + output_tokens * output_cost / 1_000_000,
            6,
        )
    )
    return {
        "result": result,
        "raw_result": text,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_usd": cost,
    }
