from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
 
from app.database import get_db
from app.repositories.sensor_reading_repository import get_latest_temperature_per_site
from app.schemas.sensor_reading import LatestTemperatureResponse
 
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
 
 
@router.get(
    "/temperature/latest",
    response_model=list[LatestTemperatureResponse],
)
def get_latest_temperatures(db: Session = Depends(get_db)):
    """
    Returns the most recent air temperature reading for each site
    which will be used by the dashboard.
 
    For example:
    [
      {"site_id": "site_maize", "latest_temp_c": 21.3, "timestamp": "2023-12-31 23:45:00"},
      {"site_id": "site_brassica", "latest_temp_c": 19.1, "timestamp": "2023-12-31 23:45:00"},
      {"site_id": "site_orchard", "latest_temp_c": 17.8, "timestamp": "2023-12-31 23:45:00"}
    ]
    """
    readings = get_latest_temperature_per_site(db)
 
    # map ORM objects to response schema
    # (field names are different: air_temperature_c → latest_temp_c)
    return [
        LatestTemperatureResponse(
            site_id=r.site_id,
            latest_temp_c=r.air_temperature_c,
            timestamp=r.timestamp,
        )
        for r in readings
    ]