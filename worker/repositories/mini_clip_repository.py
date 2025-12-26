from datetime import datetime, timezone

from sqlalchemy.orm import Session

from db.models import MiniClip, MiniClipStatus


def create_mini_clip(
    db: Session,
    packing_item_id: int,
    camera_id: int,
    storage_path: str,
    duration_sec: int,
    filesize_bytes: int,
) -> MiniClip:
    """Create a new mini clip record."""
    mini_clip = MiniClip(
        packing_item_id=packing_item_id,
        camera_id=camera_id,
        storage_path=storage_path,
        duration_sec=duration_sec,
        filesize_bytes=filesize_bytes,
        generated_at=datetime.now(timezone.utc),
        status=MiniClipStatus.UPLOADED,
    )
    db.add(mini_clip)
    db.commit()
    db.refresh(mini_clip)
    return mini_clip


def get_by_packing_item_id(db: Session, packing_item_id: int) -> MiniClip | None:
    """Get mini clip by packing item ID."""
    return (
        db.query(MiniClip)
        .filter(MiniClip.packing_item_id == packing_item_id)
        .first()
    )


def update_status(db: Session, mini_clip_id: int, status: MiniClipStatus) -> None:
    """Update mini clip status."""
    db.query(MiniClip).filter(MiniClip.id == mini_clip_id).update({"status": status})
    db.commit()
