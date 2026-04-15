from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SiteMetadata(Base):
    """
    stores basic metadata for each monitoring site
    """

    __tablename__ = "site_metadata"

    site_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    crop_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sensor_status: Mapped[str | None] = mapped_column(String(50), nullable=True)