# SentinelAI Machine Learning Methodology & Attack Classifier Report

**Unit**: Application Security and Intrusion Detection  
**Phase**: Phase 3 — Application Attack Classifier  
**Model Type**: Multi-Class Supervised Natural Language Payload Classifier  
**Primary Artifacts**:
- `ai-service/app/models/attack_classifier/model.joblib` (601 KB)
- `ai-service/app/models/attack_classifier/vectorizer.joblib` (505 KB)
- `ml/evaluation/results/classifier_evaluation.json`

---

## 1. Pipeline Architecture

```
HTTP Request Payload (Raw String)
               │
               ▼
Preprocessing & Normalization (canonical mapping, stripping)
               │
               ▼
Sub-Word Character TF-IDF Vectorization (char_wb, ngrams 2-5, max 15,000 features)
               │
               ▼
Balanced Multi-Class Logistic Regression (L2 regularization, C=5.0)
               │
               ▼
Class Probabilities (Softmax calibrated confidence 0.0 – 1.0)
               │
               ▼
Target Threat Classification (NORMAL, SQL_INJECTION, XSS, COMMAND_INJECTION, PATH_TRAVERSAL)
```

---

## 2. Feature Extraction Justification

Web attack payloads (SQLi, XSS, Path Traversal, Command Injection) violate standard linguistic syntax:
- They rarely follow natural English token boundaries.
- They embed syntactic operators (e.g., `' OR '1'='1`, `../..//`, `<script>`, `| cat`, `--`).
- Attackers frequently utilize casing, whitespace evasion, and delimiter trickery.

To address this, SentinelAI uses **Sub-Word Character n-grams within word boundaries** (`analyzer="char_wb"`, `ngram_range=(2, 5)`):
1. Captures sub-word patterns (`<sc`, `crip`, `ipt>`, `' OR`, `OR '`, `../`, `..\\`).
2. Robust against whitespace evasion and symbol manipulation.
3. Scales to a fixed, compact vocabulary (`max_features=15000`) with sublinear term frequency scaling (`sublinear_tf=True`) to dampen repetitive tokens.

---

## 3. Empirical Model Selection: Logistic Regression vs Random Forest

Both estimators were trained on identical stratified partitions (Train: 20,712 records, Test: 10,355 records):

| Metric | Balanced Logistic Regression (C=5.0) | Balanced Random Forest (n=100) | Winning Choice |
|---|---|---|---|
| **Overall Accuracy** | **99.86%** | 97.72% | **Logistic Regression** |
| **Macro F1-Score** | **97.17%** | 83.30% | **Logistic Regression** (+13.87%) |
| **Weighted F1-Score** | **99.86%** | 98.58% | **Logistic Regression** |
| **Command Injection Precision** | **84.38%** | 11.20% | **Logistic Regression** (RF has huge FP rate) |
| **Model Disk Size** | **~600 KB** | ~48 MB | **Logistic Regression** (80x smaller) |
| **Inference Latency** | **< 1.0 ms** | ~15 ms | **Logistic Regression** (15x faster) |
| **Probability Calibration** | Well-calibrated (Softmax) | Heuristic tree voting | **Logistic Regression** |

### Viva Defense Talking Point:
> "Tree-based models (Random Forest) struggle in very high-dimensional sparse linear spaces (15,000 TF-IDF features). Random splits frequently overfit to rare character combinations, resulting in severe false positives (e.g., 11.2% precision on Command Injection). Logistic Regression finds a smooth hyper-plane that cleanly separates syntactic injection markers while remaining lightweight, fast, and mathematically interpretable."

---

## 4. Actual Measured Evaluation Metrics

### Independent Test Partition (10,355 records)

| Attack Class | Precision | Recall | F1-Score | Support (Actual Test Samples) |
|---|---|---|---|---|
| **COMMAND_INJECTION** | 0.8438 | 0.9000 | **0.8710** | 30 |
| **NORMAL** | 0.9986 | 0.9992 | **0.9989** | 6,434 |
| **PATH_TRAVERSAL** | 1.0000 | 0.9897 | **0.9948** | 97 |
| **SQL_INJECTION** | 0.9997 | 0.9989 | **0.9993** | 3,617 |
| **XSS** | 1.0000 | 0.9887 | **0.9943** | 177 |
| **Overall Accuracy** | | | **99.86%** | 10,355 |
| **Macro Average** | 0.9684 | 0.9753 | **0.9717** | 10,355 |
| **Weighted Average** | 0.9986 | 0.9986 | **0.9986** | 10,355 |

---

## 5. Confusion Matrix

```
Labels: ['COMMAND_INJECTION', 'NORMAL', 'PATH_TRAVERSAL', 'SQL_INJECTION', 'XSS']

                       Pred_CMDI  Pred_NORM  Pred_TRAV  Pred_SQLI  Pred_XSS
True_COMMAND_INJECTION        27          3          0          0         0
True_NORMAL                    4       6429          0          1         0
True_PATH_TRAVERSAL            1          0         96          0         0
True_SQL_INJECTION             0          4          0       3613         0
True_XSS                       0          2          0          0       175
```
- Total test records: 10,355
- Correctly classified: **10,340** (99.86%)
- Total misclassifications: **15** (0.14%)

---

## 6. Live Inference Verification

| Test Input Payload | True Class | Model Prediction | Model Confidence | Result |
|---|---|---|---|---|
| `laptop accessories with usb-c cable` | `NORMAL` | `NORMAL` | 0.9819 | **PASS** |
| `Software developer living in New York` | `NORMAL` | `NORMAL` | 0.9892 | **PASS** |
| `1' OR '1'='1` | `SQL_INJECTION` | `SQL_INJECTION` | 0.9991 | **PASS** |
| `1' order by 1--` | `SQL_INJECTION` | `SQL_INJECTION` | 0.9867 | **PASS** |
| `-5622" where 7970=7970 union all select 1,2--` | `SQL_INJECTION` | `SQL_INJECTION` | 0.9997 | **PASS** |
| `<script>alert('XSS')</script>` | `XSS` | `XSS` | 0.9996 | **PASS** |
| `<img src=x onerror=alert(1)>` | `XSS` | `XSS` | 0.9990 | **PASS** |
| `/../../../../../../../../../../../../etc/passwd` | `PATH_TRAVERSAL` | `PATH_TRAVERSAL` | 0.9950 | **PASS** |
| `....//....//....//etc/passwd` | `PATH_TRAVERSAL` | `PATH_TRAVERSAL` | 0.9927 | **PASS** |
| `file:/etc/passwd` | `PATH_TRAVERSAL` | `PATH_TRAVERSAL` | 0.9451 | **PASS** |
| `+|+dir+c:/` | `COMMAND_INJECTION` | `COMMAND_INJECTION` | 0.9968 | **PASS** |
| `&&dir c:/` | `COMMAND_INJECTION` | `COMMAND_INJECTION` | 0.9918 | **PASS** |
| `| cat /etc/passwd` | `COMMAND_INJECTION` | `COMMAND_INJECTION` | 0.9961 | **PASS** |