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

GCS_BUCKET = os.getenv("GCS_BUCKET")
GCS_ACCESS_KEY = os.getenv("GCS_ACCESS_KEY")
GCS_SECRET_KEY = os.getenv("GCS_SECRET_KEY")

TEMP_DIR = "/tmp/cctv/"
RAW_DIR = TEMP_DIR + "raw/"
MERGED_DIR = TEMP_DIR + "merged/"
OUTPUT_DIR = TEMP_DIR + "output/"

MAX_THREADS = 10

EXACT_CUT = os.getenv("EXACT_CUT", "true").lower() == "true"
TRACK_ID = os.getenv("TRACK_ID", "101")
