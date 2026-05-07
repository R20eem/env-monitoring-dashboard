"""
File: post.py (schemas)

Purpose:
Defines the request and response schemas for the community blog
feature, covering posts, comments, and likes.

Responsibilities:
- Validate post creation input ensuring title and content are
  not empty before passing to the service layer
- Shape the post response returned to the frontend including
  author name, role, like count, and comment count per post
- Validate comment creation input ensuring content is not empty
- Shape the comment response returned to the frontend including
  author name, role, and timestamp
- Shape the like response returned after liking or unliking a post
  so the frontend can update the like counter immediately

Layer:
Backend (Schema / Data Validation)

Related:
- post_router.py (uses these schemas as request and response types)
- post_service.py (builds the response data that matches these shapes)
- post_repository.py (returns the raw database objects that get shaped
  into these responses)
- post.py in models (the database model being serialised)
- post_comment.py in models (the comment model being serialised)
- post_like.py in models (the like model being serialised)
- blog.js (frontend that sends post and comment data and renders
  the feed using the response shapes defined here)
"""

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