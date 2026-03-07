from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token
from app.schemas.common import MeResponse
from app.repositories.farmer_repository import get_farmer_by_email
from app.repositories.researcher_repository import get_researcher_by_email


router = APIRouter(prefix="/auth", tags=["auth"])

# this is used to get the JWT token from the request header
# the token should be sent like: Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


@router.get("/me", response_model=MeResponse)
def me(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    try:
        # decode the token to get the user's email and role
        email, role = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # depending on the role in the token we check the correct table
    if role == "farmer":
        user = get_farmer_by_email(db, email)
    elif role == "researcher":
        user = get_researcher_by_email(db, email)
    else:
        user = None

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return MeResponse(id=user.id, email=user.email, role=role)