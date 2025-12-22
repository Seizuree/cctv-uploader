import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

from app.services.hikvision_client import HikvisionClient


def download_segments(camcfg, segments, outdir):
    client = HikvisionClient(
        camcfg["base_url"], camcfg["username"], camcfg["password"]
    )
    os.makedirs(outdir, exist_ok=True)

    def task(seg):
        start_str = seg["start"]
        seg_dt = datetime.strptime(
            start_str.replace("Z", ""), "%Y-%m-%dT%H:%M:%S"
        )
        filename = f"raw_{seg_dt.strftime('%Y%m%d_%H%M%S')}.mp4"
        path = os.path.join(outdir, filename)

        if os.path.exists(path) and os.path.getsize(path) > 1024:
            return (path, seg_dt)

        client.download_segment(seg["playbackURI"], path)
        return (path, seg_dt)

    with ThreadPoolExecutor(max_workers=5) as exe:
        results = list(exe.map(task, segments))

    results.sort(key=lambda x: x[1])
    return results
