import logging
import os
import time

from sqlalchemy.orm import Session

from config import settings
from db.models import PackingItem, PackingStatus
from repositories import camera_repository, packing_repository, batch_job_repository, mini_clip_repository
from services.hikvision_client import HikvisionClient
from services.segment_downloader import download_segments
from services.ffmpeg_processor import merge_segments, cut_exact
from services.uploader import upload_to_gcs
from services.utils import ensure_dirs, clean, validate_times, check_disk_space

logger = logging.getLogger(__name__)

# Flag to signal batch loop to stop
batch_loop_shutdown = False


def process_single_item(
    db: Session,
    packing_item: PackingItem,
    batch_item_id: int,
) -> bool:
    """Process a single packing item. Returns True if successful."""
    # Track temp directories for cleanup
    temp_dirs: list[str] = []

    try:
        batch_job_repository.mark_item_processing(db, batch_item_id)

        # Get camera config
        workstation = packing_item.workstation
        camera_id = workstation.camera_id
        camcfg = camera_repository.get_camera_config(db, camera_id)

        if camcfg is None:
            raise Exception(f"Camera {camera_id} not found")

        if packing_item.start_time is None or packing_item.end_time is None:
            raise Exception("Start time or end time is not set")

        start_iso = packing_item.start_time.isoformat()
        end_iso = packing_item.end_time.isoformat()

        validate_times(start_iso, end_iso)

        # Check disk space before downloading
        check_disk_space(settings.TEMP_VIDEO_DIR)

        # Setup directories
        tag = f"{camera_id}_{packing_item.id}"
        raw_dir = os.path.join(settings.TEMP_VIDEO_DIR, "raw", tag)
        merged_dir = os.path.join(settings.TEMP_VIDEO_DIR, "merged", tag)
        output_dir = os.path.join(settings.TEMP_VIDEO_DIR, "output", tag)
        temp_dirs = [raw_dir, merged_dir, output_dir]
        ensure_dirs(temp_dirs)

        # Search and download segments from Hikvision
        client = HikvisionClient(
            camcfg["base_url"], camcfg["username"], camcfg["password"]
        )
        segs = client.search_segments(start_iso, end_iso)
        if not segs:
            raise Exception("No video segments found")

        seg_files = download_segments(camcfg, segs, raw_dir)

        # Merge segments
        merged_path = os.path.join(merged_dir, "merged.mp4")
        merge_segments([f[0] for f in seg_files], merged_path)

        # Calculate offset and duration
        file_start_time = seg_files[0][1]
        req_start = packing_item.start_time.replace(tzinfo=None)
        start_offset = (req_start - file_start_time).total_seconds()
        if start_offset < 0:
            start_offset = 0

        duration = (packing_item.end_time - packing_item.start_time).total_seconds()

        # Cut exact clip
        final_path = os.path.join(output_dir, "final.mp4")
        cut_exact(merged_path, final_path, start_offset, duration, settings.EXACT_CUT)

        # Upload to GCS
        blob_name = f"cctv/{camera_id}/{tag}.mp4"
        gcs_url = upload_to_gcs(final_path, settings.GCS_BUCKET, blob_name)

        # Get file size
        filesize = os.path.getsize(final_path)

        # Create mini_clip record
        mini_clip_repository.create_mini_clip(
            db=db,
            packing_item_id=packing_item.id,
            camera_id=camera_id,
            storage_path=gcs_url,
            duration_sec=int(duration),
            filesize_bytes=filesize,
        )

        # Update packing item status
        packing_repository.mark_as_clip_generated(db, packing_item.id)

        batch_job_repository.mark_item_success(db, batch_item_id)
        logger.info(f"Successfully processed packing_item_id={packing_item.id}")
        return True

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to process packing_item_id={packing_item.id}: {error_msg}")
        batch_job_repository.mark_item_failed(db, batch_item_id, error_msg)
        packing_repository.mark_as_error(db, packing_item.id)
        return False

    finally:
        # Always cleanup temp files, even on error
        for temp_dir in temp_dirs:
            try:
                clean(temp_dir)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup {temp_dir}: {cleanup_error}")


def process_batch(db: Session) -> None:
    """Process a batch of packing items ready for clip generation."""
    # Get items ready for batch
    items = packing_repository.get_ready_for_batch(db, settings.BATCH_SIZE)

    if not items:
        logger.debug("No items ready for batch processing")
        return

    logger.info(f"Starting batch with {len(items)} items")

    # Create batch job
    batch_job = batch_job_repository.create_batch_job(db, items)

    success_count = 0
    failed_count = 0

    # Process each item
    for batch_item in batch_job.items:
        packing_item = batch_item.packing_item
        success = process_single_item(db, packing_item, batch_item.id)

        if success:
            success_count += 1
        else:
            failed_count += 1

    # Finish batch job
    batch_job_repository.finish_batch_job(
        db, batch_job.id, success_count, failed_count
    )

    logger.info(f"Batch job {batch_job.id} completed: {success_count} success, {failed_count} failed")


def process_single_item_by_id(db: Session, packing_item_id: int) -> bool:
    """Process a single packing item by ID (for manual trigger). Returns True if successful."""
    # Track temp directories for cleanup
    temp_dirs: list[str] = []

    packing_item = db.query(PackingItem).filter(PackingItem.id == packing_item_id).first()

    if packing_item is None:
        logger.error(f"Packing item {packing_item_id} not found")
        return False

    if packing_item.status != PackingStatus.READY_FOR_BATCH:
        logger.error(f"Packing item {packing_item_id} is not ready (status: {packing_item.status.value})")
        return False

    try:
        # Get camera config
        workstation = packing_item.workstation
        camera_id = workstation.camera_id
        camcfg = camera_repository.get_camera_config(db, camera_id)

        if camcfg is None:
            raise Exception(f"Camera {camera_id} not found")

        if packing_item.start_time is None or packing_item.end_time is None:
            raise Exception("Start time or end time is not set")

        start_iso = packing_item.start_time.isoformat()
        end_iso = packing_item.end_time.isoformat()

        validate_times(start_iso, end_iso)

        # Check disk space before downloading
        check_disk_space(settings.TEMP_VIDEO_DIR)

        # Setup directories
        tag = f"{camera_id}_{packing_item.id}"
        raw_dir = os.path.join(settings.TEMP_VIDEO_DIR, "raw", tag)
        merged_dir = os.path.join(settings.TEMP_VIDEO_DIR, "merged", tag)
        output_dir = os.path.join(settings.TEMP_VIDEO_DIR, "output", tag)
        temp_dirs = [raw_dir, merged_dir, output_dir]
        ensure_dirs(temp_dirs)

        # Search and download segments from Hikvision
        client = HikvisionClient(
            camcfg["base_url"], camcfg["username"], camcfg["password"]
        )
        segs = client.search_segments(start_iso, end_iso)
        if not segs:
            raise Exception("No video segments found")

        seg_files = download_segments(camcfg, segs, raw_dir)

        # Merge segments
        merged_path = os.path.join(merged_dir, "merged.mp4")
        merge_segments([f[0] for f in seg_files], merged_path)

        # Calculate offset and duration
        file_start_time = seg_files[0][1]
        req_start = packing_item.start_time.replace(tzinfo=None)
        start_offset = (req_start - file_start_time).total_seconds()
        if start_offset < 0:
            start_offset = 0

        duration = (packing_item.end_time - packing_item.start_time).total_seconds()

        # Cut exact clip
        final_path = os.path.join(output_dir, "final.mp4")
        cut_exact(merged_path, final_path, start_offset, duration, settings.EXACT_CUT)

        # Upload to GCS
        blob_name = f"cctv/{camera_id}/{tag}.mp4"
        gcs_url = upload_to_gcs(final_path, settings.GCS_BUCKET, blob_name)

        # Get file size
        filesize = os.path.getsize(final_path)

        # Create mini_clip record
        mini_clip_repository.create_mini_clip(
            db=db,
            packing_item_id=packing_item.id,
            camera_id=camera_id,
            storage_path=gcs_url,
            duration_sec=int(duration),
            filesize_bytes=filesize,
        )

        # Update packing item status
        packing_repository.mark_as_clip_generated(db, packing_item.id)

        logger.info(f"Successfully processed packing_item_id={packing_item.id} (manual trigger)")
        return True

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to process packing_item_id={packing_item.id}: {error_msg}")
        packing_repository.mark_as_error(db, packing_item.id)
        return False

    finally:
        # Always cleanup temp files, even on error
        for temp_dir in temp_dirs:
            try:
                clean(temp_dir)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup {temp_dir}: {cleanup_error}")


def run_batch_loop() -> None:
    """Run the batch processing loop in a background thread."""
    from db.session import SessionLocal

    logger.info("Batch loop started")
    logger.info(f"Batch interval: {settings.BATCH_INTERVAL_SECONDS}s")
    logger.info(f"Batch size: {settings.BATCH_SIZE}")

    while not batch_loop_shutdown:
        try:
            db = SessionLocal()
            try:
                logger.debug("Processing batch...")
                process_batch(db)
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error processing batch: {e}")

        # Sleep in small increments to allow faster shutdown response
        for _ in range(settings.BATCH_INTERVAL_SECONDS):
            if batch_loop_shutdown:
                break
            time.sleep(1)

    logger.info("Batch loop stopped")


def stop_batch_loop() -> None:
    """Signal the batch loop to stop."""
    global batch_loop_shutdown
    batch_loop_shutdown = True
