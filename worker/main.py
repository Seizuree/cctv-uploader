import signal
import sys
import logging
import threading

import uvicorn

from config import settings, validate_config
from api.app import create_app
from jobs.batch_processor import run_batch_loop, stop_batch_loop
from jobs.job_queue import process_queue_worker, stop_queue_worker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def signal_handler(signum: int, frame: object) -> None:
    """Handle shutdown signals gracefully."""
    sig_name = signal.Signals(signum).name
    logger.info(f"Received {sig_name}, initiating graceful shutdown...")

    # Stop background workers
    stop_batch_loop()
    stop_queue_worker()

    sys.exit(0)


def main() -> None:
    # Validate config before starting
    validate_config()

    # Register signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    logger.info("Worker started")

    # Start background batch loop if enabled
    if settings.AUTO_BATCH_ENABLED:
        batch_thread = threading.Thread(target=run_batch_loop, daemon=True, name="batch-loop")
        batch_thread.start()
        logger.info("Auto batch processing enabled")
    else:
        logger.info("Auto batch processing disabled")

    # Start queue worker for manual triggers
    queue_thread = threading.Thread(target=process_queue_worker, daemon=True, name="queue-worker")
    queue_thread.start()
    logger.info("Queue worker started")

    # Start HTTP server (blocking)
    app = create_app()
    logger.info(f"Starting HTTP server on {settings.WORKER_HOST}:{settings.WORKER_PORT}")
    uvicorn.run(
        app,
        host=settings.WORKER_HOST,
        port=settings.WORKER_PORT,
        log_level="info",
    )


if __name__ == "__main__":
    main()
