import pytest

from app.services.parsing import (
    InvalidModelOutput,
    extract_json_object,
    parse_vision_result,
)

VALID = '{"image_quality":{"rating":"adequate","limitations":[]},"image_observations":[{"image_index":1,"technical_observation":"Slice is readable."}],"summary":"Technical image quality only."}'


def test_extracts_json_from_prose_and_code_fence():
    assert (
        extract_json_object("Result: " + VALID)["summary"]
        == "Technical image quality only."
    )
    assert (
        extract_json_object("```json\n" + VALID + "\n```")["image_quality"]["rating"]
        == "adequate"
    )


def test_validates_schema_and_image_index():
    assert parse_vision_result(VALID, 1).image_observations[0].image_index == 1
    with pytest.raises(InvalidModelOutput):
        parse_vision_result(VALID, 0)


@pytest.mark.parametrize(
    "raw",
    ["not json", '{"image_quality":', VALID.replace("technical_observation", "lesion")],
)
def test_invalid_or_out_of_schema_output_is_rejected(raw):
    with pytest.raises(InvalidModelOutput):
        parse_vision_result(raw, 1)
