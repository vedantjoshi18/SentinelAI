"""
SentinelAI — Attack Classifier Training Pipeline
Trains a TF-IDF + Logistic Regression classifier for HTTP request payload attacks.
Saves model and vectorizer artifacts to ai-service/app/models/attack_classifier/.
"""

import os
import time
import json
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = BASE_DIR / "ml" / "datasets" / "processed"
MODEL_DIR = BASE_DIR / "ai-service" / "app" / "models" / "attack_classifier"
EVAL_DIR = BASE_DIR / "ml" / "evaluation" / "results"

TRAIN_DATA_PATH = PROCESSED_DIR / "payload_train_processed.csv"
TEST_DATA_PATH = PROCESSED_DIR / "payload_test_processed.csv"


def train_and_export():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    EVAL_DIR.mkdir(parents=True, exist_ok=True)

    print("=== SentinelAI Attack Classifier Training ===")
    print(f"Loading training data from {TRAIN_DATA_PATH}...")
    train_df = pd.read_csv(TRAIN_DATA_PATH)
    test_df = pd.read_csv(TEST_DATA_PATH)

    X_train = train_df["payload"].astype(str)
    y_train = train_df["label"]
    X_test = test_df["payload"].astype(str)
    y_test = test_df["label"]

    print(f"Train instances: {len(X_train)} | Test instances: {len(X_test)}")
    print("Class distribution in training set:")
    for cls, count in y_train.value_counts().items():
        print(f"  - {cls:<20}: {count} ({count/len(y_train)*100:.2f}%)")

    # 1. Feature Extraction: Sub-word character n-gram TF-IDF
    print("\nExtracting TF-IDF character n-gram features (range=(2, 5), max_features=15000)...")
    t0 = time.time()
    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 5),
        max_features=15000,
        sublinear_tf=True,
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    vec_time = time.time() - t0
    print(f"Vectorization completed in {vec_time:.2f}s. Vocabulary size: {len(vectorizer.vocabulary_)}")

    # 2. Classifier: Balanced Logistic Regression
    print("\nTraining Logistic Regression with balanced class weights...")
    t0 = time.time()
    model = LogisticRegression(
        C=5.0,
        max_iter=1000,
        class_weight="balanced",
        random_state=42,
        solver="lbfgs",
    )
    model.fit(X_train_vec, y_train)
    train_time = time.time() - t0
    print(f"Model trained in {train_time:.2f}s.")

    # 3. Model Evaluation
    print("\nEvaluating model on independent test partition (10,355 records)...")
    y_pred = model.predict(X_test_vec)
    y_proba = model.predict_proba(X_test_vec)

    acc = accuracy_score(y_test, y_pred)
    prec_macro = precision_score(y_test, y_pred, average="macro")
    rec_macro = recall_score(y_test, y_pred, average="macro")
    f1_macro = f1_score(y_test, y_pred, average="macro")
    f1_weighted = f1_score(y_test, y_pred, average="weighted")

    classes = list(model.classes_)
    cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()
    report_dict = classification_report(y_test, y_pred, output_dict=True, digits=4)
    report_text = classification_report(y_test, y_pred, digits=4)

    print(f"\nOverall Accuracy:    {acc * 100:.2f}%")
    print(f"Macro Precision:     {prec_macro * 100:.2f}%")
    print(f"Macro Recall:        {rec_macro * 100:.2f}%")
    print(f"Macro F1-Score:      {f1_macro * 100:.2f}%")
    print(f"Weighted F1-Score:   {f1_weighted * 100:.2f}%")
    print("\nDetailed Per-Class Classification Report:\n")
    print(report_text)
    print("\nConfusion Matrix (Rows=True, Cols=Predicted):")
    print(f"Labels: {classes}")
    for i, row in enumerate(cm):
        print(f"  {classes[i]:<20}: {row}")

    # 4. Save Model Artifacts
    model_file = MODEL_DIR / "model.joblib"
    vec_file = MODEL_DIR / "vectorizer.joblib"
    joblib.dump(model, model_file)
    joblib.dump(vectorizer, vec_file)
    print(f"\nModel artifact saved:      {model_file}")
    print(f"Vectorizer artifact saved: {vec_file}")

    # 5. Save Evaluation Metrics JSON
    results = {
        "model_type": "LogisticRegression",
        "vectorizer": "TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 5))",
        "hyperparameters": {
            "C": 5.0,
            "max_iter": 1000,
            "class_weight": "balanced",
            "random_state": 42,
            "solver": "lbfgs",
        },
        "overall_metrics": {
            "accuracy": round(acc, 6),
            "macro_precision": round(prec_macro, 6),
            "macro_recall": round(rec_macro, 6),
            "macro_f1": round(f1_macro, 6),
            "weighted_f1": round(f1_weighted, 6),
        },
        "classes": classes,
        "confusion_matrix": cm,
        "per_class_metrics": {
            cls: {
                "precision": round(report_dict[cls]["precision"], 6),
                "recall": round(report_dict[cls]["recall"], 6),
                "f1_score": round(report_dict[cls]["f1-score"], 6),
                "support": report_dict[cls]["support"],
            }
            for cls in classes
        },
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    eval_file = EVAL_DIR / "classifier_evaluation.json"
    with open(eval_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Evaluation metrics saved:  {eval_file}")

    return results


if __name__ == "__main__":
    train_and_export()