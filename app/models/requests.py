from pydantic import BaseModel


class Job(BaseModel):
    start: str
    end: str


class ExportRequest(BaseModel):
    camera_id: str
    jobs: list[Job]

