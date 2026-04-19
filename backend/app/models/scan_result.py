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