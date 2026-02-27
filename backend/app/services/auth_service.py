from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password, create_access_token
from app.repositories.user_repository import get_user_by_email, create_user

class AuthError(Exception):
    pass

def register(db: Session, email: str, password: str):
    """
    register a new user.
    - check if the email already exists
    - hash the password
    - save user in the database
    """
    # if a user already exists with this email, block registration
    if get_user_by_email(db, email):
        raise AuthError("Email already registered")
    return create_user(db, email, hash_password(password))

def login(db: Session, email: str, password: str) -> str:
    """
    log in a user.
    - find the user by email
    - verify the password matches the stored hash
    - if valid, return a JWT token
    """
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise AuthError("Invalid email or password")
    return create_access_token(subject=user.email)