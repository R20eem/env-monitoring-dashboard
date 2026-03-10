from datetime import datetime, timedelta, timezone
from jose import jwt

from app.core import security


def test_me_valid_token_but_user_deleted_or_not_in_db(client):
    """
    SECURITY TEST:

    This test checks something important about JWT authentication.

    Even if a token is technically valid ,
    that does NOT automatically mean the user is still valid in the system.

    For example:
    - A user logs in and gets a token.
    - later, that user gets deleted from the database.
    - the token itself is still valid until it expires (after 1 houre) .

    so after decoding the token, the backend must still check
    if the user actually exists in the database, if the user is not found, the system should return 401.
    """

    # create a token that is valid 
    # BUT the email inside it does not exist in our db.
    payload = {
        "sub": "deleteduser@example.com",  # this user is NOT in db
        "role": "farmer",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
    }

    token = jwt.encode(payload, security.JWT_SECRET, algorithm=security.ALGORITHM)

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert "user not found" in response.json()["detail"].lower()