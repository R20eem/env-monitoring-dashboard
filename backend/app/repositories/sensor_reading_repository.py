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


def get_latest_humidity_per_site(db: Session) -> list[SensorReading]:
    """
    returns most recent relative_humidity_pct value SensorReading row per site_id.
    """

    latest_subq = (
        db.query(
            SensorReading.site_id,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .filter(SensorReading.relative_humidity_pct.isnot(None))
        .group_by(SensorReading.site_id)
        .subquery()
    )

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


def get_latest_leaf_wetness_per_site(db: Session) -> list[SensorReading]:
    """
    returns most recent leaf_wetness_0_1 value SensorReading row per site_id.
    """
    latest_subq = (
        db.query(
            SensorReading.site_id,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .filter(SensorReading.leaf_wetness_0_1.isnot(None))
        .group_by(SensorReading.site_id)
        .subquery()
    )

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


def get_latest_pest_count_per_site(db: Session) -> list[SensorReading]:
    """
    Returns most recent pest_trap_count value SensorReading row per site_id.
    """
    latest_subq = (
        db.query(
            SensorReading.site_id,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .filter(SensorReading.pest_trap_count.isnot(None))
        .group_by(SensorReading.site_id)
        .subquery()
    )

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


def get_latest_rainfall_per_site(db: Session) -> list[SensorReading]:
    """
    returns most recent wx_rain_mm_hr value SensorReading row per site_id.
    """
    latest_subq = (
        db.query(
            SensorReading.site_id,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .filter(SensorReading.wx_rain_mm_hr.isnot(None))
        .group_by(SensorReading.site_id)
        .subquery()
    )

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


def get_latest_status_per_site(db: Session) -> list[SensorReading]:
    """
    returns most recent status value SensorReading row per site_id.
    """
    latest_subq = (
        db.query(
            SensorReading.site_id,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .filter(SensorReading.status.isnot(None))
        .group_by(SensorReading.site_id)
        .subquery()
    )

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


def get_latest_alert_triggered_per_site(db: Session) -> list[SensorReading]:
    """
    returns most recent alert_triggered value SensorReading row per site_id.
    """
    latest_subq = (
        db.query(
            SensorReading.site_id,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .filter(SensorReading.alert_triggered.isnot(None))
        .group_by(SensorReading.site_id)
        .subquery()
    )

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


def get_latest_alert_pest_action_per_site(db: Session) -> list[SensorReading]:
    """
    returns most recent alert_pest_action value SensorReading row per site_id.
    """
    latest_subq = (
        db.query(
            SensorReading.site_id,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .filter(SensorReading.alert_pest_action.isnot(None))
        .group_by(SensorReading.site_id)
        .subquery()
    )

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


def get_latest_alert_pest_outbreak_per_site(db: Session) -> list[SensorReading]:
    """
    returns most recent alert_pest_outbreak value SensorReading row per site_id.
    """
    latest_subq = (
        db.query(
            SensorReading.site_id,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .filter(SensorReading.alert_pest_outbreak.isnot(None))
        .group_by(SensorReading.site_id)
        .subquery()
    )

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


def get_latest_alert_disease_moderate_per_site(db: Session) -> list[SensorReading]:
    """
    returns most recent alert_disease_moderate value SensorReading row per site_id.
    """
    latest_subq = (
        db.query(
            SensorReading.site_id,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .filter(SensorReading.alert_disease_moderate.isnot(None))
        .group_by(SensorReading.site_id)
        .subquery()
    )

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


def get_latest_alert_disease_high_per_site(db: Session) -> list[SensorReading]:
    """
    returns most recent alert_disease_high value SensorReading row per site_id.
    """
    latest_subq = (
        db.query(
            SensorReading.site_id,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .filter(SensorReading.alert_disease_high.isnot(None))
        .group_by(SensorReading.site_id)
        .subquery()
    )

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