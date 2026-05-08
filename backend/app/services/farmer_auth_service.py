"""
File: farmer_auth_service.py

Purpose:
Handles the business logic for farmer registration and login,
sitting between the router and the repository layers.

Responsibilities:
- Check if a farmer with the given email already exists before
  registering, and raise AuthError if the email is taken
- Hash the password before passing it to the repository for storage
- Create a new farmer record in the database via the repository
- Verify the farmer's email and password during login and raise
  AuthError if the credentials are incorrect
- Generate and return a signed JWT token on successful login

Layer:
Backend (Service / Business Logic)

Related:
- farmer_repository.py (get_farmer_by_email and create_farmer
  called by this service)
- core/security.py (hash_password, verify_password, and
  create_access_token used here)
- auth_errors.py (AuthError raised on registration and login failure)
- farmer_auth.py in routers (calls register_farmer and login_farmer
  and handles the HTTP response)
- schemas/farmer_auth.py (validates input before it reaches
  this service)

Reference:

ChatGPT and Claude were used during the development of this 

file to support debugging and to clarify concepts needed to implement specific 

features. All code was written, reviewed, and tested by the development team.

ChatGPT (2026) ChatGPT [AI assistant]. OpenAI. Available at: https://chat.openai.com (Accessed: May 2026).

Claude (2026) Claude [AI assistant]. Anthropic. Available at: https://claude.ai (Accessed: May 2026).
 
"""

from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password, create_access_token
from app.repositories.farmer_repository import get_farmer_by_email, create_farmer
from app.services.auth_errors import AuthError


def register_farmer(db: Session, first_name: str, last_name: str, email: str, experience: str, location: str, password: str):
    """
    this function handles the logic for farmer registration
    it is called by the router when a farmer sends a request to:
    POST /auth/farmers/register
    """
    if get_farmer_by_email(db, email):
    # check if a farmer with this email already exists
    # if it does, we stop the process and raise an error Autherror
        raise AuthError("Farmer email already registered")

    hp = hash_password(password)
    return create_farmer(db, first_name, last_name, email, experience, location, hp)


def login_farmer(db: Session, email: str, password: str) -> str:
    """
    look for the farmer in the database using the email
    if the farmer does not exist OR the password is incorrect
    and if login is successful we create a JWT token
    """
    farmer = get_farmer_by_email(db, email)
    if not farmer or not verify_password(password, farmer.hashed_password):
        raise AuthError("Invalid farmer credentials")

    return create_access_token(subject=farmer.email, role="farmer")