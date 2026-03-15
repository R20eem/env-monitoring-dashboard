from pydantic import BaseModel, EmailStr


# this is the response returned when the frontend requests a user's profile
# frontend will usually call /profiles/{role}/{user_id} when someone clicks on a post author
# the data returned here can be used to build the profile page
class ProfileResponse(BaseModel):

    # user id in the database
    id: int

    # tells frontend if the user is a farmer or researcher
    role: str

    # full name of the user (first + last name combined)
    # frontend can display this as the profile title
    full_name: str

    # email of the user
    # mostly just basic profile info
    email: EmailStr
