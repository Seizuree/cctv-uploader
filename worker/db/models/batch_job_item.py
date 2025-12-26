from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base
from db.models.enums import BatchItemStatus

if TYPE_CHECKING:
    from db.models.batch_job import BatchJob
    from db.models.packing_item import PackingItem


class BatchJobItem(Base):
    __tablename__ = "batch_job_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    batch_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("batch_jobs.id"), nullable=False
    )
    packing_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("packing_items.id"), nullable=False
    )

    status: Mapped[BatchItemStatus] = mapped_column(
        Enum(BatchItemStatus), default=BatchItemStatus.PENDING, nullable=False
    )
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    batch_job: Mapped[BatchJob] = relationship("BatchJob", back_populates="items")
    packing_item: Mapped[PackingItem] = relationship(
        "PackingItem", back_populates="batch_job_items"
    )
