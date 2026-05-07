
"""
File: site_metadata.py

Purpose:
Defines the database model for the site_metadata table, which stores
basic information about each monitored farming site in the system.

Responsibilities:
- Map the site_metadata table using SQLAlchemy ORM
- Store the location, crop type, and sensor status for each site
- Provide context for sensor readings and alerts that reference a site_id
- Allow the dashboard to display human-readable site information
  alongside raw sensor data

Layer:
Backend (Database Model)

Related:
- sensor_reading.py (readings that reference each site via site_id)
- alert_log.py (alerts that reference each site via site_id)
- sensor_reading_repository.py (joins site metadata with sensor data)
- seed_sensor_readings.py (populates site metadata when seeding data)
- farmer_dashboard.js (displays site name and crop type on the dashboard)
- researcher.js (uses site metadata for filtering and labelling charts)
"""

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