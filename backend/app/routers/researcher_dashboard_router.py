from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.sensor_reading_repository import (
    get_dashboard_summary,
    get_trend_data,
    get_status_counts,
)

router = APIRouter(prefix="/api/researcher/dashboard", tags=["researcher-dashboard"])


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    """
    returns latest values for top cards and warning banner
    """
    return get_dashboard_summary(db)


@router.get("/trends")
def trends(
    site_id: str | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    limit: int = Query(default=200),
    db: Session = Depends(get_db),
):
    """
    returns historical data for graphs
    """
    return get_trend_data(db, site_id, start_date, end_date, limit)


@router.get("/status-counts")
def status_counts(db: Session = Depends(get_db)):
    """
    returns number of normal, warning, critical readings
    """
    return get_status_counts(db)