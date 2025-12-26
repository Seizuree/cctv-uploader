from sqlalchemy.orm import Session

from db.models import PackingItem, PackingStatus


def get_ready_for_batch(db: Session, limit: int) -> list[PackingItem]:
    """Get packing items that are ready for batch processing."""
    return (
        db.query(PackingItem)
        .filter(PackingItem.status == PackingStatus.READY_FOR_BATCH)
        .limit(limit)
        .all()
    )


def update_status(db: Session, packing_item_id: int, status: PackingStatus) -> None:
    """Update packing item status."""
    db.query(PackingItem).filter(PackingItem.id == packing_item_id).update(
        {"status": status}
    )
    db.commit()


def mark_as_clip_generated(db: Session, packing_item_id: int) -> None:
    """Mark packing item as clip generated."""
    update_status(db, packing_item_id, PackingStatus.CLIP_GENERATED)


def mark_as_error(db: Session, packing_item_id: int) -> None:
    """Mark packing item as error."""
    update_status(db, packing_item_id, PackingStatus.ERROR)
