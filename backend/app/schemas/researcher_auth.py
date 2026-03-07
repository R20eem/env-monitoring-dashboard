import re
from pydantic import BaseModel, EmailStr, Field, field_validator

# rgex used to check that the organisation code
# is exactly 4 digits (for now we accept any 4 digits) we could do a table latter
ORG_RE = re.compile(r"^\d{4}$")


class ResearcherRegisterRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    org_code: str = Field(min_length=4, max_length=4)
    connection_end: str = Field(min_length=10, max_length=10)  # YYYY-MM-DD
    password: str = Field(min_length=8, max_length=128)

    @field_validator("org_code")
    @classmethod
    def validate_org(cls, v: str) -> str:
        if not ORG_RE.match(v):
            raise ValueError("org_code must be exactly 4 digits")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", value):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Password must contain at least one special character")
        return value


class ResearcherLoginRequest(BaseModel):
    email: EmailStr
    org_code: str = Field(min_length=4, max_length=4)
    password: str = Field(min_length=1, max_length=128)

    # we validate the org code here as well to make sure
    # it is still exactly 4 digits during login
    @field_validator("org_code")
    @classmethod
    def validate_org(cls, v: str) -> str:
        if not ORG_RE.match(v):
            raise ValueError("org_code must be exactly 4 digits")
        return v