from datetime import datetime
from pydantic import BaseModel, Field

# used when the frontend creates a new post
# frontend should send title and content in the request body
# example:
# {
#   "title": "sensors in dry soil",
#   "content": "has anyone tried sensors in dry soil?"
# }
class PostCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)

# this is what the backend sends back when returning a post
# frontend will use this for the feed page
# it includes author info likes and comment counts
# i suggest we put diffrent background colour for researchesr/farmesr?
class PostResponse(BaseModel):
    id: int
    title: str
    content: str

    author_id: int
    author_role: str
    author_name: str

    # frontend can show these numbers on the post
    likes_count: int
    comments_count: int

    created_at: datetime

# used when someone writes a comment
# frontend only needs to send the comment text
# should we change min length?
class CommentCreateRequest(BaseModel):
    content: str = Field(min_length=1)

# this is what the backend returns for comments
# frontend can use this to show the comments list under a post
class CommentResponse(BaseModel):
    id: int
    post_id: int

    #who wrote the comment
    author_id: int
    author_role: str
    author_name: str

    content: str
    created_at: datetime

# response returned after liking or unliking a post
# frontend can use likes_count to update the like counter
class LikeResponse(BaseModel):
    message: str
    likes_count: int