"""
File: train_scan_models.py

Purpose:
Trains Random Forest models for maize and orchard crop classification,
used by the scanner feature to predict healthy, pest risk, or disease
risk from uploaded farmer images.

Responsibilities:
- Load crop images from the ml_data directory for each crop type
  and extract hand-crafted features from each image including mean
  RGB values, standard deviation, and 16-bin colour histograms
- Skip any images that cannot be opened or are not valid image files
- Split the dataset into training and test sets using an 80/20 split
  with stratification to maintain class balance
- Train a Random Forest classifier with 200 trees for each crop type
  and print the accuracy and classification report after training
- Save each trained model as a .pkl file in the ml_models directory
  for use by the scanner router at prediction time
- Skip training for any crop that does not have enough images to
  train reliably

Layer:
Backend (Machine Learning / Model Training)

Related:
- scanner_router.py (loads the saved .pkl models and uses them to
  run predictions on uploaded farmer images)
- train_brassica.py (trains the CNN model used for brassica crops
  instead of Random Forest)
- ml_models (directory where the trained .pkl files are saved)
- ml_data (directory containing the crop image dataset)
- System Design page (documents the decision to use Random Forest
  for maize and orchard crops due to speed and low resource use)
"""

import os
import joblib
import numpy as np
from PIL import Image
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score


DATA_DIR = "ml_data"
MODEL_DIR = "ml_models"

CROPS = ["maize", "brassica", "orchard"]
LABELS = ["healthy", "pest_risk", "disease_risk"]

os.makedirs(MODEL_DIR, exist_ok=True)


def extract_features(image_path: str) -> np.ndarray:
    """
    Extract simple image features:
    - mean RGB
    - std RGB
    - 16-bin histogram for each RGB channel
    """
    img = Image.open(image_path).convert("RGB")
    img = img.resize((128, 128))
    arr = np.array(img)

    mean_rgb = arr.mean(axis=(0, 1))
    std_rgb = arr.std(axis=(0, 1))

    hist_r, _ = np.histogram(arr[:, :, 0], bins=16, range=(0, 256), density=True)
    hist_g, _ = np.histogram(arr[:, :, 1], bins=16, range=(0, 256), density=True)
    hist_b, _ = np.histogram(arr[:, :, 2], bins=16, range=(0, 256), density=True)

    features = np.concatenate([mean_rgb, std_rgb, hist_r, hist_g, hist_b])
    return features

# load all images for crop type and extract features + labels
def load_crop_dataset(crop: str):
    X, y = [], []
    crop_dir = os.path.join(DATA_DIR, crop)

    for label in LABELS:
        label_dir = os.path.join(crop_dir, label)
        if not os.path.exists(label_dir):
            print(f"Missing folder: {label_dir}")
            continue

        for filename in os.listdir(label_dir):
            if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
                continue

            image_path = os.path.join(label_dir, filename)
        # skip corrupted or unreadable image
            try:
                features = extract_features(image_path)
                X.append(features)
                y.append(label)
            except Exception as e:
                print(f"Skipping {image_path}: {e}")

    return np.array(X), np.array(y)


def train_crop_model(crop: str):
    print(f"\n=== Training model for {crop} ===")
    X, y = load_crop_dataset(crop)
# skip if not enough data to train reliably
    if len(X) < 15:
        print(f"Not enough images for {crop}")
        return

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )
    # 200 trees with max depth 14, is it balanced between accuracy and speed ? depnds on the result ]
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=14,
        random_state=42
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    # save model as .pkl for use by scanner_router at prediction time
    print(f"Accuracy for {crop}: {accuracy_score(y_test, y_pred):.3f}")
    print(classification_report(y_test, y_pred))

    model_path = os.path.join(MODEL_DIR, f"{crop}_model.pkl")
    joblib.dump(model, model_path)
    print(f"Saved model: {model_path}")


def main():
    for crop in CROPS:
        train_crop_model(crop)


if __name__ == "__main__":
    main()