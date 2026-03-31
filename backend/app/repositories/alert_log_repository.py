from sqlalchemy.orm import Session
from app.models.alert_log import AlertLog


def get_alert_history(
    db: Session,
    site_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    severity: str | None = None,
    limit: int = 100,
) -> list[AlertLog]:
    """
    returns alert history from alert_log table
    """

    query = db.query(AlertLog)

    if site_id:
        query = query.filter(AlertLog.site_id == site_id)

    if start_date:
        query = query.filter(AlertLog.timestamp >= start_date)

    if end_date:
        query = query.filter(AlertLog.timestamp <= end_date)

    if severity:
        query = query.filter(AlertLog.severity == severity)

    return query.order_by(AlertLog.timestamp.desc()).limit(limit).all()