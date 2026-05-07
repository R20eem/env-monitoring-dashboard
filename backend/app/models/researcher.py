"""
File: researcher.py

Purpose:
Defines the database model for the researchers table, which stores
account and profile information for registered researcher users.

Responsibilities:
- Map the researchers table using SQLAlchemy ORM
- Store researcher identity, organisation code, and hashed password
- Store the connection end date so access can expire when a researcher
  leaves their organisation
- Keep researcher data separate from farmer data since the two roles
  have different fields and different access levels

Layer:
Backend (Database Model)

Related:
- farmer.py (equivalent model for farmer accounts)
- researcher_auth_service.py (creates and retrieves researcher records)
- researcher_repository.py (direct database queries for researcher data)
- researcher_auth.py (router that handles researcher login and registration)
- schemas/researcher_auth.py (validates researcher input and response data)
- researcher_dashboard_router.py (protected routes that require researcher role)
"""

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