import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

from services.hikvision_client import HikvisionClient


def download_segments(
    camcfg: dict[str, str],
    segments: list[dict[str, str | None]],
    outdir: str,
) -> list[tuple[str, datetime]]:
    client = HikvisionClient(
        camcfg["base_url"], camcfg["username"], camcfg["password"]
    )
    os.makedirs(outdir, exist_ok=True)

    def task(seg: dict[str, str | None]) -> tuple[str, datetime]:
        start_str = seg["start"]
        if start_str is None:
            raise ValueError("Segment start time is None")
        seg_dt = datetime.strptime(
            start_str.replace("Z", ""), "%Y-%m-%dT%H:%M:%S"
        )
        filename = f"raw_{seg_dt.strftime('%Y%m%d_%H%M%S')}.mp4"
        path = os.path.join(outdir, filename)

        if os.path.exists(path) and os.path.getsize(path) > 1024:
            return (path, seg_dt)

        playback_uri = seg["playbackURI"]
        if playback_uri is None:
            raise ValueError("Segment playbackURI is None")
        client.download_segment(playback_uri, path)
        return (path, seg_dt)

    with ThreadPoolExecutor(max_workers=5) as exe:
        results = list(exe.map(task, segments))

    results.sort(key=lambda x: x[1])
    return results
