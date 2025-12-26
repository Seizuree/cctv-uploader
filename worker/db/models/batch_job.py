from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Integer, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base
from db.models.enums import BatchJobStatus

if TYPE_CHECKING:
    from db.models.batch_job_item import BatchJobItem


class BatchJob(Base):
    __tablename__ = "batch_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[BatchJobStatus] = mapped_column(
        Enum(BatchJobStatus), default=BatchJobStatus.RUNNING, nullable=False
    )

    total_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    success_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)

    items: Mapped[list[BatchJobItem]] = relationship("BatchJobItem", back_populates="batch_job")
