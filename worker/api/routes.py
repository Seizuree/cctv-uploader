from fastapi import APIRouter, HTTPException, status

from api.schemas import TriggerRequest, TriggerResponse, ErrorResponse, HealthResponse
from config import settings
from db.session import SessionLocal
from db.models import PackingItem, PackingStatus
from jobs.job_queue import job_queue, enqueue_job

router = APIRouter()


@router.post(
    "/trigger",
    response_model=TriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def trigger_processing(request: TriggerRequest) -> TriggerResponse:
    """Trigger processing for a specific packing item."""
    db = SessionLocal()
    try:
        # Check if packing item exists and is ready
        packing_item = db.query(PackingItem).filter(
            PackingItem.id == request.packing_item_id
        ).first()

        if packing_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Packing item {request.packing_item_id} not found",
            )

        if packing_item.status != PackingStatus.READY_FOR_BATCH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Packing item {request.packing_item_id} is not ready for processing (status: {packing_item.status.value})",
            )

        # Enqueue the job
        enqueue_job(request.packing_item_id)

        return TriggerResponse(
            status="accepted",
            packing_item_id=request.packing_item_id,
            message="Job queued for processing",
        )
    finally:
        db.close()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        auto_batch=settings.AUTO_BATCH_ENABLED,
        queue_size=job_queue.qsize(),
    )
