from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.sensor_reading import SensorReading


def get_latest_temperature_per_site(db: Session) -> list[SensorReading]:
  """
  Returns most recent air_temperature_c value SensorReading row per site_id.
  Subquery finds max timestamp for each site_id,
  Main query joins back to get full row for that specific timestamp to
  avoid loading all rows in python memory
  """

  #Subquery
  latest_subq = (
    db.query(
      SensorReading.site_id,
      func.max(SensorReading.timestamp).label("max_ts"),
    )
    .filter(SensorReading.air_temperature_c.isnot(None))
    .group_by(SensorReading.site_id)
    .subquery()
    )
  
  #join back
  results = (
    db.query(SensorReading)
    .join(
      latest_subq,
      (SensorReading.site_id == latest_subq.c.site_id)
      & (SensorReading.timestamp == latest_subq.c.max_ts),
    )
    .all()
  )

  return results