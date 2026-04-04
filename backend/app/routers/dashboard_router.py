from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
 
from app.database import get_db
from app.repositories.sensor_reading_repository import (
    get_latest_temperature_per_site,
    get_latest_humidity_per_site,
    get_latest_leaf_wetness_per_site,
    get_latest_pest_count_per_site,
    get_latest_rainfall_per_site,
    get_latest_status_per_site,
    get_latest_alert_triggered_per_site,
    get_latest_alert_pest_action_per_site,
    get_latest_alert_pest_outbreak_per_site,
    get_latest_alert_disease_moderate_per_site,
    get_latest_alert_disease_high_per_site,
    get_site_summary,
)

from app.schemas.sensor_reading import (
    LatestTemperatureResponse,
    LatestHumidityResponse,
    LatestLeafWetnessResponse,
    LatestPestCountResponse,
    LatestRainfallResponse,
    LatestStatusResponse,
    LatestAlertTriggeredResponse,
    LatestAlertPestActionResponse,
    LatestAlertPestOutbreakResponse,
    LatestAlertDiseaseModerateResponse,
    LatestAlertDiseaseHighResponse,
    SiteSummaryResponse,
)

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


@router.get(
    "/humidity/latest",
    response_model=list[LatestHumidityResponse],
)
def get_latest_humidity(db: Session = Depends(get_db)):
    """
    Returns the most recent relative humidity reading for each site.
    """
    readings = get_latest_humidity_per_site(db)

    return [
        LatestHumidityResponse(
            site_id=r.site_id,
            latest_humidity_pct=r.relative_humidity_pct,
            timestamp=r.timestamp,
        )
        for r in readings
    ]


@router.get(
    "/leaf-wetness/latest",
    response_model=list[LatestLeafWetnessResponse],
)
def get_latest_leaf_wetness(db: Session = Depends(get_db)):
    """
    Returns the most recent leaf wetness reading for each site.
    """
    readings = get_latest_leaf_wetness_per_site(db)

    return [
        LatestLeafWetnessResponse(
            site_id=r.site_id,
            latest_leaf_wetness_0_1=r.leaf_wetness_0_1,
            timestamp=r.timestamp,
        )
        for r in readings
    ]


@router.get(
    "/pest-count/latest",
    response_model=list[LatestPestCountResponse],
)
def get_latest_pest_count(db: Session = Depends(get_db)):
    """
    returns the most recent pest trap count reading for each site.
    """
    readings = get_latest_pest_count_per_site(db)

    return [
        LatestPestCountResponse(
            site_id=r.site_id,
            latest_pest_count=r.pest_trap_count,
            timestamp=r.timestamp,
        )
        for r in readings
    ]


@router.get(
    "/rainfall/latest",
    response_model=list[LatestRainfallResponse],
)
def get_latest_rainfall(db: Session = Depends(get_db)):
    """
    Returns the most recent rainfall reading for each site.
    """
    readings = get_latest_rainfall_per_site(db)

    return [
        LatestRainfallResponse(
            site_id=r.site_id,
            latest_rainfall_mm_hr=r.wx_rain_mm_hr,
            timestamp=r.timestamp,
        )
        for r in readings
    ]



@router.get(
    "/status/latest",
    response_model=list[LatestStatusResponse],
)
def get_latest_status(db: Session = Depends(get_db)):
    """
    returns the most recent status reading for each site.
    """
    readings = get_latest_status_per_site(db)

    return [
        LatestStatusResponse(
            site_id=r.site_id,
            latest_status=r.status,
            timestamp=r.timestamp,
        )
        for r in readings
    ]

@router.get(
    "/alert-triggered/latest",
    response_model=list[LatestAlertTriggeredResponse],
)
def get_latest_alert_triggered(db: Session = Depends(get_db)):
    """
    returns the most recent alert_triggered reading for each site.
    """
    readings = get_latest_alert_triggered_per_site(db)

    return [
        LatestAlertTriggeredResponse(
            site_id=r.site_id,
            latest_alert_triggered=r.alert_triggered,
            timestamp=r.timestamp,
        )
        for r in readings
    ]


@router.get(
    "/alert-pest-action/latest",
    response_model=list[LatestAlertPestActionResponse],
)
def get_latest_alert_pest_action(db: Session = Depends(get_db)):
    """
    Returns the most recent alert_pest_action reading for each site.
    """
    readings = get_latest_alert_pest_action_per_site(db)

    return [
        LatestAlertPestActionResponse(
            site_id=r.site_id,
            latest_alert_pest_action=r.alert_pest_action,
            timestamp=r.timestamp,
        )
        for r in readings
    ]


@router.get(
    "/alert-pest-outbreak/latest",
    response_model=list[LatestAlertPestOutbreakResponse],
)
def get_latest_alert_pest_outbreak(db: Session = Depends(get_db)):
    """
    Returns the most recent alert_pest_outbreak reading for each site.
    """
    readings = get_latest_alert_pest_outbreak_per_site(db)

    return [
        LatestAlertPestOutbreakResponse(
            site_id=r.site_id,
            latest_alert_pest_outbreak=r.alert_pest_outbreak,
            timestamp=r.timestamp,
        )
        for r in readings
    ]


@router.get(
    "/alert-disease-moderate/latest",
    response_model=list[LatestAlertDiseaseModerateResponse],
)
def get_latest_alert_disease_moderate(db: Session = Depends(get_db)):
    """
    returns the most recent alert_disease_moderate reading for each site.
    """
    readings = get_latest_alert_disease_moderate_per_site(db)

    return [
        LatestAlertDiseaseModerateResponse(
            site_id=r.site_id,
            latest_alert_disease_moderate=r.alert_disease_moderate,
            timestamp=r.timestamp,
        )
        for r in readings
    ]


@router.get(
    "/alert-disease-high/latest",
    response_model=list[LatestAlertDiseaseHighResponse],
)
def get_latest_alert_disease_high(db: Session = Depends(get_db)):
    """
    returns the most recent alert_disease_high reading for each site.
    """
    readings = get_latest_alert_disease_high_per_site(db)

    return [
        LatestAlertDiseaseHighResponse(
            site_id=r.site_id,
            latest_alert_disease_high=r.alert_disease_high,
            timestamp=r.timestamp,
        )
        for r in readings
    ]


@router.get(
    "/summary",
    response_model=list[SiteSummaryResponse],
)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    returns the most recent get_site_summary readings
    one object per site, i.e:
    {
        "site_id": "site_orchard",
        "timestamp": "2023-12-31 23:00:00",
        "status": "warning",
        "air_temperature_c": 17.19,
        "relative_humidity_pct": 97.5,
        "leaf_wetness_0_1": 1.0,
        "pest_trap_count": 1.0,
        "wx_rain_mm_hr": 11.28,
        "alert_triggered": 1.0,
        "alert_pest_action": 0.0,
        "alert_pest_outbreak": 0.0,
        "alert_disease_moderate": 1.0,
        "alert_disease_high": 0.0
    }
    for farmers dashboard
    """
    readings = get_site_summary(db)
    return readings