from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password, create_access_token
from app.repositories.farmer_repository import get_farmer_by_email, create_farmer
from app.services.auth_errors import AuthError


def register_farmer(db: Session, first_name: str, last_name: str, email: str, experience: str, location: str, password: str):
    """
    this function handles the logic for farmer registration
    it is called by the router when a farmer sends a request to:
    POST /auth/farmers/register
    """
    if get_farmer_by_email(db, email):
    # check if a farmer with this email already exists
    # if it does, we stop the process and raise an error Autherror
        raise AuthError("Farmer email already registered")

    hp = hash_password(password)
    return create_farmer(db, first_name, last_name, email, experience, location, hp)


def login_farmer(db: Session, email: str, password: str) -> str:
    """
    look for the farmer in the database using the email
    if the farmer does not exist OR the password is incorrect
    and if login is successful we create a JWT token
    """
    farmer = get_farmer_by_email(db, email)
    if not farmer or not verify_password(password, farmer.hashed_password):
        raise AuthError("Invalid farmer credentials")

    return create_access_token(subject=farmer.email, role="farmer")