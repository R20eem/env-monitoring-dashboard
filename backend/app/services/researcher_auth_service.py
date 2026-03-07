from datetime import datetime
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

    # check if the researcher's organization connection has expired
    # if today's date is after the connection_end date we block the login
    end_date = datetime.strptime(r.connection_end, "%Y-%m-%d").date()
    if end_date < datetime.utcnow().date():
        raise AuthError("Your organization connection has ended")

    return create_access_token(subject=r.email, role="researcher")