import os
from datetime import datetime

from app.core.config import AWS_S3_BUCKET, MERGED_DIR, OUTPUT_DIR, RAW_DIR
from app.services.ffmpeg_processor import cut_exact, merge_segments
from app.services.hikvision_client import HikvisionClient
from app.services.segment_downloader import download_segments
from app.services.uploader import upload_to_s3
from app.services.utils import calc_offsets, clean, ensure_dirs, validate_times


def process_single_job(cam_id, camcfg, start, end):
    validate_times(start, end)

    tag = f"{cam_id}_{start.replace(':','-')}_{end.replace(':','-')}"
    raw = f"{RAW_DIR}{tag}"; mer = f"{MERGED_DIR}{tag}"; out = f"{OUTPUT_DIR}{tag}"
    ensure_dirs([raw, mer, out])

    client = HikvisionClient(
        camcfg["base_url"], camcfg["username"], camcfg["password"]
    )
    segs = client.search_segments(start, end)
    if not segs:
        raise Exception("No segments")

    seg_files = download_segments(camcfg, segs, raw)

    merged = os.path.join(mer, "merged.mp4")
    merge_segments(seg_files, merged)

    start_off = calc_offsets(segs, start)
    duration = (
        datetime.fromisoformat(end) - datetime.fromisoformat(start)
    ).total_seconds()
    end_off = start_off + duration

    final = os.path.join(out, "final.mp4")
    cut_exact(merged, final, str(start_off), str(end_off))

    key = f"cctv/{cam_id}/{tag}.mp4"
    url = upload_to_s3(final, AWS_S3_BUCKET, key)

    clean(raw); clean(mer); clean(out)
    return {"camera_id": cam_id, "start": start, "end": end, "s3": url}
