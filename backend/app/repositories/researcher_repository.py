from sqlalchemy.orm import Session
from app.models.researcher import Researcher


def get_researcher_by_email(db: Session, email: str) -> Researcher | None:
    """ 
    this function looks for a researcher in the database using their email
    it returns the farmer if found, otherwise it returns none
    this is mainly used during login to check if the farmer exists 
    """
    return db.query(Researcher).filter(Researcher.email == email).first()


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