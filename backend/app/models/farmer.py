"""
File: farmer.py

Purpose:
Defines the database model for the farmers table, which stores
account and profile information for registered farmer users.

Responsibilities:
- Map the farmers table using SQLAlchemy ORM
- Store farmer identity, location, experience level, and hashed password
- Keep farmer data separate from researcher data since the two roles
  have different fields and different access levels

Layer:
Backend (Database Model)

Related:
- researcher.py (equivalent model for researcher accounts)
- farmer_auth_service.py (creates and retrieves farmer records)
- farmer_repository.py (direct database queries for farmer data)
- farmer_auth.py (router that handles farmer login and registration)
- schemas/farmer_auth.py (validates farmer input and response data)
- scan_result.py (links scan results back to a farmer via farmer_id)
"""
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