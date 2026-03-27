"""
Seed script: loads pest_monitoring.csv into the sensor_readings table.

Run from the backend/ directory using:
    python3 -m app.seed.seed_temperatures or python -m app.seed.seed_temperatures

The CSV has hundreds of thousands of rows so this uses batch inserts.
Safe to rerun since it clears the table first.
"""
import csv
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# path to the CSV
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "pest_monitoring.csv")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./envmonitor.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine)


def run():
    # import here to trigger table creation via Base.metadata
    from app.models.sensor_reading import SensorReading
    from app.database import Base

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # clear existing data so that any reruns won't duplicate rows
        db.execute(text("DELETE FROM sensor_readings"))
        db.commit()
        print("Cleared existing sensor_readings rows.")

        batch = []
        batch_size = 1000
        total = 0
        skipped = 0

        with open(CSV_PATH, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_temp = row.get("air_temperature_c", "").strip()

                # skip any rows with missing temp
                if not raw_temp:
                    skipped += 1
                    continue

                batch.append({
                    "site_id": row["site_id"],
                    "timestamp": row["timestamp"],
                    "air_temperature_c": float(raw_temp),
                })

                # flush to db in batches to help avoid holding everything in memory!
                if len(batch) >= batch_size:
                    db.bulk_insert_mappings(SensorReading, batch)
                    db.commit()
                    total += len(batch)
                    batch = []
                    print(f"  inserted {total} rows...", end="\r")

        # insert any last remaining rows
        if batch:
            db.bulk_insert_mappings(SensorReading, batch)
            db.commit()
            total += len(batch)

        print(f"\nDone. Inserted {total} rows, skipped {skipped} (missing temp).")

    finally:
        db.close()


if __name__ == "__main__":
    run()