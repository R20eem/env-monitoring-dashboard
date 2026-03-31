"""
Seed script: loads pest_monitoring.csv into the sensor_readings table.

Run from the backend/ directory using:
    python3 -m app.seed.seed_sensor_readings

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


def is_valid_reading(
    air_temperature_c: float | None,
    relative_humidity_pct: float | None,
    leaf_wetness_0_1: float | None,
    pest_trap_count: float | None,
    wx_rain_mm_hr: float | None,
) -> bool:
    """
    checks if sensor values are within expected ranges
    """

    if air_temperature_c is not None and not (-20 <= air_temperature_c <= 60):
        return False

    if relative_humidity_pct is not None and not (0 <= relative_humidity_pct <= 100):
        return False

    if leaf_wetness_0_1 is not None and not (0 <= leaf_wetness_0_1 <= 1):
        return False

    if pest_trap_count is not None and pest_trap_count < 0:
        return False

    if wx_rain_mm_hr is not None and wx_rain_mm_hr < 0:
        return False

    return True


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
        skipped_invalid = 0

        with open(CSV_PATH, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_temp = row.get("air_temperature_c", "").strip()
                raw_humidity = row.get("relative_humidity_pct", "").strip()
                raw_leaf_wetness = row.get("leaf_wetness_0_1", "").strip()
                raw_pest_count = row.get("pest_trap_count", "").strip()
                raw_rainfall = row.get("wx_rain_mm_hr", "").strip()
                raw_status = row.get("status", "").strip()
                raw_alert_triggered = row.get("alert_triggered", "").strip()
                raw_alert_pest_action = row.get("alert_pest_action", "").strip()
                raw_alert_pest_outbreak = row.get("alert_pest_outbreak", "").strip()
                raw_alert_disease_moderate = row.get("alert_disease_moderate", "").strip()
                raw_alert_disease_high = row.get("alert_disease_high", "").strip()

                temp = float(raw_temp) if raw_temp else None
                humidity = float(raw_humidity) if raw_humidity else None
                leaf_wetness = float(raw_leaf_wetness) if raw_leaf_wetness else None
                pest_count = float(raw_pest_count) if raw_pest_count else None
                rainfall = float(raw_rainfall) if raw_rainfall else None

                # skip rows with impossible values
                if not is_valid_reading(
                    air_temperature_c=temp,
                    relative_humidity_pct=humidity,
                    leaf_wetness_0_1=leaf_wetness,
                    pest_trap_count=pest_count,
                    wx_rain_mm_hr=rainfall,
                ):
                    skipped_invalid += 1
                    continue

                batch.append({
                    "site_id": row["site_id"],
                    "timestamp": row["timestamp"],
                    "air_temperature_c": temp,
                    "relative_humidity_pct": humidity,
                    "leaf_wetness_0_1": leaf_wetness,
                    "pest_trap_count": pest_count,
                    "wx_rain_mm_hr": rainfall,
                    "status": raw_status if raw_status else None,
                    "alert_triggered": float(raw_alert_triggered) if raw_alert_triggered else None,
                    "alert_pest_action": float(raw_alert_pest_action) if raw_alert_pest_action else None,
                    "alert_pest_outbreak": float(raw_alert_pest_outbreak) if raw_alert_pest_outbreak else None,
                    "alert_disease_moderate": float(raw_alert_disease_moderate) if raw_alert_disease_moderate else None,
                    "alert_disease_high": float(raw_alert_disease_high) if raw_alert_disease_high else None,
                })

                # flush to db in batches to help avoid holding everything in memory
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

        print(f"\nDone. Inserted {total} rows. Skipped invalid rows: {skipped_invalid}.")

    finally:
        db.close()


if __name__ == "__main__":
    run()