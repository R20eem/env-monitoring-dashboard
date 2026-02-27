from sqlalchemy.orm import Session
from app.models.user import User

def get_user_by_email(db: Session, email: str) -> User | None:
    """
    search the database for a given email, returns none if 
    user does not exist
    """
    return db.query(User).filter(User.email == email).first()

# this function creates a new user in the database.
def create_user(db: Session, email: str, hashed_password: str) -> User:
    user = User(email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user