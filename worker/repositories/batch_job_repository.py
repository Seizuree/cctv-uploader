from datetime import datetime, timezone

from sqlalchemy.orm import Session

from db.models import (
    BatchJob,
    BatchJobItem,
    BatchJobStatus,
    BatchItemStatus,
    PackingItem,
)


def _utc_now() -> datetime:
    """Get current UTC time with timezone info."""
    return datetime.now(timezone.utc)


def create_batch_job(db: Session, packing_items: list[PackingItem]) -> BatchJob:
    """Create a new batch job with items."""
    batch_job = BatchJob(
        started_at=_utc_now(),
        status=BatchJobStatus.RUNNING,
        total_items=len(packing_items),
    )
    db.add(batch_job)
    db.flush()

    for item in packing_items:
        batch_item = BatchJobItem(
            batch_job_id=batch_job.id,
            packing_item_id=item.id,
            status=BatchItemStatus.PENDING,
        )
        db.add(batch_item)

    db.commit()
    db.refresh(batch_job)
    return batch_job


def mark_item_processing(db: Session, batch_item_id: int) -> None:
    """Mark batch job item as processing."""
    db.query(BatchJobItem).filter(BatchJobItem.id == batch_item_id).update({
        "status": BatchItemStatus.PROCESSING,
        "started_at": _utc_now(),
    })
    db.commit()


def mark_item_success(db: Session, batch_item_id: int) -> None:
    """Mark batch job item as success."""
    db.query(BatchJobItem).filter(BatchJobItem.id == batch_item_id).update({
        "status": BatchItemStatus.SUCCESS,
        "finished_at": _utc_now(),
    })
    db.commit()


def mark_item_failed(db: Session, batch_item_id: int, error_message: str) -> None:
    """Mark batch job item as failed."""
    db.query(BatchJobItem).filter(BatchJobItem.id == batch_item_id).update({
        "status": BatchItemStatus.FAILED,
        "error_message": error_message,
        "finished_at": _utc_now(),
    })
    db.commit()


def finish_batch_job(
    db: Session,
    batch_job_id: int,
    success_count: int,
    failed_count: int,
    error_message: str | None = None,
) -> None:
    """Finish batch job and update status."""
    if failed_count == 0:
        status = BatchJobStatus.SUCCESS
    elif success_count == 0:
        status = BatchJobStatus.FAILED
    else:
        status = BatchJobStatus.PARTIAL_SUCCESS

    db.query(BatchJob).filter(BatchJob.id == batch_job_id).update({
        "status": status,
        "finished_at": _utc_now(),
        "success_items": success_count,
        "failed_items": failed_count,
        "error_message": error_message,
    })
    db.commit()
