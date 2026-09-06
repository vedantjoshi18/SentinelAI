"""
SentinelAI — Attack Classifier Evaluation Pipeline
Loads serialized model and vectorizer artifacts, benchmarks performance on test data,
and validates inference on representative attack vectors.
"""

import sys
import json
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "ai-service" / "app" / "models" / "attack_classifier" / "model.joblib"
VEC_PATH = BASE_DIR / "ai-service" / "app" / "models" / "attack_classifier" / "vectorizer.joblib"
TEST_DATA_PATH = BASE_DIR / "ml" / "datasets" / "processed" / "payload_test_processed.csv"


def evaluate():
    print("=== SentinelAI Attack Classifier Evaluation ===")

    # 1. Verify and load artifacts
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    if not VEC_PATH.exists():
        raise FileNotFoundError(f"Vectorizer file not found: {VEC_PATH}")

    print(f"Loading vectorizer from: {VEC_PATH}")
    vectorizer = joblib.load(VEC_PATH)
    print(f"Loading model from:      {MODEL_PATH}")
    model = joblib.load(MODEL_PATH)

    # 2. Benchmark on test partition
    print(f"\nLoading test partition from: {TEST_DATA_PATH}")
    test_df = pd.read_csv(TEST_DATA_PATH)
    X_test = test_df["payload"].astype(str)
    y_test = test_df["label"]

    X_test_vec = vectorizer.transform(X_test)
    y_pred = model.predict(X_test_vec)

    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    weighted_f1 = f1_score(y_test, y_pred, average="weighted")

    print("\n================== Performance Metrics ==================")
    print(f"Test Instances:     {len(X_test)}")
    print(f"Accuracy:           {acc * 100:.2f}%")
    print(f"Macro F1-Score:     {macro_f1 * 100:.2f}%")
    print(f"Weighted F1-Score:  {weighted_f1 * 100:.2f}%")

    print("\nPer-Class Breakdown:")
    print(classification_report(y_test, y_pred, digits=4))

    print("Confusion Matrix:")
    classes = list(model.classes_)
    cm = confusion_matrix(y_test, y_pred, labels=classes)
    print(f"Labels: {classes}")
    for i, row in enumerate(cm):
        print(f"  {classes[i]:<20}: {list(row)}")

    # 3. Live representative payload verification
    print("\n================ Representative Live Payloads ================")
    benchmark_payloads = [
        ("Normal Search Query", "laptop accessories with usb-c cable", "NORMAL"),
        ("Normal User Bio", "Software developer living in New York", "NORMAL"),
        ("SQLi Tautology", "1' OR '1'='1", "SQL_INJECTION"),
        ("SQLi Comment Bypass", "1' order by 1--", "SQL_INJECTION"),
        ("SQLi UNION", "-5622\" where 7970=7970 union all select 1,2--", "SQL_INJECTION"),
        ("XSS Script Tag", "<script>alert('XSS')</script>", "XSS"),
        ("XSS Event Handler", "<img src=x onerror=alert(1)>", "XSS"),
        ("Path Traversal Long", "/../../../../../../../../../../../../etc/passwd", "PATH_TRAVERSAL"),
        ("Path Traversal Short", "....//....//....//etc/passwd", "PATH_TRAVERSAL"),
        ("Path Traversal File", "file:/etc/passwd", "PATH_TRAVERSAL"),
        ("Command Chaining Plus", "+|+dir+c:/", "COMMAND_INJECTION"),
        ("Command Chaining AND", "&&dir c:/", "COMMAND_INJECTION"),
        ("Command Chaining Pipe", "| cat /etc/passwd", "COMMAND_INJECTION"),
    ]

    all_verified = True
    for desc, payload, expected in benchmark_payloads:
        vec_input = vectorizer.transform([payload])
        pred = model.predict(vec_input)[0]
        probs = model.predict_proba(vec_input)[0]
        conf = max(probs)
        is_match = (pred == expected)
        status_str = "PASS" if is_match else "FAIL"
        if not is_match:
            all_verified = False
        print(f"[{status_str}] {desc:<26} -> Predicted: {pred:<18} (Conf: {conf:.4f} | Expected: {expected})")

    # 4. Acceptance check
    if acc >= 0.95 and macro_f1 >= 0.90 and all_verified:
        print("\nAll evaluation acceptance criteria PASSED.")
        return 0
    else:
        print("\nEvaluation failed quality thresholds.")
        return 1


if __name__ == "__main__":
    code = evaluate()
    sys.exit(code)