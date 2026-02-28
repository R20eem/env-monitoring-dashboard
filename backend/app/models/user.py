from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class User(Base):
    __tablename__ = "users"

    # primary key column
    # every user will have a unique id (auto-incremented).
    id: Mapped[int] = mapped_column(primary_key=True)
    # max 255
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    # this stores the hashed password
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)