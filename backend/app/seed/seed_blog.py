"""
File: seed_blog.py

Purpose:
Seeds the database with demo farmer, researcher, and blog post data
so the community blog page has realistic content to display during
development and testing.

Responsibilities:
- Create all database tables if they do not already exist
- Check if posts already exist before seeding to prevent duplicates
- Create a demo farmer account and a demo researcher account with
  hashed passwords for safe storage
- Create a set of realistic demo blog posts authored by both the
  demo farmer and demo researcher, covering topics relevant to the
  system such as frost damage, soil analysis, and irrigation
- Roll back the database if anything goes wrong during seeding

Layer:
Backend (Seed / Database Population)

Related:
- farmer.py in models (demo farmer created by this script)
- researcher.py in models (demo researcher created by this script)
- post.py in models (demo posts created by this script)
- core/security.py (hash_password used to safely store demo passwords)
- seed_sensor_readings.py (separate seed script for sensor data)
- database.py (provides the engine and session used to run the seed)
"""

from app.database import SessionLocal, engine, Base
from app.models.farmer import Farmer
from app.models.researcher import Researcher
from app.models.post import Post
from app.core.security import hash_password

def run_seed():
    # 1. Ensure tables exist in the database
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if the database already has posts to prevent duplicates
        if db.query(Post).count() > 0:
            print("Database already has posts! Skipping seed.")
            return

        print("Planting the seeds... 🌱")

        # 2. Create a Demo Farmer
        demo_farmer = Farmer(
            first_name="Elias",
            last_name="Barns",
            email="elias@ecoleaf.com",
            experience="15 years",
            location="North Valley Farm",
            hashed_password=hash_password("demo123")
        )
        db.add(demo_farmer)

        # 3. Create a Demo Researcher
        demo_researcher = Researcher(
            first_name="Dr. Sarah",
            last_name="Chen",
            email="schen@ecoleaf.edu",
            org_code="ECO1",
            connection_end="2026-12-31",
            hashed_password=hash_password("demo123")
        )
        db.add(demo_researcher)

        # Save the users to the database so we can get their generated IDs
        db.commit()
        db.refresh(demo_farmer)
        db.refresh(demo_researcher)

        # 4. Create Demo Posts related to Environmental Monitoring
        posts = [
            Post(
                title="Unexpected frost damage in Sector 4",
                content="Woke up to severe frost on the early tomato crops. Anyone else experiencing this microclimate shift? Might need to deploy the thermal covers early.",
                author_id=demo_farmer.id,
                author_role="farmer"
            ),
            Post(
                title="Q1 Soil pH analysis results",
                content="Our latest drone mapping and soil sampling shows a noticeable acidification trend in the northern valleys. Recommend adjusting lime treatments before the spring rain.",
                author_id=demo_researcher.id,
                author_role="researcher"
            ),
            Post(
                title="Upgraded to new drip irrigation",
                content="Just installed the new targeted drip system based on last month's moisture alerts. Early metrics show water usage is down 20% while keeping soil moisture optimal!",
                author_id=demo_farmer.id,
                author_role="farmer"
            )
        ]

        db.add_all(posts)
        db.commit()
        print("✅ Success! Demo data has been added to your database.")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()