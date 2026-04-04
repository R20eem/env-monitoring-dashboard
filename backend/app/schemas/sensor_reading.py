from pydantic import BaseModel


class LatestTemperatureResponse(BaseModel):
  """
  Shape of each item returned by GET /api/dashboard/temperature/latest
  one object per site!
  """

  site_id: str
  latest_temp_c: float
  timestamp: str

  # Pydantic to read values from SQLAlchemy model attributes
  model_config = {"from_attributes": True}


class LatestHumidityResponse(BaseModel):
    """
    Shape of each item returned by GET /api/dashboard/humidity/latest
    one object per site!
    """
    site_id: str
    latest_humidity_pct: float | None
    timestamp: str


class LatestLeafWetnessResponse(BaseModel):
    """
    Shape of each item returned by GET /api/dashboard/leaf-wetness/latest
    one object per site!
    """

    site_id: str
    latest_leaf_wetness_0_1: float | None
    timestamp: str

    model_config = {"from_attributes": True}


class LatestPestCountResponse(BaseModel):
    """
    Shape of each item returned by GET /api/dashboard/pest-count/latest
    one object per site!
    """

    site_id: str
    latest_pest_count: float | None
    timestamp: str

    model_config = {"from_attributes": True}



class LatestRainfallResponse(BaseModel):
    """
    Shape of each item returned by GET /api/dashboard/rainfall/latest
    one object per site!
    """

    site_id: str
    latest_rainfall_mm_hr: float | None
    timestamp: str

    model_config = {"from_attributes": True}



class LatestStatusResponse(BaseModel):
    """
    Shape of each item returned by GET /api/dashboard/status/latest
    one object per site!
    """

    site_id: str
    latest_status: str | None
    timestamp: str

    model_config = {"from_attributes": True}


class LatestAlertTriggeredResponse(BaseModel):
    """
    Shape of each item returned by GET /api/dashboard/alert-triggered/latest
    One object per site!
    """

    site_id: str
    latest_alert_triggered: float | None
    timestamp: str

    model_config = {"from_attributes": True}


  
class LatestAlertPestActionResponse(BaseModel):
    """
    Shape of each item returned by GET /api/dashboard/alert-pest-action/latest
    one object per site!
    """

    site_id: str
    latest_alert_pest_action: float | None
    timestamp: str

    model_config = {"from_attributes": True}


class LatestAlertPestOutbreakResponse(BaseModel):
    """
    Shape of each item returned by GET /api/dashboard/alert-pest-outbreak/latest
    one object per site!
    """

    site_id: str
    latest_alert_pest_outbreak: float | None
    timestamp: str

    model_config = {"from_attributes": True}


class LatestAlertDiseaseModerateResponse(BaseModel):
    """
    Shape of each item returned by GET /api/dashboard/alert-disease-moderate/latest
    One object per site!
    """

    site_id: str
    latest_alert_disease_moderate: float | None
    timestamp: str

    model_config = {"from_attributes": True}


class LatestAlertDiseaseHighResponse(BaseModel):
    """
    Shape of each item returned by GET /api/dashboard/alert-disease-high/latest
    One object per site!
    """

    site_id: str
    latest_alert_disease_high: float | None
    timestamp: str

    model_config = {"from_attributes": True}

class ResearcherDataResponse(BaseModel):
    """
    shape of each item returned by get /api/researcher/data
    """

    site_id: str
    timestamp: str
    air_temperature_c: float | None
    relative_humidity_pct: float | None
    leaf_wetness_0_1: float | None
    pest_trap_count: float | None
    wx_rain_mm_hr: float | None
    status: str | None
    alert_triggered: float | None
    alert_pest_action: float | None
    alert_pest_outbreak: float | None
    alert_disease_moderate: float | None
    alert_disease_high: float | None

    model_config = {"from_attributes": True}


class AlertHistoryResponse(BaseModel):
    """
    shape of each item returned by get /api/researcher/alerts/history
    """

    site_id: str
    timestamp: str
    status: str | None
    alert_triggered: float | None
    alert_pest_action: float | None
    alert_pest_outbreak: float | None
    alert_disease_moderate: float | None
    alert_disease_high: float | None

    model_config = {"from_attributes": True}


class SiteSummaryResponse(BaseModel):
    """
    shape of each item returned by get /api/dashboard/summary
    one api call containing latest readings for farmer dashboard
    """

    site_id: str
    timestamp: str
    status: str | None

    air_temperature_c: float | None
    relative_humidity_pct: float | None
    leaf_wetness_0_1: float | None
    pest_trap_count: float | None
    wx_rain_mm_hr: float | None

    alert_triggered: float | None
    alert_pest_action: float | None
    alert_pest_outbreak: float | None
    alert_disease_moderate: float | None
    alert_disease_high: float | None

    model_config = {"from_attributes": True}