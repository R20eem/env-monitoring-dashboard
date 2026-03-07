from sqlalchemy.orm import Session
from app.models.farmer import Farmer


def get_farmer_by_email(db: Session, email: str) -> Farmer | None:
    """ 
    this function looks for a farmer in the database using their email
    it returns the farmer if found, otherwise it returns none
    this is mainly used during login to check if the farmer exists 
    """
    return db.query(Farmer).filter(Farmer.email == email).first()


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