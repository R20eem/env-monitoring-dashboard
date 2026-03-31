from pydantic import BaseModel


class AlertLogResponse(BaseModel):
    """
    shape of each item returned by get /api/researcher/alerts/history
    """

    site_id: str
    timestamp: str
    alert_type: str
    severity: str
    message: str

    model_config = {"from_attributes": True}