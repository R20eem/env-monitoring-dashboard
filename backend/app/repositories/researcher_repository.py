"""
File: researcher_repository.py

Purpose:
Handles all database queries for the researchers table, providing
functions to look up and create researcher accounts.

Responsibilities:
- Look up a researcher by email, used during login to verify credentials
- Look up a researcher by id, used when loading profile or dashboard data
- Create a new researcher record during registration and save it to
  the database including organisation code and connection end date
- Keep all direct database access for researchers in one place, separate
  from the business logic in services

Layer:
Backend (Repository / Data Access)

Related:
- researcher.py in models (the table being queried)
- researcher_auth_service.py (calls these functions during login and registration)
- researcher_auth.py in routers (handles the HTTP requests for researcher auth)
- schemas/researcher_auth.py (validates the data before it reaches this layer)
- researcher_dashboard_router.py (uses researcher id to protect dashboard routes)
"""

from sqlalchemy.orm import Session
from app.models.researcher import Researcher


def get_researcher_by_email(db: Session, email: str) -> Researcher | None:
    """ 
    this function looks for a researcher in the database using their email
    it returns the farmer if found, otherwise it returns none
    this is mainly used during login to check if the farmer exists 
    """
    return db.query(Researcher).filter(Researcher.email == email).first()

def get_researcher_by_id(db: Session, researcher_id: int) -> Researcher | None:
    return db.query(Researcher).filter(Researcher.id == researcher_id).first()


def create_researcher(
    db: Session,
    email: str,
    first_name: str,
    last_name: str,
    org_code: str,
    connection_end: str,
    hashed_password: str,
) -> Researcher:
    r = Researcher(
        email=email,
        first_name=first_name,
        last_name=last_name,
        org_code=org_code,
        connection_end=connection_end,
        hashed_password=hashed_password,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r