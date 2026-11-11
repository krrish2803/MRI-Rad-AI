from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "dev"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "mriradai"
    storage_dir: Path = Path("./storage")
    nvidia_api_key: str | None = None
    nvidia_model: str = "moonshotai/kimi-k2.5"
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_timeout_seconds: int = 120
    nvidia_max_retries: int = 3
    price_input_per_mtok: float | None = None
    price_output_per_mtok: float | None = None
    max_upload_mb: int = 50
    slices_per_sequence: int = 5
    max_images_per_analysis: int = 15
    image_max_side_px: int = 1024
    keep_original_dicom: bool = False
    cors_origins: str = (
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"
    )
    mongodb_server_selection_timeout_ms: int = 3000
    nnunet_predict_command: str = "nnUNetv2_predict"
    nnunet_dataset_id: int = 5
    nnunet_configuration: str = "3d_fullres"
    nnunet_timeout_seconds: int = 7200
    nnunet_raw: Path | None = Field(default=None, validation_alias="nnUNet_raw")
    nnunet_preprocessed: Path | None = Field(
        default=None, validation_alias="nnUNet_preprocessed"
    )
    nnunet_results: Path | None = Field(default=None, validation_alias="nnUNet_results")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
