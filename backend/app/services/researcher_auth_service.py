"""
File: researcher_auth_service.py

Purpose:
Handles the business logic for researcher registration and login,
sitting between the router and the repository layers.

Responsibilities:
- Check if a researcher with the given email already exists before
  registering, and raise AuthError if the email is taken
- Hash the password before passing it to the repository for storage
- Create a new researcher record in the database via the repository
  including organisation code and connection end date
- Verify the researcher's email, organisation code, and password
  during login and raise AuthError if any credentials are incorrect
- Generate and return a signed JWT token on successful login

Layer:
Backend (Service / Business Logic)

Related:
- researcher_repository.py (get_researcher_by_email and
  create_researcher called by this service)
- core/security.py (hash_password, verify_password, and
  create_access_token used here)
- auth_errors.py (AuthError raised on registration and login failure)
- researcher_auth.py in routers (calls register_researcher and
  login_researcher and handles the HTTP response)
- schemas/researcher_auth.py (validates input before it reaches
  this service)
"""
from datetime import datetime, UTC
from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password, create_access_token
from app.repositories.researcher_repository import get_researcher_by_email, create_researcher
from app.services.auth_errors import AuthError


def register_researcher(db: Session, email: str, first_name: str, last_name: str, org_code: str, connection_end: str, password: str):
    """
    function that handles researcher registraion
    called when a request is sent to:
    POST /auth/researchers/registeration
    """
    if get_researcher_by_email(db, email):
        raise AuthError("Researcher email already registered")

    # simple date validation (YYYY-MM-DD)
    try:
        datetime.strptime(connection_end, "%Y-%m-%d")
    except ValueError:
        raise AuthError("connection_end must be in YYYY-MM-DD format")

    hp = hash_password(password)
    return create_researcher(db, email, first_name, last_name, org_code, connection_end, hp)


def login_researcher(db: Session, email: str, org_code: str, password: str) -> str:
    """
    function that handles researcher login
    called when a request is sent to:
    POST /auth/researchers/login
    """
    r = get_researcher_by_email(db, email)
    if not r:
        raise AuthError("Invalid researcher credentials")
     # check that the organization code matches the one in the database
    if r.org_code != org_code:
        raise AuthError("Invalid researcher credentials")

    if not verify_password(password, r.hashed_password):
        raise AuthError("Invalid researcher credentials")

    # check if the researcher's organisation connection has expired
    # if today's date is after the connection_end date we block the login
    end_date = datetime.strptime(r.connection_end, "%Y-%m-%d").date()
    if end_date < datetime.now(UTC).date():
        raise AuthError("Your organization connection has ended")

    return create_access_token(subject=r.email, role="researcher")