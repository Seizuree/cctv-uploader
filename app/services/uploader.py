import boto3


def upload_to_s3(local, bucket, key):
    boto3.client("s3").upload_file(local, bucket, key)
    return f"s3://{bucket}/{key}"
