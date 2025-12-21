import os
from dotenv import load_dotenv

load_dotenv()

CAMERAS = {
    "cam01": {
        "base_url": os.getenv("CAM01_URL"),
        "username": os.getenv("CAM01_USER"),
        "password": os.getenv("CAM01_PASS"),
    }
}

AWS_S3_BUCKET = os.getenv("AWS_BUCKET")

TEMP_DIR = "/tmp/cctv/"
RAW_DIR = TEMP_DIR + "raw/"
MERGED_DIR = TEMP_DIR + "merged/"
OUTPUT_DIR = TEMP_DIR + "output/"

MAX_THREADS = 10
