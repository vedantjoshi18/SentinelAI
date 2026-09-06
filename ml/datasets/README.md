# SentinelAI Datasets

This directory stores raw and preprocessed datasets for application security and intrusion detection.

## Structure
- `raw/http_params/`: Raw HTTP parameter payload benchmark dataset (`payload_train.csv`, `payload_test.csv`).
- `raw/cic_ids2017/`: Canadian Institute for Cybersecurity network flow CSV captures.
- `raw/web_payloads/`: Reference application payload patterns.
- `processed/`: Canonical preprocessed CSV files ready for training:
  - `payload_train_processed.csv` (20,712 records)
  - `payload_test_processed.csv` (10,355 records)
  - `payload_all_processed.csv` (31,067 records)

## Target Classes
1. `NORMAL`
2. `SQL_INJECTION`
3. `XSS`
4. `COMMAND_INJECTION`
5. `PATH_TRAVERSAL`

Run preprocessing:
```bash
python ml/training/preprocess.py
```