from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


# this table stores comments that users leave under posts
# both farmers and researchers can comment on posts
# every comment is connected to a specific post using post_id
class PostComment(Base):
    """
    This class represents the table that stores comments under posts.

    Whenever a user (farmer or researcher) writes a comment on a post,
    a new row is added to this table.

    Each comment stores:
    - the id of the post it belongs to (post_id)
    - the id of the user who wrote the comment (author_id)
    - whether the user is a farmer or researcher (author_role)
    - the actual text of the comment (content)
    - the time the comment was created (created_at)

    The frontend will usually fetch these comments through:
    GET /posts/{post_id}/comments
    so it can display all comments under a specific post.
    """
    __tablename__ = "post_comments"

    # unique id for each comment
    id: Mapped[int] = mapped_column(primary_key=True)

    # this tells us which post the comment belongs to
    # for example if post_id = 5, the comment is under post 5
    post_id: Mapped[int] = mapped_column(Integer, nullable=False)

    # id of the user who wrote the comment
    # we store this instead of the email so we can reference the user profile
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)

    # this tells us if the user is a farmer or a researcher
    # we need this because farmers and researchers are stored in different tables
    # also i think frontend can add diffrent colour for 
    # farmers / researcher comments
    author_role: Mapped[str] = mapped_column(String(50), nullable=False)

    content: Mapped[str] = mapped_column(Text, nullable=False)
    # this helps the frontend show comments in order, newest first?
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)