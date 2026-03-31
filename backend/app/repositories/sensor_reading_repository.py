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


def get_status_counts(db: Session):
    """
    counts how many readings are normal, warning, critical
    """

    normal = db.query(SensorReading).filter(SensorReading.status == "normal").count()
    warning = db.query(SensorReading).filter(SensorReading.status == "warning").count()
    critical = db.query(SensorReading).filter(SensorReading.status == "critical").count()

    return {
        "normal": normal,
        "warning": warning,
        "critical": critical,
    }


def get_dashboard_summary(db: Session):
    """
    returns latest reading per site and calculates averages
    """

    latest_subq = (
        db.query(
            SensorReading.site_id,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .group_by(SensorReading.site_id)
        .subquery()
    )

    readings = (
        db.query(SensorReading)
        .join(
            latest_subq,
            (SensorReading.site_id == latest_subq.c.site_id)
            & (SensorReading.timestamp == latest_subq.c.max_ts),
        )
        .all()
    )

    temps = [r.air_temperature_c for r in readings if r.air_temperature_c is not None]
    humidity = [r.relative_humidity_pct for r in readings if r.relative_humidity_pct is not None]
    leaf = [r.leaf_wetness_0_1 for r in readings if r.leaf_wetness_0_1 is not None]

    return {
        "avg_temperature": sum(temps)/len(temps) if temps else None,
        "avg_humidity": sum(humidity)/len(humidity) if humidity else None,
        "avg_leaf_wetness": sum(leaf)/len(leaf) if leaf else None,
        "status": readings[0].status if readings else None
    }


def get_trend_data(
    db: Session,
    site_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 200,
):
    query = db.query(SensorReading)

    if site_id:
        query = query.filter(SensorReading.site_id == site_id)

    if start_date:
        query = query.filter(SensorReading.timestamp >= start_date)

    if end_date:
        query = query.filter(SensorReading.timestamp <= end_date)

    readings = query.order_by(SensorReading.timestamp.desc()).limit(limit).all()
    readings.reverse()

    return [
        {
            "timestamp": r.timestamp,
            "air_temperature_c": r.air_temperature_c,
            "relative_humidity_pct": r.relative_humidity_pct,
            "leaf_wetness_0_1": r.leaf_wetness_0_1,
            "pest_trap_count": r.pest_trap_count,
            "wx_rain_mm_hr": r.wx_rain_mm_hr,
            "status": r.status,
        }
        for r in readings
    ]

def get_researcher_data(
    db: Session,
    site_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    status: str | None = None,
    limit: int = 100,
) -> list[SensorReading]:
    """
    returns filtered sensor readings for the researcher data page
    """

    query = db.query(SensorReading)

    if site_id:
        query = query.filter(SensorReading.site_id == site_id)

    if start_date:
        query = query.filter(SensorReading.timestamp >= start_date)

    if end_date:
        query = query.filter(SensorReading.timestamp <= end_date)

    if status:
        query = query.filter(SensorReading.status == status)

    return query.order_by(SensorReading.timestamp.desc()).limit(limit).all()

def get_researcher_data_for_export(
    db: Session,
    site_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    status: str | None = None,
) -> list[SensorReading]:
    """
    returns filtered sensor readings for csv export
    """

    query = db.query(SensorReading)

    if site_id:
        query = query.filter(SensorReading.site_id == site_id)

    if start_date:
        query = query.filter(SensorReading.timestamp >= start_date)

    if end_date:
        query = query.filter(SensorReading.timestamp <= end_date)

    if status:
        query = query.filter(SensorReading.status == status)

    return query.order_by(SensorReading.timestamp.desc()).all()


def get_alert_history(
    db: Session,
    site_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    status: str | None = None,
    limit: int = 100,
) -> list[SensorReading]:
    """
    returns historical rows where alerts were triggered
    """

    query = db.query(SensorReading).filter(SensorReading.alert_triggered == 1)

    if site_id:
        query = query.filter(SensorReading.site_id == site_id)

    if start_date:
        query = query.filter(SensorReading.timestamp >= start_date)

    if end_date:
        query = query.filter(SensorReading.timestamp <= end_date)

    if status:
        query = query.filter(SensorReading.status == status)

    return query.order_by(SensorReading.timestamp.desc()).limit(limit).all()