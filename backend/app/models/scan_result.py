"""
File: scan_result.py

Purpose:
Defines the database model for the scan_results table, which stores
the outcome of every image scan submitted through the ML scanner feature.

Responsibilities:
- Map the scan_results table using SQLAlchemy ORM
- Store the prediction, confidence score, and plain-language explanation
  returned by the ML model for each scan
- Link each scan result back to the farmer who submitted it via farmer_id
- Record the crop type and site so results can be filtered and compared
- Keep a history of the last 5 scans displayed on the farmer dashboard

Layer:
Backend (Database Model)

Related:
- farmer.py (the farmer who submitted the scan)
- scanner_router.py (handles image upload and triggers the ML prediction)
- farmer_auth_service.py (verifies the farmer before saving a scan)
- ml_models (Random Forest and MobileNetV2 models that produce the prediction)
- scanner.js (frontend that uploads the image and displays the result)
- farmer_dashboard.js (displays the recent scan summary on the dashboard)
"""
from sqlalchemy import String, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

# this model stores scan results from the farmer scanner feature
# each time a farmer uploads an image and gets a prediction,
# the result is saved in this table so it can be viewed later

class ScanResult(Base):
    __tablename__ = "scan_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    farmer_id: Mapped[int] = mapped_column(Integer, nullable=False)
    site_id: Mapped[str] = mapped_column(String(100), nullable=True)
    # type of crop selected by the farmer (maize, brassica, orchard)
    crop_type: Mapped[str] = mapped_column(String(50), nullable=False)
    image_path: Mapped[str] = mapped_column(String(255), nullable=False)
    # prediction result from the ml model (healthy, pest_risk, disease_risk)
    prediction: Mapped[str] = mapped_column(String(50), nullable=False)
    # confidence score from the model (between 0 and 1)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    # explanation of the prediction (simple text for the user)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    # timestamp when the scan was created
    created_at: Mapped[str] = mapped_column(String(30), nullable=False)