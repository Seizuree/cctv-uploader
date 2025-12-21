import os, shutil
from datetime import datetime


def ensure_dirs(dirs):
    for d in dirs:
        os.makedirs(d, exist_ok=True)


def clean(path):
    if os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)


def parse_time(t):
    try:
        return datetime.fromisoformat(t)
    except Exception:
        raise ValueError("Invalid datetime format")


def validate_times(start, end):
    s = parse_time(start)
    e = parse_time(end)
    if s >= e:
        raise ValueError("Start must be < end")
    if (e - s).total_seconds() > 86400:
        raise ValueError("Duration exceeds 24h limit")
    return s, e


def calc_offsets(segments, req_start):
    rs = parse_time(req_start)
    fs = parse_time(segments[0]["start"])
    return (rs - fs).total_seconds()
