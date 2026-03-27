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