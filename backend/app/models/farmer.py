from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

# this class represents the farmers table in the database
class Farmer(Base):
    __tablename__ = "farmers"

    id: Mapped[int] = mapped_column(primary_key=True)

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    experience: Mapped[str] = mapped_column(String(255), nullable=False)
    # location of the farmer, we could make it MC if we know the exact location the database has
    location: Mapped[str] = mapped_column(String(255), nullable=False)

    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)