import os
from concurrent.futures import ThreadPoolExecutor

from app.services.hikvision_client import HikvisionClient


def download_segments(camcfg, segments, outdir):
    client = HikvisionClient(
        camcfg["base_url"], camcfg["username"], camcfg["password"]
    )
    os.makedirs(outdir, exist_ok=True)

    def task(seg):
        path = os.path.join(outdir, seg["fileName"])
        client.download_segment(seg["fileName"], path)
        return path

    with ThreadPoolExecutor(max_workers=5) as exe:
        return list(exe.map(task, segments))
