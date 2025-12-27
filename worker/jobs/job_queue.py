import logging
from queue import Queue

from db.session import SessionLocal

logger = logging.getLogger(__name__)

# Global job queue for manual trigger requests
job_queue: Queue[str] = Queue()

# Flag to signal queue worker to stop
queue_worker_shutdown = False


def enqueue_job(packing_item_id: str) -> None:
    """Add a packing item ID to the processing queue."""
    job_queue.put(packing_item_id)
    logger.info(f"Enqueued packing_item_id={packing_item_id} for processing")


def process_queue_worker() -> None:
    """Worker thread that processes jobs from the queue."""
    from jobs.batch_processor import process_single_item_by_id

    logger.info("Queue worker started")

    while not queue_worker_shutdown:
        try:
            # Use timeout to allow checking shutdown flag periodically
            try:
                packing_item_id = job_queue.get(timeout=1.0)
            except Exception:
                # Queue.get timeout, continue loop to check shutdown flag
                continue

            logger.info(f"Processing queued job for packing_item_id={packing_item_id}")

            db = SessionLocal()
            try:
                success = process_single_item_by_id(db, packing_item_id)
                if success:
                    logger.info(f"Successfully processed packing_item_id={packing_item_id}")
                else:
                    logger.error(f"Failed to process packing_item_id={packing_item_id}")
            finally:
                db.close()

            job_queue.task_done()

        except Exception as e:
            logger.error(f"Error in queue worker: {e}")

    logger.info("Queue worker stopped")


def stop_queue_worker() -> None:
    """Signal the queue worker to stop."""
    global queue_worker_shutdown
    queue_worker_shutdown = True
