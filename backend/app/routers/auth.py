from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, MeResponse
from app.services.auth_service import register, login, AuthError
from app.core.security import decode_access_token
from app.repositories.user_repository import get_user_by_email



router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")



@router.post("/register", response_model=MeResponse, status_code=201)
def register_endpoint(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    endpoint to register a new user.

    it takes the email and password from the request,
    creates the user, and returns basic user info --> id email for now 
    but we could add stuff later first, last name, data of birth etc
    """
    # register a new user.
    try:
        user = register(db, body.email, body.password)
        return MeResponse(id=user.id, email=user.email)
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.post("/login", response_model=TokenResponse)
def login_endpoint(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint:
    - Checks email/password
    - If correct, returns a JWT token
    """
    try:
        token = login(db, body.email, body.password)
        return TokenResponse(access_token=token)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))



def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """
    This function checks if the user is authenticated.

    It takes the JWT token from the request, verifies it,
    and gets the user's email from it.

    If the token is invalid, expired, or the user doesn't exist,
    it returns a 401 error.

    If everything is valid, it returns the user.
    """
    # decode the token to get the user's email
    try:
        email = decode_access_token(token)
    # If decoding fails and token is invalid or expired
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    # look for the user in the database
    user = get_user_by_email(db, email)
    # if no user, deny access
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    # everything is valid
    return user


@router.post("/token", response_model=TokenResponse)
def token_endpoint(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    This endpoint is mainly for Swagger's Authorize button.

    Swagger sends login info as form-data:
    - username (we use it as email)
    - password
    """
    try:
        token = login(db, form_data.username, form_data.password)
        return TokenResponse(access_token=token)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    

@router.get("/me", response_model=MeResponse)
def me_endpoint(user=Depends(get_current_user)):
    """
    A protected route:
    if the token is valid, it returns the user's info
    else returns 401
    """
    return MeResponse(id=user.id, email=user.email)