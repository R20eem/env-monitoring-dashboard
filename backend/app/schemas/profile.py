"""
File: profile.py (schemas)

Purpose:
Defines the response schema for public profile data returned when
a user's profile is requested from the profile router.

Responsibilities:
- Shape the profile response returned to the frontend when someone
  clicks on a post author's name in the community blog
- Include the user's id, role, full name, and email so the frontend
  can build a basic profile page
- Keep the response minimal since this is public profile data, not
  the full account details returned by the /auth/me endpoint

Layer:
Backend (Schema / Data Validation)

Related:
- profile_router.py (uses this schema as the response model for
  GET /profiles/{role}/{user_id})
- farmer_repository.py (returns the farmer object that gets shaped
  into this response)
- researcher_repository.py (returns the researcher object that gets
  shaped into this response)
- blog.js (frontend that triggers a profile request when a user
  clicks on a post author)

  Reference:

ChatGPT and Claude were used during the development of this 

file to support debugging and to clarify concepts needed to implement specific 

features. All code was written, reviewed, and tested by the development team.

ChatGPT (2026) ChatGPT [AI assistant]. OpenAI. Available at: https://chat.openai.com (Accessed: May 2026).

Claude (2026) Claude [AI assistant]. Anthropic. Available at: https://claude.ai (Accessed: May 2026).

"""

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
