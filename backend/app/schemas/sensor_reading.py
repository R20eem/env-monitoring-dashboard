"""
File: sensor_reading.py (schemas)

Purpose:
Defines all response schemas for sensor reading data returned by
the farmer dashboard, researcher dashboard, and alert history
endpoints.

Responsibilities:
- Provide individual response schemas for each sensor field
  (temperature, humidity, leaf wetness, pest count, rainfall,
  status, and all alert flags) used by the farmer dashboard
  endpoints that return one value per site
- Provide a combined SiteSummaryResponse schema that returns all
  fields in a single object per site, used as the main data source
  for the farmer dashboard
- Provide a ResearcherDataResponse schema for the researcher data
  tables page, including all sensor fields and alert flags
- Provide an AlertHistoryResponse schema for the researcher alert
  history view
- Use from_attributes on all schemas to allow direct mapping from
  SQLAlchemy ORM objects returned by the repository

Layer:
Backend (Schema / Data Validation)

Related:
- sensor_reading.py in models (the database model being serialised)
- sensor_reading_repository.py (returns the ORM objects shaped by
  these schemas)
- dashboard_router.py (uses the individual latest value schemas and
  SiteSummaryResponse for the farmer dashboard endpoints)
- researcher_dashboard_router.py (uses ResearcherDataResponse and
  AlertHistoryResponse for the researcher dashboard endpoints)
- farmer_dashboard.js (reads SiteSummaryResponse to populate the
  farmer dashboard status cards and alerts)
- researcher.js (reads ResearcherDataResponse for the data tables
  and trend charts)


Reference:

ChatGPT and Claude were used during the development of this 

file to support debugging and to clarify concepts needed to implement specific 

features. All code was written, reviewed, and tested by the development team.

ChatGPT (2026) ChatGPT [AI assistant]. OpenAI. Available at: https://chat.openai.com (Accessed: May 2026).

Claude (2026) Claude [AI assistant]. Anthropic. Available at: https://claude.ai (Accessed: May 2026).

"""

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