from sqlalchemy.orm import Session

from app.db.models import Camera


def get_camera_by_id(db: Session, camera_id: str) -> Camera | None:
    return db.query(Camera).filter(Camera.id == camera_id).first()

