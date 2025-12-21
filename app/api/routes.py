from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter

from app.core.config import MAX_THREADS
from app.db.session import SessionLocal
from app.repositories.camera_repository import get_camera_by_id
from app.models.requests import ExportRequest
from app.services.worker import process_single_job

router = APIRouter()


@router.post("/export")
def export(req: ExportRequest):
    with SessionLocal() as db:
        camera = get_camera_by_id(db, req.camera_id)
    if not camera:
        return {"error": "Unknown camera"}

    camcfg = {
        "base_url": camera.base_url,
        "username": camera.username,
        "password": camera.password,
    }
    results = []
    errors = []
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as exe:
        futs = [
            exe.submit(process_single_job, req.camera_id, camcfg, j.start,
                       j.end) for j in req.jobs
        ]
        for f in futs:
            try:
                results.append(f.result())
            except Exception as e:
                errors.append(str(e))
    return {"results": results, "errors": errors}
