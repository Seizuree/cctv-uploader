from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base
from db.models.enums import PackingStatus

if TYPE_CHECKING:
    from db.models.workstation import Workstation
    from db.models.mini_clip import MiniClip
    from db.models.batch_job_item import BatchJobItem


class PackingItem(Base):
    __tablename__ = "packing_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    barcode: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    operator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    workstation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workstations.id"), nullable=False
    )

    start_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    status: Mapped[PackingStatus] = mapped_column(
        Enum(PackingStatus), default=PackingStatus.PENDING, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    workstation: Mapped[Workstation] = relationship("Workstation", back_populates="packing_items")
    mini_clip: Mapped[MiniClip | None] = relationship(
        "MiniClip", back_populates="packing_item", uselist=False
    )
    batch_job_items: Mapped[list[BatchJobItem]] = relationship(
        "BatchJobItem", back_populates="packing_item"
    )
