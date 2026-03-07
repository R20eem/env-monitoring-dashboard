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