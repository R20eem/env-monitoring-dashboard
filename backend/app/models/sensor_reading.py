from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SensorReading(Base):
    """
    stores individual sensor readings from field sites
    """

    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(primary_key=True)

    site_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    timestamp: Mapped[str] = mapped_column(String(30), nullable=False, index=True)

    # environmental data
    air_temperature_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    relative_humidity_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    leaf_wetness_0_1: Mapped[float | None] = mapped_column(Float, nullable=True)
    pest_trap_count: Mapped[float | None] = mapped_column(Float, nullable=True)
    wx_rain_mm_hr: Mapped[float | None] = mapped_column(Float, nullable=True)

    # alert/status fields
    status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    alert_triggered: Mapped[float | None] = mapped_column(Float, nullable=True)
    alert_pest_action: Mapped[float | None] = mapped_column(Float, nullable=True)
    alert_pest_outbreak: Mapped[float | None] = mapped_column(Float, nullable=True)
    alert_disease_moderate: Mapped[float | None] = mapped_column(Float, nullable=True)
    alert_disease_high: Mapped[float | None] = mapped_column(Float, nullable=True)