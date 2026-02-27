import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext

JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME")

# algorithm used for JWT  --> JSON Web Token 
# simple, fast and most commen alg for API. we could change it latter if we wanted
ALGORITHM = "HS256"

# token expiration time (in minutes) -- 1h
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# pbkdf2_sha256 --> key derivation function designed to produce a symmtric cryptographic key from a password
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    """
    hashs a plaintext password before storing it in the database.
    never store plain passwords
    """
    return pwd_context.hash(password)



def verify_password(password: str, hashed_password: str) -> bool:
    """
    compares a plaintext password with a stored hashed password.
    returns true if passwords match.
    """
    return pwd_context.verify(password, hashed_password)



def create_access_token(subject: str) -> str:
    """
    This function creates a JWT token after the user logs in successfully.

    The "subject" is basically who the token belongs to.
    In our case, we use the user's email to identify them.

    Inside the token we store:
        - "sub": the user's identity
        - "exp": the expiration time (so the token doesn't last forever)

    The token is signed using our secret key and HS256 algorithm,
    which means if someone tries to change anything inside the token,
    the signature will not match and the request will be rejected.

    We use this token instead of sessions, so the user sends it
    with every request to prove they are authenticated.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)



def decode_access_token(token: str) -> str:
    """    
    Decode the token using the same secret and algorithm.
    This step verifies:
       1) The signature is valid (token wasn't changed)
       2) The token has not expired 
    """
    payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    sub = payload.get("sub")
    # If the token does not contain a subject,
    # we raise an error
    if not sub:
        raise JWTError("Missing sub")
    # return the user's id (email)
    return sub
