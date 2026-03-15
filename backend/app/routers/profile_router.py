from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.profile import ProfileResponse
from app.repositories.farmer_repository import get_farmer_by_id
from app.repositories.researcher_repository import get_researcher_by_id

# this router handles profile related endpoints
# frontend can use this when a user clicks on someone's name from a post
# it returns basic profile info like name role and email
router = APIRouter(prefix="/profiles", tags=["profiles"])


# get a user's profile
# frontend should send the role and user id in the url
# example:
# /profiles/farmer/1
# /profiles/researcher/2
# this lets the frontend open a profile page when someone clicks on a post author
@router.get("/{role}/{user_id}", response_model=ProfileResponse)
def get_profile(role: str, user_id: int, db: Session = Depends(get_db)):
    # since we have two user tables we check the role first
    # then we load the correct user from the database
    if role == "farmer":
        user = get_farmer_by_id(db, user_id)
    elif role == "researcher":
        user = get_researcher_by_id(db, user_id)
    else:
        user = None

    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # send basic profile info back to the frontend
    # frontend can use this to show the profile page
    return ProfileResponse(
        id=user.id,
        role=role,
        full_name=f"{user.first_name} {user.last_name}",
        email=user.email,
    )