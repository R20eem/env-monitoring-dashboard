"""
File: farmer_repository.py

Purpose:
Handles all database queries for the farmers table, providing
functions to look up and create farmer accounts.

Responsibilities:
- Look up a farmer by email, used during login to verify credentials
- Look up a farmer by id, used when loading profile or scan history
- Create a new farmer record during registration and save it to the database
- Keep all direct database access for farmers in one place, separate
  from the business logic in services

Layer:
Backend (Repository / Data Access)

Related:
- farmer.py in models (the table being queried)
- farmer_auth_service.py (calls these functions during login and registration)
- farmer_auth.py in routers (handles the HTTP requests for farmer auth)
- schemas/farmer_auth.py (validates the data before it reaches this layer)
- scan_result.py (references farmer_id which comes from this table)
"""

from sqlalchemy.orm import Session
from app.models.farmer import Farmer


def get_farmer_by_email(db: Session, email: str) -> Farmer | None:
    """ 
    this function looks for a farmer in the database using their email
    it returns the farmer if found, otherwise it returns none
    this is mainly used during login to check if the farmer exists 
    """
    return db.query(Farmer).filter(Farmer.email == email).first()


def get_farmer_by_id(db: Session, farmer_id: int) -> Farmer | None:
    return db.query(Farmer).filter(Farmer.id == farmer_id).first()


"""creates a new farmer in the database
 it takes all the registration information and saves it
"""
def create_farmer(
    db: Session,
    first_name: str,
    last_name: str,
    email: str,
    experience: str,
    location: str,
    hashed_password: str,
) -> Farmer:
    """
    creates a new farmer in the database
    it takes all the registration information and saves it
    """
    farmer = Farmer(
        first_name=first_name,
        last_name=last_name,
        email=email,
        experience=experience,
        location=location,
        hashed_password=hashed_password,
    )
    # add the farmer to the database
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    return farmer