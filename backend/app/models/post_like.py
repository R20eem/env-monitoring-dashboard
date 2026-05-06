"""
File: post_like.py

Purpose:
Defines the database model for the post_likes table, which tracks
which users have liked which blog posts.

Responsibilities:
- Map the post_likes table using SQLAlchemy ORM
- Store one row per like, linking a user to a post
- Track the user role alongside the user id since farmers and
  researchers are stored in separate tables
- Record when each like was created

Layer:
Backend (Database Model)

Related:
- post.py (the post being liked)
- post_comment.py (similar structure for comments on posts)
- post_service.py (handles like and unlike logic)
- post_router.py (exposes POST /posts/{post_id}/like endpoint)
- blog.js (frontend updates like count after user interaction)
"""
from datetime import datetime
from sqlalchemy import String, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


# stores likes for posts
# one row = one user liked one post
class PostLike(Base):
    """
    This table keeps track of likes on posts.

    Whenever a user (farmer or researcher) clicks the like button on a post,
    a new row gets added here.

    We store the post_id so we know which post was liked,
    and the user_id + user_role so we know who liked it.

    We also store when the like happened (created_at).

    The frontend will use this through endpoints like:
    POST /posts/{post_id}/like
    DELETE /posts/{post_id}/like
    to update the like count on a post.
    """
    __tablename__ = "post_likes"

    id: Mapped[int] = mapped_column(primary_key=True)

    post_id: Mapped[int] = mapped_column(Integer, nullable=False)

    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    user_role: Mapped[str] = mapped_column(String(50), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)