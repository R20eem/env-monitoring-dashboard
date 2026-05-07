"""
File: me_router.py

Purpose:
Handles shared authentication endpoints that apply to both farmers
and researchers, including fetching the current user's profile,
updating profile details, and changing passwords.

Responsibilities:
- Provide a /auth/token endpoint for Swagger UI authentication
- Return the current logged in user's profile data via /auth/me,
  returning different fields depending on whether the user is a
  farmer or researcher
- Allow users to update their first name, last name, and connection
  end date via /auth/update-profile
- Allow users to change their password via /auth/change-password,
  verifying the current password before saving the new one
- Decode and validate the JWT token on every protected endpoint
  to confirm the user is authenticated before returning any data

Layer:
Backend (Router / API)

Related:
- core/security.py (decode_access_token, hash_password, verify_password)
- farmer_repository.py (looks up farmer by email from the token)
- researcher_repository.py (looks up researcher by email from the token)
- farmer_auth_service.py (used by the token endpoint for Swagger login)
- schemas/common.py (MeResponse and TokenResponse)
- profile.js (frontend that calls /auth/me and /auth/update-profile)
- auth.js (frontend that uses the token returned by /auth/token)
- main.py (registers this router with the FastAPI app)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional

from app.database import get_db
from app.core.security import decode_access_token, hash_password, verify_password
from app.schemas.common import MeResponse, TokenResponse
from app.repositories.farmer_repository import get_farmer_by_email
from app.repositories.researcher_repository import get_researcher_by_email
from app.services.farmer_auth_service import login_farmer
from app.services.researcher_auth_service import login_researcher
from app.services.auth_errors import AuthError

class UpdateProfileRequest(BaseModel):
    first_name:     Optional[str] = None
    last_name:      Optional[str] = None
    connection_end: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


@router.post("/token", response_model=TokenResponse)
def token_endpoint(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    This endpoint is mainly for Swagger Authorize.
    It accepts:
    - username -> email
    - password -> password

    For now this tries farmer login first, then researcher login.
    Researcher login still needs org_code, so Swagger login will only work easily for farmers
    unless you make a separate token route for researchers too.
    """
    try:
        token = login_farmer(db, form_data.username, form_data.password)
        return TokenResponse(access_token=token)
    except AuthError:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials for Swagger token login"
    )


# @router.get("/me", response_model=MeResponse) changed to the below so the profile page can have more info and sperate 
@router.get("/me")
def me(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    try:
        email, role = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if role == "farmer":
        user = get_farmer_by_email(db, email)
    elif role == "researcher":
        user = get_researcher_by_email(db, email)
    else:
        user = None

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # return MeResponse(id=user.id, email=user.email, role=role)
    if role == "researcher":
        return {
            "id": user.id,
            "email": user.email,
            "role": role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "org_code": user.org_code,
            "connection_end": user.connection_end
        }

    elif role == "farmer":
        return {
            "id": user.id,
            "email": user.email,
            "role": role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "location": user.location,
            "experience": user.experience
     }
    

@router.put("/update-profile")
def update_profile(
    body: UpdateProfileRequest,
    db:    Session = Depends(get_db),
    token: str     = Depends(oauth2_scheme)
):
    try:
        email, role = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if role == "farmer":
        user = get_farmer_by_email(db, email)
    elif role == "researcher":
        user = get_researcher_by_email(db, email)
    else:
        user = None

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.first_name is not None:
        user.first_name = body.first_name
    if body.last_name is not None:
        user.last_name = body.last_name

    if role == "researcher" and body.connection_end is not None:
        from datetime import datetime
        try:
            user.connection_end = datetime.strptime(body.connection_end, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    db.commit()
    db.refresh(user)

    return {"message": "Profile updated successfully"}


@router.put("/change-password")
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    try:
        email, role = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if role == "farmer":
        user = get_farmer_by_email(db, email)
    elif role == "researcher":
        user = get_researcher_by_email(db, email)
    else:
        user = None

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.hashed_password = hash_password(body.new_password)
    db.commit()

    return {"message": "Password updated successfully"}
