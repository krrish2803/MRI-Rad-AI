from __future__ import annotations

import io
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageOps


class UnsupportedImage(Exception):
    pass


class InvalidImage(Exception):
    pass


def detect_format(data: bytes) -> str:
    if len(data) >= 132 and data[128:132] == b"DICM":
        return "dicom"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    raise UnsupportedImage("File signature is not DICOM, PNG, or JPEG.")


def _window(
    frame: np.ndarray,
    center: float | None,
    width: float | None,
    volume_min: float,
    volume_max: float,
) -> np.ndarray:
    values = frame.astype(np.float32, copy=False)
    if center is not None and width is not None and width > 1:
        low, high = center - width / 2.0, center + width / 2.0
    else:
        low, high = volume_min, volume_max
    if high <= low:
        return np.zeros(values.shape, dtype=np.uint8)
    scaled = np.clip((values - low) / (high - low), 0, 1) * 255
    return np.rint(scaled).astype(np.uint8)


def _first_number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        if (
            isinstance(value, (list, tuple))
            or hasattr(value, "__iter__")
            and not isinstance(value, (str, bytes))
        ):
            value = next(iter(value))
        return float(value)
    except (TypeError, ValueError, StopIteration):
        return None


def _resize_gray(array: np.ndarray, max_side: int) -> Image.Image:
    im = Image.fromarray(array).convert("L")
    if max(im.size) > max_side:
        scale = max_side / max(im.size)
        im = im.resize(
            (max(1, round(im.width * scale)), max(1, round(im.height * scale))),
            Image.Resampling.LANCZOS,
        )
    return ImageOps.grayscale(im)


def _dicom_frames(data: bytes) -> list[np.ndarray]:
    try:
        import pydicom

        ds = pydicom.dcmread(io.BytesIO(data), force=False)
        if not hasattr(ds, "PixelData"):
            raise InvalidImage("DICOM contains no pixel data.")
        pixels = ds.pixel_array
    except InvalidImage:
        raise
    except Exception as exc:
        raise InvalidImage(
            "DICOM could not be decoded. Check that pixel data and a supported transfer syntax are present."
        ) from exc

    samples = int(getattr(ds, "SamplesPerPixel", 1) or 1)
    if samples > 1:
        if pixels.ndim == 3:
            pixels = pixels[None, ...]
        frames = [np.asarray(Image.fromarray(frame).convert("L")) for frame in pixels]
        return [frame.astype(np.float32) for frame in frames]

    pixels = np.asarray(pixels)
    if pixels.ndim == 2:
        pixels = pixels[None, ...]
    if pixels.ndim != 3:
        raise InvalidImage(
            "DICOM pixel data must be a 2D image or a multi-frame stack."
        )
    slope = float(getattr(ds, "RescaleSlope", 1) or 1)
    intercept = float(getattr(ds, "RescaleIntercept", 0) or 0)
    frames = pixels.astype(np.float32) * slope + intercept
    center = _first_number(getattr(ds, "WindowCenter", None))
    width = _first_number(getattr(ds, "WindowWidth", None))
    low, high = np.percentile(frames, [1, 99])
    if getattr(ds, "PhotometricInterpretation", "") == "MONOCHROME1":
        frames = high + low - frames
    return [_window(frame, center, width, float(low), float(high)) for frame in frames]


def normalize_image(
    data: bytes,
    source_format: str,
    output_dir: Path,
    max_side: int,
    keep_original: bool = False,
) -> dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)
    if source_format == "dicom":
        frames = _dicom_frames(data)
        images = [_resize_gray(frame.astype(np.uint8), max_side) for frame in frames]
    else:
        try:
            image = Image.open(io.BytesIO(data))
            image.load()
            images = [
                _resize_gray(
                    np.asarray(ImageOps.exif_transpose(image).convert("L")), max_side
                )
            ]
        except Exception as exc:
            raise InvalidImage("Image could not be decoded.") from exc

    if not images:
        raise InvalidImage("Image contains no readable slices.")
    for idx, image in enumerate(images):
        image.save(output_dir / f"slice_{idx:03d}.png", format="PNG", optimize=True)
    original_path = None
    if keep_original:
        original_path = output_dir / "original.bin"
        original_path.write_bytes(data)
    return {
        "slice_count": len(images),
        "width": images[0].width,
        "height": images[0].height,
        "slice_paths": [
            str(output_dir / f"slice_{idx:03d}.png") for idx in range(len(images))
        ],
        "original_path": str(original_path) if original_path else None,
    }
