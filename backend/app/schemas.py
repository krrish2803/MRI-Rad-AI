from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class SequenceType(str, Enum):
    T2 = "T2"
    DWI = "DWI"
    ADC = "ADC"
    OTHER = "OTHER"


class AnalysisStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class UploadResponse(BaseModel):
    upload_id: UUID
    sequence_type: SequenceType
    source_format: str
    slice_count: int
    width: int
    height: int
    size_bytes: int
    status: str = "ready"
    created_at: str


class AnalysisCreate(BaseModel):
    upload_ids: list[UUID] = Field(min_length=1, max_length=3)
    slice_indices: dict[str, list[int]] | None = None

    @field_validator("upload_ids")
    @classmethod
    def unique_uploads(cls, value: list[UUID]) -> list[UUID]:
        if len(set(value)) != len(value):
            raise ValueError("upload_ids must be distinct")
        return value


class AnalysisAccepted(BaseModel):
    analysis_id: UUID
    status: AnalysisStatus
    selected_images: int
    disclaimer: str


class FeedbackType(str, Enum):
    agree = "agree"
    disagree = "disagree"
    needs_review = "needs_review"
    zone_boundary_issue = "zone_boundary_issue"


class FeedbackCreate(BaseModel):
    feedback_type: FeedbackType
    zone_name: str | None = Field(default=None, pattern="^(PZ|TZ)$")
    notes: str = Field(default="", max_length=2000)


class ImageQuality(BaseModel):
    rating: str = Field(pattern="^(good|adequate|poor)$")
    limitations: list[str] = Field(max_length=10)


class ImageObservation(BaseModel):
    image_index: int = Field(ge=1)
    technical_observation: str = Field(max_length=300)


class VisionResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    image_quality: ImageQuality
    image_observations: list[ImageObservation] = Field(max_length=12)
    summary: str = Field(max_length=500)

    @model_validator(mode="after")
    def unique_images(self):
        indexes = [item.image_index for item in self.image_observations]
        if len(indexes) != len(set(indexes)):
            raise ValueError("image_observations must not repeat an image_index")
        return self
