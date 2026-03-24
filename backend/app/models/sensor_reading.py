from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SensorReading(Base):
  """
  Stores individual sensor readings from field sites
  """

  __tablename__ = "sensor_readings"

  id: Mapped[int] = mapped_column(primary_key=True)

  site_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
  
  timestamp: Mapped[str] = mapped_column(String(30), nullable=False, index=True)

  # nullable since some rows have missing values
  air_temperature_c: Mapped[float | None] = mapped_column(Float, nullable=True)
