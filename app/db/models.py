from sqlalchemy import Column, String, DateTime, func
from app.db.session import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, index=True)
    base_url = Column(String, nullable=False)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

