import subprocess


def merge_segments(seg_files, merged_path):
    txt = merged_path + ".txt"
    with open(txt, "w") as f:
        for s in seg_files:
            f.write(f"file '{s}'\n")

    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        txt,
        "-c",
        "copy",
        merged_path,
    ]
    subprocess.run(cmd, check=True)
    return merged_path


def cut_exact(merged_path, outpath, s, e):
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        merged_path,
        "-ss",
        s,
        "-to",
        e,
        "-c",
        "copy",
        outpath,
    ]
    subprocess.run(cmd, check=True)
    return outpath
