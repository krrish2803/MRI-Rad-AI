import io

import mongomock
import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from pydicom.dataset import FileDataset, FileMetaDataset
from pydicom.uid import (
    ExplicitVRLittleEndian,
    SecondaryCaptureImageStorage,
    generate_uid,
)


@pytest.fixture
def image_bytes():
    output = io.BytesIO()
    Image.new("RGB", (24, 16), (120, 90, 60)).save(output, format="PNG")
    return output.getvalue()


@pytest.fixture
def dicom_bytes():
    stream = io.BytesIO()
    meta = FileMetaDataset()
    meta.TransferSyntaxUID = ExplicitVRLittleEndian
    meta.MediaStorageSOPClassUID = SecondaryCaptureImageStorage
    meta.MediaStorageSOPInstanceUID = generate_uid()
    meta.ImplementationClassUID = generate_uid()
    ds = FileDataset(None, {}, file_meta=meta, preamble=b"\0" * 128)
    ds.SOPClassUID = meta.MediaStorageSOPClassUID
    ds.SOPInstanceUID = meta.MediaStorageSOPInstanceUID
    ds.PatientName = "MustNotPersist"
    ds.Rows, ds.Columns = 8, 10
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    ds.BitsAllocated = ds.BitsStored = 16
    ds.HighBit = 15
    ds.PixelRepresentation = 1
    ds.RescaleSlope, ds.RescaleIntercept = 2, -10
    ds.PixelData = np.arange(80, dtype=np.int16).reshape(8, 10).tobytes()
    ds.save_as(stream, enforce_file_format=True)
    return stream.getvalue()


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("NVIDIA_API_KEY", "test-key")
    monkeypatch.setenv("STORAGE_DIR", str(tmp_path / "storage"))
    monkeypatch.setenv("MONGODB_DATABASE", "mriradai_test")
    from app import config, db, main

    mock_client = mongomock.MongoClient()
    monkeypatch.setattr(db, "get_client", lambda: mock_client)
    monkeypatch.setattr(db, "close_database", lambda: None)
    monkeypatch.setattr(main, "close_database", lambda: None)
    config.get_settings.cache_clear()
    with TestClient(main.app) as test_client:
        yield test_client
    config.get_settings.cache_clear()


@pytest.fixture(autouse=True)
def restore_environment(monkeypatch):
    for name in ("NVIDIA_API_KEY", "STORAGE_DIR", "MONGODB_DATABASE"):
        monkeypatch.delenv(name, raising=False)
