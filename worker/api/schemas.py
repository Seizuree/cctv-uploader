from pydantic import BaseModel


class TriggerRequest(BaseModel):
    packing_item_id: int


class TriggerResponse(BaseModel):
    status: str
    packing_item_id: int
    message: str


class ErrorResponse(BaseModel):
    status: str
    message: str


class HealthResponse(BaseModel):
    status: str
    auto_batch: bool
    queue_size: int
