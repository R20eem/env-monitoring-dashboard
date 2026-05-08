"""
File: seed_sensor_readings.py

Purpose:
Loads the pest_monitoring CSV dataset into the database, applying
validation and alert threshold logic to each row before storing it
in the sensor_readings and alert_log tables.

Responsibilities:
- Clear existing sensor_readings, alert_log, and site_metadata rows
  before seeding to ensure a clean state on every run
- Seed the site_metadata table with the three monitored sites:
  site_maize, site_brassica, and site_orchard
- Read each row from the CSV and parse sensor values including
  temperature, humidity, leaf wetness, pest count, and rainfall
- Skip rows with values outside valid ranges to filter out corrupt
  or unrealistic sensor data before storing
- Skip duplicate rows where the same site and timestamp already
  exist in the current batch
- Apply the alert threshold rules to each valid row to compute
  status (normal, warning, critical) and alert flags before storing,
  so the dashboard can retrieve already-processed results at runtime
- Insert rows into the database in batches of 1000 to handle the
  large CSV dataset efficiently without running out of memory
- Write triggered alert events to the alert_log table alongside
  the sensor readings

Layer:
Backend (Seed / Database Population)

Related:
- sensor_reading.py in models (the table being populated)
- alert_log.py in models (alert events written during seeding)
- site_metadata.py in models (site metadata seeded by this script)
- seed_blog.py (separate seed script for demo users and blog posts)
- sensor_reading_repository.py (queries the data populated here)
- researcher_dashboard_router.py (exposes this data to researchers)
- farmer_dashboard.js (displays the pre-calculated alerts and status
  populated by this script on the farmer dashboard)

  Reference:

ChatGPT and Claude were used during the development of this 

file to support debugging and to clarify concepts needed to implement specific 

features. All code was written, reviewed, and tested by the development team.

ChatGPT (2026) ChatGPT [AI assistant]. OpenAI. Available at: https://chat.openai.com (Accessed: May 2026).

Claude (2026) Claude [AI assistant]. Anthropic. Available at: https://claude.ai (Accessed: May 2026).

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


def evaluate_alerts(
    air_temperature_c: float | None,
    relative_humidity_pct: float | None,
    leaf_wetness_0_1: float | None,
    pest_trap_count: float | None,
):
    """
    computes alert flags and overall status from raw sensor values
    """

    alert_pest_action = 0.0
    alert_pest_outbreak = 0.0
    alert_disease_moderate = 0.0
    alert_disease_high = 0.0
    status = "normal"
    alert_logs = []

    # pest rules
    if pest_trap_count is not None and pest_trap_count >= 5:
        alert_pest_action = 1.0
        status = "warning"
        alert_logs.append({
            "alert_type": "pest_action",
            "severity": "warning",
            "message": "pest count reached action threshold",
        })

    if pest_trap_count is not None and pest_trap_count >= 20:
        alert_pest_outbreak = 1.0
        status = "critical"
        alert_logs.append({
            "alert_type": "pest_outbreak",
            "severity": "critical",
            "message": "pest count reached outbreak threshold",
        })

    # disease rules
    disease_moderate_condition = (
        air_temperature_c is not None
        and 10 <= air_temperature_c <= 25
        and relative_humidity_pct is not None
        and relative_humidity_pct >= 90
        and leaf_wetness_0_1 is not None
        and leaf_wetness_0_1 >= 0.6
    )

    disease_high_condition = (
        air_temperature_c is not None
        and 10 <= air_temperature_c <= 25
        and relative_humidity_pct is not None
        and relative_humidity_pct >= 95
        and leaf_wetness_0_1 is not None
        and leaf_wetness_0_1 >= 0.85
    )

    if disease_moderate_condition:
        alert_disease_moderate = 1.0
        if status != "critical":
            status = "warning"
        alert_logs.append({
            "alert_type": "disease_moderate",
            "severity": "warning",
            "message": "environmental conditions support disease risk",
        })

    if disease_high_condition:
        alert_disease_high = 1.0
        status = "critical"
        alert_logs.append({
            "alert_type": "disease_high",
            "severity": "critical",
            "message": "high disease risk conditions detected",
        })

    alert_triggered = 1.0 if status in {"warning", "critical"} else 0.0

    return {
        "status": status,
        "alert_triggered": alert_triggered,
        "alert_pest_action": alert_pest_action,
        "alert_pest_outbreak": alert_pest_outbreak,
        "alert_disease_moderate": alert_disease_moderate,
        "alert_disease_high": alert_disease_high,
        "alert_logs": alert_logs,
    }


def run():
    # import here to trigger table creation via Base.metadata
    from app.models.sensor_reading import SensorReading
    from app.models.site_metadata import SiteMetadata
    from app.models.alert_log import AlertLog
    from app.database import Base

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # clear tables first
        db.execute(text("DELETE FROM alert_log"))
        db.execute(text("DELETE FROM sensor_readings"))
        db.execute(text("DELETE FROM site_metadata"))
        db.commit()

        # seed site metadata
        site_rows = [
            {
                "site_id": "site_maize",
                "location": "alice, eastern cape",
                "crop_type": "maize",
                "sensor_status": "active",
            },
            {
                "site_id": "site_brassica",
                "location": "alice, eastern cape",
                "crop_type": "brassica",
                "sensor_status": "active",
            },
            {
                "site_id": "site_orchard",
                "location": "alice, eastern cape",
                "crop_type": "orchard",
                "sensor_status": "active",
            },
        ]

        db.bulk_insert_mappings(SiteMetadata, site_rows)
        db.commit()
        print("Seeded site_metadata.")
        print("Cleared existing sensor_readings and alert_log rows.")

        batch = []
        alert_log_batch = []
        batch_size = 1000
        total = 0
        skipped_invalid = 0
        skipped_duplicates = 0
        seen_keys = set()

        with open(CSV_PATH, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_temp = row.get("air_temperature_c", "").strip()
                raw_humidity = row.get("relative_humidity_pct", "").strip()
                raw_leaf_wetness = row.get("leaf_wetness_0_1", "").strip()
                raw_pest_count = row.get("pest_trap_count", "").strip()
                raw_rainfall = row.get("wx_rain_mm_hr", "").strip()

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

                # skip duplicate readings in the csv
                key = (row["site_id"], row["timestamp"])
                if key in seen_keys:
                    skipped_duplicates += 1
                    continue
                seen_keys.add(key)

                # compute alert fields from sensor values
                computed_alerts = evaluate_alerts(
                    air_temperature_c=temp,
                    relative_humidity_pct=humidity,
                    leaf_wetness_0_1=leaf_wetness,
                    pest_trap_count=pest_count,
                )

                batch.append({
                    "site_id": row["site_id"],
                    "timestamp": row["timestamp"],
                    "air_temperature_c": temp,
                    "relative_humidity_pct": humidity,
                    "leaf_wetness_0_1": leaf_wetness,
                    "pest_trap_count": pest_count,
                    "wx_rain_mm_hr": rainfall,
                    "status": computed_alerts["status"],
                    "alert_triggered": computed_alerts["alert_triggered"],
                    "alert_pest_action": computed_alerts["alert_pest_action"],
                    "alert_pest_outbreak": computed_alerts["alert_pest_outbreak"],
                    "alert_disease_moderate": computed_alerts["alert_disease_moderate"],
                    "alert_disease_high": computed_alerts["alert_disease_high"],
                })

                for alert in computed_alerts["alert_logs"]:
                    alert_log_batch.append({
                        "site_id": row["site_id"],
                        "timestamp": row["timestamp"],
                        "alert_type": alert["alert_type"],
                        "severity": alert["severity"],
                        "message": alert["message"],
                    })

                # flush to db in batches
                if len(batch) >= batch_size:
                    db.bulk_insert_mappings(SensorReading, batch)
                    if alert_log_batch:
                        db.bulk_insert_mappings(AlertLog, alert_log_batch)
                    db.commit()

                    total += len(batch)
                    batch = []
                    alert_log_batch = []
                    print(f"  inserted {total} rows...", end="\r")

        # insert any last remaining rows
        if batch:
            db.bulk_insert_mappings(SensorReading, batch)
            if alert_log_batch:
                db.bulk_insert_mappings(AlertLog, alert_log_batch)
            db.commit()
            total += len(batch)

        print(
            f"\nDone. Inserted {total} rows. "
            f"Skipped invalid rows: {skipped_invalid}. "
            f"Skipped duplicate rows: {skipped_duplicates}."
        )

    finally:
        db.close()


if __name__ == "__main__":
    run()