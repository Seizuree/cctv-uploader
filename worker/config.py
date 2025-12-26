import sys
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "postgresql://cctv:cctv@localhost:5432/cctv"

    # Camera encryption
    CAMERA_ENCRYPTION_KEY: str = ""

    # GCS
    GCS_BUCKET: str = ""
    GCS_ACCESS_KEY: str = ""
    GCS_SECRET_KEY: str = ""

    # Worker
    BATCH_INTERVAL_SECONDS: int = 60
    BATCH_SIZE: int = 10
    TEMP_VIDEO_DIR: str = "/tmp/cctv"
    EXACT_CUT: bool = False

    # Hikvision
    TRACK_ID: str = "101"

    # HTTP API
    WORKER_HOST: str = "0.0.0.0"
    WORKER_PORT: int = 8001
    AUTO_BATCH_ENABLED: bool = True


settings = Settings()


class ConfigurationError(Exception):
    """Raised when required configuration is missing."""
    pass


def validate_config() -> None:
    """Validate required configuration. Raises ConfigurationError if invalid."""
    errors: list[str] = []

    if not settings.CAMERA_ENCRYPTION_KEY:
        errors.append("CAMERA_ENCRYPTION_KEY is required")

    if not settings.GCS_BUCKET:
        errors.append("GCS_BUCKET is required")

    if not settings.GCS_ACCESS_KEY:
        errors.append("GCS_ACCESS_KEY is required")

    if not settings.GCS_SECRET_KEY:
        errors.append("GCS_SECRET_KEY is required")

    if not settings.DATABASE_URL:
        errors.append("DATABASE_URL is required")

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        raise ConfigurationError(f"Missing required configuration: {', '.join(errors)}")
