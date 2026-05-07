"""
File: alert_log.py (schemas)

Purpose:
Defines the response schema for alert log data returned by the
researcher alert history endpoint.

Responsibilities:
- Validate and shape the data returned by the alert history endpoint
- Ensure each alert log item includes site, timestamp, type,
  severity, and message fields
- Use from_attributes to allow mapping directly from SQLAlchemy
  ORM objects returned by the repository

Layer:
Backend (Schema / Data Validation)

Related:
- alert_log.py in models (the database model being serialised)
- alert_log_repository.py (queries that return AlertLog objects)
- researcher_dashboard_router.py (uses this schema as the response
  model for GET /api/researcher/alerts/history)
- alerts.js (frontend that displays the alert history table)
"""

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