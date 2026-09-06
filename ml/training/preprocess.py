"""
SentinelAI Preprocessing Pipeline
Normalizes raw HTTP attack payload datasets into clean, canonical format.
"""

import os
import pandas as pd
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "datasets" / "raw" / "http_params"
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"

# Canonical Class Mapping
LABEL_MAPPING = {
    "norm": "NORMAL",
    "sqli": "SQL_INJECTION",
    "xss": "XSS",
    "path-traversal": "PATH_TRAVERSAL",
    "cmdi": "COMMAND_INJECTION",
}

CANONICAL_CLASSES = [
    "NORMAL",
    "SQL_INJECTION",
    "XSS",
    "COMMAND_INJECTION",
    "PATH_TRAVERSAL",
]


def clean_payload_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Cleans and standardizes raw payload dataframe."""
    df = df.copy()

    # Drop nulls if present
    df = df.dropna(subset=["payload", "attack_type"])

    # Ensure payload is string
    df["payload"] = df["payload"].astype(str)

    # Map attack_type to canonical labels
    df["label"] = df["attack_type"].map(LABEL_MAPPING)

    # Drop unmapped or invalid rows
    df = df.dropna(subset=["label"])

    # Recalculate length for consistency
    df["length"] = df["payload"].apply(len)

    return df[["payload", "length", "label"]]


def process_and_save_datasets():
    """Reads raw CSVs, processes them, and saves to processed directory."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    train_path = RAW_DIR / "payload_train.csv"
    test_path = RAW_DIR / "payload_test.csv"

    if not train_path.exists() or not test_path.exists():
        raise FileNotFoundError(f"Raw datasets not found in {RAW_DIR}")

    train_raw = pd.read_csv(train_path)
    test_raw = pd.read_csv(test_path)

    train_clean = clean_payload_dataframe(train_raw)
    test_clean = clean_payload_dataframe(test_raw)

    combined_clean = pd.concat([train_clean, test_clean], ignore_index=True)

    train_out = PROCESSED_DIR / "payload_train_processed.csv"
    test_out = PROCESSED_DIR / "payload_test_processed.csv"
    combined_out = PROCESSED_DIR / "payload_all_processed.csv"

    train_clean.to_csv(train_out, index=False)
    test_clean.to_csv(test_out, index=False)
    combined_clean.to_csv(combined_out, index=False)

    print(f"Processed datasets saved to {PROCESSED_DIR}:")
    print(f"  Train: {len(train_clean)} rows -> {train_out.name}")
    print(f"  Test:  {len(test_clean)} rows -> {test_out.name}")
    print(f"  Total: {len(combined_clean)} rows -> {combined_out.name}")
    print("\nClass distribution in processed total:")
    print(combined_clean["label"].value_counts())

    return train_clean, test_clean, combined_clean


if __name__ == "__main__":
    process_and_save_datasets()