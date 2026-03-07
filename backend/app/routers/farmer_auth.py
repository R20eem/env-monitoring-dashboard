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