from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token
from app.schemas.common import MeResponse, TokenResponse
from app.repositories.farmer_repository import get_farmer_by_email
from app.repositories.researcher_repository import get_researcher_by_email
from app.services.farmer_auth_service import login_farmer
from app.services.researcher_auth_service import login_researcher
from app.services.auth_errors import AuthError

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


@router.get("/me", response_model=MeResponse)
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

    return MeResponse(id=user.id, email=user.email, role=role)