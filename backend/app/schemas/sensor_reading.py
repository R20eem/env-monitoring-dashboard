from pydantic import BaseModel


class LatestTemperatureResponse(BaseModel):
  """
  Shape of each item returned by GET /api/dashboard/temperature/latest
  One object per site!
  """

  site_id: str
  latest_temp_c: float
  timestamp: str

  # Pydantic to read values from SQLAlchemy model attributes
  model_config = {"from_attributes": True}