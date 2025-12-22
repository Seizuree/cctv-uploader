import os
from datetime import datetime

from app.core.config import GCS_BUCKET, EXACT_CUT, MERGED_DIR, OUTPUT_DIR, RAW_DIR
from app.services.ffmpeg_processor import cut_exact, merge_segments
from app.services.hikvision_client import HikvisionClient
from app.services.segment_downloader import download_segments
from app.services.uploader import upload_to_gcs
from app.services.utils import clean, ensure_dirs, validate_times


def process_single_job(cam_id, camcfg, start, end):
    validate_times(start, end)

    tag = f"{cam_id}_{start.replace(':','-')}_{end.replace(':','-')}"
    raw = f"{RAW_DIR}{tag}"
    mer = f"{MERGED_DIR}{tag}"
    out = f"{OUTPUT_DIR}{tag}"
    ensure_dirs([raw, mer, out])

    client = HikvisionClient(
        camcfg["base_url"], camcfg["username"], camcfg["password"]
    )
    segs = client.search_segments(start, end)
    if not segs:
        raise Exception("No segments")

    seg_files = download_segments(camcfg, segs, raw)

    merged = os.path.join(mer, "merged.mp4")
    merge_segments([f[0] for f in seg_files], merged)

    file_start_time = seg_files[0][1]
    req_start = datetime.fromisoformat(start.replace("Z", ""))
    start_offset = (req_start - file_start_time).total_seconds()
    if start_offset < 0:
        start_offset = 0

    duration = (
        datetime.fromisoformat(end.replace("Z", "")) -
        datetime.fromisoformat(start.replace("Z", ""))
    ).total_seconds()

    final = os.path.join(out, "final.mp4")
    cut_exact(merged, final, start_offset, duration, EXACT_CUT)

    key = f"cctv/{cam_id}/{tag}.mp4"
    url = upload_to_gcs(final, GCS_BUCKET, key)

    clean(raw)
    clean(mer)
    clean(out)
    return {"camera_id": cam_id, "start": start, "end": end, "gcs": url}
