"""
File: alert_log.py

Purpose:
Defines the database model for the alert_log table, which stores
a record of every alert event triggered by the sensor threshold logic.

Responsibilities:
- Map the alert_log table using SQLAlchemy ORM
- Store alert type, severity, and message for each triggered event
- Link each alert to a site and timestamp for historical tracking

Layer:
Backend (Database Model)

Related:
- sensor_reading.py (sensor data that triggers alerts)
- alert_log_repository.py (queries the alert_log table)
- seed_sensor_readings.py (populates alerts when seeding data)
- alert_log.py in schemas (validates alert data returned by the API)
- researcher_dashboard_router.py (exposes alert history to researchers)
"""
from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class AlertLog(Base):
    """
    stores historical alert events
    """

    __tablename__ = "alert_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    site_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    timestamp: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    alert_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str] = mapped_column(String(255), nullable=False)