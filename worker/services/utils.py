import logging
import os
import shutil
from datetime import datetime

logger = logging.getLogger(__name__)

# Minimum required disk space in bytes (1 GB)
MIN_DISK_SPACE_BYTES = 1 * 1024 * 1024 * 1024


def ensure_dirs(dirs: list[str]) -> None:
    for d in dirs:
        os.makedirs(d, exist_ok=True)


def clean(path: str) -> None:
    if os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)


def parse_time(t: str) -> datetime:
    try:
        return datetime.fromisoformat(t.replace("Z", ""))
    except Exception:
        raise ValueError("Invalid datetime format")


def validate_times(start: str, end: str) -> tuple[datetime, datetime]:
    s = parse_time(start)
    e = parse_time(end)
    if s >= e:
        raise ValueError("Start must be < end")
    if (e - s).total_seconds() > 86400:
        raise ValueError("Duration exceeds 24h limit")
    return s, e


def calc_offsets(segments: list[dict[str, str | None]], req_start: str) -> float:
    rs = parse_time(req_start)
    first_start = segments[0]["start"]
    if first_start is None:
        raise ValueError("First segment start time is None")
    fs = parse_time(first_start)
    return (rs - fs).total_seconds()


def check_disk_space(path: str, min_bytes: int = MIN_DISK_SPACE_BYTES) -> None:
    """
    Check if there's enough disk space available.
    Raises an exception if disk space is below minimum.
    """
    # Get the directory, create if not exists
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)

    stat = shutil.disk_usage(path)
    free_gb = stat.free / (1024 * 1024 * 1024)

    if stat.free < min_bytes:
        raise Exception(
            f"Insufficient disk space: {free_gb:.2f} GB available, "
            f"minimum {min_bytes / (1024 * 1024 * 1024):.2f} GB required"
        )

    logger.debug(f"Disk space check passed: {free_gb:.2f} GB available")


def get_disk_usage_info(path: str) -> dict[str, float]:
    """Get disk usage info in GB."""
    stat = shutil.disk_usage(path)
    return {
        "total_gb": stat.total / (1024 * 1024 * 1024),
        "used_gb": stat.used / (1024 * 1024 * 1024),
        "free_gb": stat.free / (1024 * 1024 * 1024),
    }
