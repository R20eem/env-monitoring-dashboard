"""
File: sensor_reading.py

Purpose:
Defines the database model for the sensor_readings table, which stores
environmental data collected from field monitoring sites, along with
pre-calculated alert flags and status values.

Responsibilities:
- Map the sensor_readings table using SQLAlchemy ORM
- Store raw environmental readings including temperature, humidity,
  leaf wetness, pest trap count, and rainfall per site and timestamp
- Store pre-calculated alert flags and status so the dashboard can
  retrieve already-processed results without doing calculations at runtime
- Support filtering by site and timestamp for researcher data analysis

Layer:
Backend (Database Model)

Related:
- alert_log.py (alert events generated from these readings)
- site_metadata.py (links site_id to location and crop type)
- sensor_reading_repository.py (queries and filters sensor data)
- seed_sensor_readings.py (populates this table with initial dataset)
- researcher_dashboard_router.py (exposes sensor data to researchers)
- farmer_dashboard.js (displays status and alerts on the farmer dashboard)
- researcher.js (displays trend data and filters on researcher dashboard)
"""

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