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

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=14,
        random_state=42
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

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