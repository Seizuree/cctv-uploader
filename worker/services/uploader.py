import logging
import time

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from config import settings

logger = logging.getLogger(__name__)

# Retry config for boto3
RETRY_CONFIG = Config(
    retries={
        "max_attempts": 5,
        "mode": "adaptive",
    }
)


def get_gcs_client():
    return boto3.client(
        "s3",
        endpoint_url="https://storage.googleapis.com",
        aws_access_key_id=settings.GCS_ACCESS_KEY,
        aws_secret_access_key=settings.GCS_SECRET_KEY,
        config=RETRY_CONFIG,
    )


def upload_to_gcs(
    local: str,
    bucket_name: str,
    blob_name: str,
    max_retries: int = 3,
) -> str:
    """Upload file to GCS with retry logic."""
    client = get_gcs_client()
    last_error: Exception | None = None

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Uploading {blob_name} to gs://{bucket_name} (attempt {attempt})")
            client.upload_file(local, bucket_name, blob_name)
            logger.info(f"Successfully uploaded {blob_name}")
            return f"gs://{bucket_name}/{blob_name}"
        except ClientError as e:
            last_error = e
            logger.warning(f"Upload attempt {attempt} failed: {e}")
            if attempt < max_retries:
                sleep_time = 2 ** attempt  # Exponential backoff: 2, 4, 8 seconds
                logger.info(f"Retrying in {sleep_time}s...")
                time.sleep(sleep_time)

    raise Exception(f"Failed to upload after {max_retries} attempts: {last_error}")
