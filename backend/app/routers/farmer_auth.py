"""
File: farmer_auth.py

Purpose:
Handles HTTP endpoints for farmer registration and login,
connecting incoming requests to the farmer authentication
service and returning appropriate responses or errors.

Responsibilities:
- Accept and validate farmer registration data and pass it
  to the service layer to create a new farmer account
- Accept farmer login credentials and return a signed JWT
  token if the credentials are correct
- Return clear HTTP error responses if registration fails
  (e.g. email already exists) or login fails (wrong password)

Layer:
Backend (Router / API)

Related:
- farmer_auth_service.py (handles the registration and login logic)
- schemas/farmer_auth.py (validates the request body for register and login)
- schemas/common.py (TokenResponse and MeResponse used as return types)
- farmer_repository.py (database queries called by the service)
- core/security.py (password hashing and JWT token creation)
- auth.js (frontend that sends login and register requests)
- main.py (registers this router with the FastAPI app)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import TokenResponse, MeResponse
from app.schemas.farmer_auth import FarmerRegisterRequest, FarmerLoginRequest
from app.services.farmer_auth_service import register_farmer, login_farmer
from app.services.auth_errors import AuthError

# this router handles all farmer authentication endpoints
router = APIRouter(prefix="/auth/farmers", tags=["farmers-auth"])

"""
endpoint used to register a new farmer
it receives the farmer's information from the request body
(first name, last name, email, experience, location, and password)
the service layer handles validation and database creation
if successful, it returns the farmer's id, email, and role
"""
@router.post("/register", response_model=MeResponse, status_code=201)
def register_farmer_endpoint(body: FarmerRegisterRequest, db: Session = Depends(get_db)):
    try:
        farmer = register_farmer(db, body.first_name, body.last_name, body.email, body.experience, body.location, body.password)
        return MeResponse(id=farmer.id, email=farmer.email, role="farmer")
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))

"""
endpoint for farmer login
checks the farmer credentials and returns a JWT token if successful
"""
@router.post("/login", response_model=TokenResponse)
def login_farmer_endpoint(body: FarmerLoginRequest, db: Session = Depends(get_db)):
    try:
        token = login_farmer(db, body.email, body.password)
        return TokenResponse(access_token=token)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))