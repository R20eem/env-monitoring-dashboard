from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

# this class represents the researchers table in the database
class Researcher(Base):
    __tablename__ = "researchers"

    id: Mapped[int] = mapped_column(primary_key=True)

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)

    org_code: Mapped[str] = mapped_column(String(4), nullable=False)           # 4 digits
    connection_end: Mapped[str] = mapped_column(String(10), nullable=False)   # YYYY-MM-DD

    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)