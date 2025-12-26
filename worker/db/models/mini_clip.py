from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base
from db.models.enums import MiniClipStatus

if TYPE_CHECKING:
    from db.models.packing_item import PackingItem
    from db.models.camera import Camera


class MiniClip(Base):
    __tablename__ = "mini_clips"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    packing_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("packing_items.id"), unique=True, nullable=False
    )
    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cameras.id"), nullable=False
    )
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    duration_sec: Mapped[int | None] = mapped_column(Integer)
    filesize_bytes: Mapped[int | None] = mapped_column(BigInteger)

    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[MiniClipStatus] = mapped_column(
        Enum(MiniClipStatus), default=MiniClipStatus.PENDING, nullable=False
    )

    packing_item: Mapped[PackingItem] = relationship("PackingItem", back_populates="mini_clip")
    camera: Mapped[Camera] = relationship("Camera", back_populates="mini_clips")
