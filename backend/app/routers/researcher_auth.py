"""
File: researcher_auth.py

Purpose:
Handles HTTP endpoints for researcher registration and login,
connecting incoming requests to the researcher authentication
service and returning appropriate responses or errors.

Responsibilities:
- Accept and validate researcher registration data including
  organisation code and connection end date, and pass it to
  the service layer to create a new researcher account
- Accept researcher login credentials including email, org code,
  and password, and return a signed JWT token if correct
- Return clear HTTP error responses if registration fails
  (e.g. email already exists) or login fails (wrong credentials)

Layer:
Backend (Router / API)

Related:
- researcher_auth_service.py (handles registration and login logic)
- schemas/researcher_auth.py (validates request body for register and login)
- schemas/common.py (TokenResponse and MeResponse used as return types)
- researcher_repository.py (database queries called by the service)
- core/security.py (password hashing and JWT token creation)
- auth.js (frontend that sends login and register requests)
- main.py (registers this router with the FastAPI app)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import TokenResponse, MeResponse
from app.schemas.researcher_auth import ResearcherRegisterRequest, ResearcherLoginRequest
from app.services.researcher_auth_service import register_researcher, login_researcher
from app.services.auth_errors import AuthError

router = APIRouter(prefix="/auth/researchers", tags=["researchers-auth"])

# endpoint used to register a new researcher
@router.post("/register", response_model=MeResponse, status_code=201)
def register_researcher_endpoint(body: ResearcherRegisterRequest, db: Session = Depends(get_db)):
    try:
        r = register_researcher(db, body.email, body.first_name, body.last_name, body.org_code, body.connection_end, body.password)
        return MeResponse(id=r.id, email=r.email, role="researcher")
    
    # if something goes wrong (like email already exists)
    # the service raises AuthError which we convert to an HTTP error
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))

# endpoint used for researcher login
# checks the email, org code, and password
# if the credentials are correct it returns a JWT token
@router.post("/login", response_model=TokenResponse)
def login_researcher_endpoint(body: ResearcherLoginRequest, db: Session = Depends(get_db)):
    try:
        token = login_researcher(db, body.email, body.org_code, body.password)
        return TokenResponse(access_token=token)
    # if login fails we return a 401 unauthorized error
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))