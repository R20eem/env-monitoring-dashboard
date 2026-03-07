import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Literal

# these are the allowed options for the farmer's experience level
# we use Literal so only these values can be submitted
# this helps keep the data consistent in the database
ExperienceLevel = Literal[
    "0-1 years",
    "1-3 years",
    "3-5 years",
    "5+ years"
]

class FarmerRegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    experience: ExperienceLevel
    location: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)

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


class FarmerLoginRequest(BaseModel):
    email: EmailStr
    # password entered by the farmer
    password: str = Field(min_length=1, max_length=128)