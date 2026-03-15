from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.post import Post
from app.models.post_like import PostLike
from app.models.post_comment import PostComment

"""
this file contains the database functions for posts, likes, and comments.

instead of writing SQL queries directly in the routers, we keep them here
to keep the project organised.

these functions are responsible for:
- creating posts
- getting posts from the database
- handling likes (add / remove / count)
- handling comments (create / fetch / count)

the routers will call these functions when the frontend sends requests
like creating a post, liking a post, or adding a comment.
"""

def create_post(db: Session, title: str, content: str, author_id: int, author_role: str) -> Post:
    # creates a new post and saves it to the database
    post = Post(
        title=title,
        content=content,
        author_id=author_id,
        author_role=author_role,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def get_post_by_id(db: Session, post_id: int) -> Post | None:
    # returns a single post using its id
    return db.query(Post).filter(Post.id == post_id).first()


def get_all_posts(db: Session) -> list[Post]:
    # returns all posts ordered by newest first (for the feed)
    return db.query(Post).order_by(Post.created_at.desc()).all()


def like_exists(db: Session, post_id: int, user_id: int, user_role: str) -> PostLike | None:
    # checks if a specific user already liked a post
    # used to prevent the same user liking a post multiple times
    return (
        db.query(PostLike)
        .filter(
            PostLike.post_id == post_id,
            PostLike.user_id == user_id,
            PostLike.user_role == user_role,
        )
        .first()
    )


def create_like(db: Session, post_id: int, user_id: int, user_role: str) -> PostLike:
    like = PostLike(
        post_id=post_id,
        user_id=user_id,
        user_role=user_role,
    )
    db.add(like)
    db.commit()
    db.refresh(like)
    return like


def delete_like(db: Session, like: PostLike) -> None:
    # removes a like from the database 
    db.delete(like)
    db.commit()


def count_likes(db: Session, post_id: int) -> int:
    # counts how many likes a post has
    return db.query(func.count(PostLike.id)).filter(PostLike.post_id == post_id).scalar() or 0


def create_comment(db: Session, post_id: int, author_id: int, author_role: str, content: str) -> PostComment:
    # creates a new comment under an exicting post
    comment = PostComment(
        post_id=post_id,
        author_id=author_id,
        author_role=author_role,
        content=content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def get_comments_by_post_id(db: Session, post_id: int) -> list[PostComment]:
    # returns all comments for a specific post
    return (
        db.query(PostComment)
        .filter(PostComment.post_id == post_id)
        .order_by(PostComment.created_at.asc())
        .all()
    )


def count_comments(db: Session, post_id: int) -> int:
    # counts how many comments a post has
    return db.query(func.count(PostComment.id)).filter(PostComment.post_id == post_id).scalar() or 0