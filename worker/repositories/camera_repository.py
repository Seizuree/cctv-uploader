from sqlalchemy.orm import Session

from db.models import Camera
from encryption import decrypt_password


def get_camera_by_id(db: Session, camera_id: int) -> Camera | None:
    return db.query(Camera).filter(Camera.id == camera_id).first()


def get_camera_config(db: Session, camera_id: int) -> dict[str, str] | None:
    """Get camera config with decrypted password for Hikvision client."""
    camera = get_camera_by_id(db, camera_id)
    if camera is None:
        return None

    return {
        "base_url": camera.base_url,
        "username": camera.username,
        "password": decrypt_password(camera.encrypted_password),
    }
