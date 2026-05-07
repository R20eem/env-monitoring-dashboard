"""
File: train_brassica.py

Purpose:
Trains the MobileNetV2 CNN model used by the scanner feature to
classify brassica crop images into healthy, pest risk, or disease
risk categories.

Responsibilities:
- Load the brassica image dataset from ml_data/brassica and split
  it into training and validation sets
- Apply data augmentation to improve model generalisation on
  limited training data
- Build a transfer learning model using MobileNetV2 pretrained on
  ImageNet as the base, with a custom classification head
- Train the classification head first with the base model frozen,
  then fine-tune the last 15 layers at a lower learning rate
- Use early stopping, model checkpointing, and learning rate
  reduction callbacks to avoid overfitting and save the best model
- Save the trained model to ml_models/brassica_cnn.keras

Layer:
Backend (Machine Learning / Model Training)

Related:
- scanner_router.py (loads and uses the trained model at prediction time)
- train_scan_models.py (trains Random Forest for maize and orchard)
- ml_models/brassica_cnn.keras (the output model file)
- ml_data/brassica (the image dataset used for training)
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers


# Config
DATA_DIR = "ml_data/brassica"
MODEL_DIR = "ml_models"
MODEL_PATH = os.path.join(MODEL_DIR, "brassica_cnn.keras")

IMG_SIZE = (224, 224)
BATCH_SIZE = 16
SEED = 42

EPOCHS_HEAD = 12
EPOCHS_FINE = 4

os.makedirs(MODEL_DIR, exist_ok=True)

CLASS_NAMES = ["disease_risk", "healthy", "pest_risk"]


def main():
      # Load dataset
    train_ds = keras.utils.image_dataset_from_directory(
        DATA_DIR,
        validation_split=0.2,
        subset="training",
        seed=SEED,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="categorical",
        class_names=CLASS_NAMES,
    )

    val_ds = keras.utils.image_dataset_from_directory(
        DATA_DIR,
        validation_split=0.2,
        subset="validation",
        seed=SEED,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="categorical",
        class_names=CLASS_NAMES,
    )

    print("Class names:", train_ds.class_names)

    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

    # Data augmentation 
    data_augmentation = keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.1),
        layers.RandomZoom(0.15),
        layers.RandomContrast(0.15),
        layers.RandomTranslation(0.05, 0.05),
    ])


    # Base model: MobileNetV2
    base_model = keras.applications.MobileNetV2(
        input_shape=IMG_SIZE + (3,),
        include_top=False,
        weights="imagenet"
    )
    base_model.trainable = False

    inputs = keras.Input(shape=IMG_SIZE + (3,))
    x = data_augmentation(inputs)
    x = keras.applications.mobilenet_v2.preprocess_input(x)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(3, activation="softmax")(x)

    model = keras.Model(inputs, outputs)

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )


    # Callbacks 
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=4,
            restore_best_weights=True
        ),
        keras.callbacks.ModelCheckpoint(
            MODEL_PATH,
            monitor="val_loss",
            save_best_only=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=2,
            min_lr=1e-6,
            verbose=1
        )
    ]


    # Train classifier head
    print("\nTraining classifier head...")
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_HEAD,
        callbacks=callbacks
    )


    # fine tuning
    base_model.trainable = True

    # only unfreeze last 15 layers
    for layer in base_model.layers[:-15]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    print("\nFine-tuning MobileNetV2...")
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_FINE,
        callbacks=callbacks
    )

    # Final evaluation
    loss, acc = model.evaluate(val_ds, verbose=0)
    print(f"\nFinal validation accuracy: {acc:.3f}")

    print(f"Best model saved to: {MODEL_PATH}")


if __name__ == "__main__":
    main()