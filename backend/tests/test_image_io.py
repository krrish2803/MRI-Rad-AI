import io

import numpy as np
import pytest
from PIL import Image
from pydicom.dataset import FileDataset, FileMetaDataset
from pydicom.uid import (
    ExplicitVRLittleEndian,
    SecondaryCaptureImageStorage,
    generate_uid,
)

from app.services.image_io import (
    InvalidImage,
    UnsupportedImage,
    detect_format,
    normalize_image,
)


def make_dicom():
    stream = io.BytesIO()
    meta = FileMetaDataset()
    meta.TransferSyntaxUID = ExplicitVRLittleEndian
    meta.MediaStorageSOPClassUID = SecondaryCaptureImageStorage
    meta.MediaStorageSOPInstanceUID = generate_uid()
    meta.ImplementationClassUID = generate_uid()
    ds = FileDataset(None, {}, file_meta=meta, preamble=b"\0" * 128)
    ds.SOPClassUID = meta.MediaStorageSOPClassUID
    ds.SOPInstanceUID = meta.MediaStorageSOPInstanceUID
    ds.PatientName = "ShouldNotBeStored"
    ds.Modality = "MR"
    ds.Rows = 8
    ds.Columns = 10
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    ds.BitsAllocated = 16
    ds.BitsStored = 16
    ds.HighBit = 15
    ds.PixelRepresentation = 1
    ds.RescaleSlope = 2
    ds.RescaleIntercept = -10
    ds.WindowCenter = 0
    ds.WindowWidth = 40
    ds.PixelData = np.arange(80, dtype=np.int16).reshape(8, 10).tobytes()
    ds.save_as(stream, enforce_file_format=True)
    return stream.getvalue()


def test_detects_magic_bytes_and_rejects_renamed_text():
    png = io.BytesIO()
    Image.new("L", (5, 5), 100).save(png, format="PNG")
    assert detect_format(png.getvalue()) == "png"
    assert detect_format(b"\xff\xd8\xff" + b"x") == "jpeg"
    with pytest.raises(UnsupportedImage):
        detect_format(b"plain text with a .png filename")


def test_png_is_grayscale_and_resized(tmp_path):
    raw = io.BytesIO()
    Image.new("RGB", (200, 100), (30, 80, 140)).save(raw, format="PNG")
    result = normalize_image(raw.getvalue(), "png", tmp_path / "up", max_side=64)
    assert result["slice_count"] == 1
    assert (result["width"], result["height"]) == (64, 32)
    assert Image.open(result["slice_paths"][0]).mode == "L"


def test_dicom_slope_intercept_multiframe_and_no_patient_header_saved(tmp_path):
    result = normalize_image(make_dicom(), "dicom", tmp_path / "dicom", max_side=64)
    assert result["slice_count"] == 1
    assert result["original_path"] is None
    normalized = Image.open(result["slice_paths"][0])
    assert normalized.mode == "L"
    assert normalized.getpixel((0, 0)) == 64
    assert not (tmp_path / "dicom" / "original.bin").exists()


def test_invalid_png_raises_validation_error(tmp_path):
    with pytest.raises(InvalidImage):
        normalize_image(b"\x89PNG\r\n\x1a\nnot-an-image", "png", tmp_path / "bad", 64)
