import boto3

from app.core.config import GCS_ACCESS_KEY, GCS_SECRET_KEY


def get_gcs_client():
    return boto3.client(
        "s3",
        endpoint_url="https://storage.googleapis.com",
        aws_access_key_id=GCS_ACCESS_KEY,
        aws_secret_access_key=GCS_SECRET_KEY,
    )


def upload_to_gcs(local, bucket_name, blob_name):
    client = get_gcs_client()
    client.upload_file(local, bucket_name, blob_name)
    return f"gs://{bucket_name}/{blob_name}"
