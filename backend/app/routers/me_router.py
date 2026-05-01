from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.core.security import decode_access_token
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
    