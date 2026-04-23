from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi import Header
from sqlalchemy.orm import Session
from datetime import datetime
import os
import joblib
import numpy as np
import tensorflow as tf
from PIL import Image
from jose import JWTError

from app.database import get_db
from app.models.scan_result import ScanResult
from app.core.security import decode_access_token
from app.repositories.farmer_repository import get_farmer_by_email

router = APIRouter(prefix="/api/scanner", tags=["scanner"])

UPLOAD_DIR = "uploads"
MODEL_DIR = "ml_models"
ALLOWED_CROPS = {"maize", "brassica", "orchard"}

BRASSICA_CNN_PATH = os.path.join(MODEL_DIR, "brassica_cnn.keras")
# classes 
BRASSICA_CLASS_NAMES = ["disease_risk", "healthy", "pest_risk"]


os.makedirs(UPLOAD_DIR, exist_ok=True)



# auth helper --> get logged-in farmer
def get_current_farmer(
    db: Session = Depends(get_db),
    authorization: str = Header(None),
):
    print("AUTH HEADER:", authorization)

    if not authorization:
        raise HTTPException(status_code=401, detail="not authenticated")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="invalid auth header")

    token = authorization.replace("Bearer ", "").strip()
    print("TOKEN:", token)

    try:
        email, role = decode_access_token(token)
        print("DECODED:", email, role)
    except Exception as e:
        print("DECODE ERROR:", e)
        raise HTTPException(status_code=401, detail="invalid or expired token")

    if role != "farmer":
        print("WRONG ROLE:", role)
        raise HTTPException(status_code=403, detail="only farmers allowed")

    farmer = get_farmer_by_email(db, email)
    print("FARMER:", farmer)

    if not farmer:
        raise HTTPException(status_code=401, detail="farmer not found")

    return farmer



# feature extraction RF
def extract_rf_features(image_path: str) -> np.ndarray:
    img = Image.open(image_path).convert("RGB")
    img = img.resize((128, 128))
    arr = np.array(img)

    mean_rgb = arr.mean(axis=(0, 1))
    std_rgb = arr.std(axis=(0, 1))

    hist_r, _ = np.histogram(arr[:, :, 0], bins=16, range=(0, 256), density=True)
    hist_g, _ = np.histogram(arr[:, :, 1], bins=16, range=(0, 256), density=True)
    hist_b, _ = np.histogram(arr[:, :, 2], bins=16, range=(0, 256), density=True)

    features = np.concatenate([mean_rgb, std_rgb, hist_r, hist_g, hist_b])
    return features.reshape(1, -1)


# random forest prediction for maize and orchard, RF is one of the simplest ML models so it should not take a lot 
# proccessing and computation, and it would work in unstable connection which's greet for  faremrs
def predict_with_rf(crop_type: str, image_path: str):
    model_path = os.path.join(MODEL_DIR, f"{crop_type}_model.pkl")

    if not os.path.exists(model_path):
        raise HTTPException(status_code=500, detail=f"model not found for {crop_type}")

    model = joblib.load(model_path)
    features = extract_rf_features(image_path)

    prediction = model.predict(features)[0]

    if hasattr(model, "predict_proba"):
        confidence = float(np.max(model.predict_proba(features)))
    else:
        confidence = 0.75

    reason_map = {
        "healthy": "model matched healthy patterns",
        "pest_risk": "model matched pest damage patterns",
        "disease_risk": "model matched disease patterns",
    }

    return prediction, round(confidence, 2), reason_map.get(prediction, "prediction done")



# brassica cnn prediction, had some issues with classification so i choose a stronger model, CNN is very
# good at identifying spots (pest) and damege (disease)
def predict_with_brassica_cnn(image_path: str):
    if not os.path.exists(BRASSICA_CNN_PATH):
        raise HTTPException(status_code=500, detail="brassica model not found")

    model = tf.keras.models.load_model(BRASSICA_CNN_PATH)

    img = Image.open(image_path).convert("RGB")
    img = img.resize((224, 224))
    arr = np.array(img, dtype=np.float32)

    arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
    arr = np.expand_dims(arr, axis=0)

    probs = model.predict(arr, verbose=0)[0]
    idx = int(np.argmax(probs))

    prediction = BRASSICA_CLASS_NAMES[idx]
    confidence = float(np.max(probs))

    reason_map = {
        "healthy": "cnn detected healthy brassica",
        "pest_risk": "cnn detected pest damage",
        "disease_risk": "cnn detected disease patterns",
    }

    return prediction, round(confidence, 2), reason_map[prediction]



# hybrid model selector, maize & orchard --> RF, brassica --> CNN
def predict_crop_condition(crop_type: str, image_path: str):
    if crop_type == "brassica":
        return predict_with_brassica_cnn(image_path)

    return predict_with_rf(crop_type, image_path)


# upload endpoint
@router.post("/upload")
async def upload_scan(
    crop_type: str = Form(...),
    site_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_farmer = Depends(get_current_farmer),
):
    crop_type = crop_type.strip().lower()

    if crop_type not in ALLOWED_CROPS:
        raise HTTPException(status_code=400, detail="invalid crop_type")

    # save image
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # run prediction
    prediction, confidence, reason = predict_crop_condition(crop_type, file_path)

    # save to db
    scan = ScanResult(
        farmer_id=current_farmer.id,
        site_id=site_id,
        crop_type=crop_type,
        image_path=file_path,
        prediction=prediction,
        confidence=confidence,
        reason=reason,
        created_at=str(datetime.utcnow())
    )

    db.add(scan)
    db.commit()
    db.refresh(scan)

    return {
        "id": scan.id,
        "crop_type": crop_type,
        "site_id": site_id,
        "prediction": prediction,
        "confidence": confidence,
        "reason": reason,
        "image_path": file_path,
        "created_at": scan.created_at
    }



# recent scans -- > researcher view
@router.get("/recent")
def get_recent_scans(limit: int = 10, db: Session = Depends(get_db)):
    scans = (
        db.query(ScanResult)
        .order_by(ScanResult.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": s.id,
            "farmer_id": s.farmer_id,
            "site_id": s.site_id,
            "crop_type": s.crop_type,
            "image_path": s.image_path,
            "image_url": f"http://127.0.0.1:8000/{s.image_path}",
            "prediction": s.prediction,
            "confidence": s.confidence,
            "reason": s.reason,
            "created_at": s.created_at,
        }
        for s in scans
    ]

@router.get("/my-scans")
def get_my_scans(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_farmer = Depends(get_current_farmer),
):
    scans = (
        db.query(ScanResult)
        .filter(ScanResult.farmer_id == current_farmer.id)
        .order_by(ScanResult.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": s.id,
            "farmer_id": s.farmer_id,
            "site_id": s.site_id,
            "crop_type": s.crop_type,
            "image_path": s.image_path,
            "image_url": f"http://127.0.0.1:8000/{s.image_path}",
            "prediction": s.prediction,
            "confidence": s.confidence,
            "reason": s.reason,
            "created_at": s.created_at,
        }
        for s in scans
    ]


@router.get("/my-summary")
def get_my_summary(
    db: Session = Depends(get_db),
    current_farmer = Depends(get_current_farmer),
):
    scans = (
        db.query(ScanResult)
        .filter(ScanResult.farmer_id == current_farmer.id)
        .order_by(ScanResult.created_at.desc())
        .all()
    )

    total_scans = len(scans)
    healthy_count = sum(1 for s in scans if s.prediction == "healthy")
    disease_risk_count = sum(1 for s in scans if s.prediction == "disease_risk")
    pest_risk_count = sum(1 for s in scans if s.prediction == "pest_risk")

    latest_scan = scans[0] if scans else None

    return {
        "total_scans": total_scans,
        "healthy_count": healthy_count,
        "pest_risk_count": pest_risk_count,
        "disease_risk_count": disease_risk_count,
        "latest_scan": (
            {
                "id": latest_scan.id,
                "crop_type": latest_scan.crop_type,
                "site_id": latest_scan.site_id,
                "prediction": latest_scan.prediction,
                "confidence": latest_scan.confidence,
                "reason": latest_scan.reason,
                "image_url": f"http://127.0.0.1:8000/{latest_scan.image_path}",
                "created_at": latest_scan.created_at,
            }
            if latest_scan else None
        )
    }