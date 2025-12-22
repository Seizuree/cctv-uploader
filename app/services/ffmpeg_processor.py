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
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
    return merged_path


def cut_exact(merged_path, outpath, start_offset, duration, exact_cut=False):
    cmd = ["ffmpeg", "-y"]

    cmd.extend(["-ss", str(start_offset)])
    cmd.extend(["-i", merged_path])
    cmd.extend(["-t", str(duration)])

    if exact_cut:
        cmd.extend(["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac"])
    else:
        cmd.extend(["-c", "copy"])

    cmd.append(outpath)
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
    return outpath
