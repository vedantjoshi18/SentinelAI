# SentinelAI Dataset Specification & Statistical Inspection Report

**Unit**: Application Security and Intrusion Detection  
**Phase**: Phase 2 — Dataset Inspection & Verification  
**Status**: Verified & Reproducible  

---

## 1. Dataset Provenance & Attribution

### Primary Dataset: HttpParamsDataset
- **Source**: Curated HTTP Parameter Security Benchmark for Web Application Firewall (WAF) and Payload Classification Research.
- **Location in Repository**: [`ml/datasets/raw/http_params/`](file:///D:/Projects/SentinelAI/ml/datasets/raw/http_params/)
- **Processed Location**: [`ml/datasets/processed/`](file:///D:/Projects/SentinelAI/ml/datasets/processed/)
- **License / Terms**: Open academic research dataset for machine learning application security.
- **Domain**: Web Application Security (Layer 7 HTTP Request Payload Inspection).

### Secondary Dataset: CIC-IDS2017 (Network Flow Telemetry)
- **Source**: Canadian Institute for Cybersecurity (University of New Brunswick).
- **Location in Repository**: [`ml/datasets/raw/cic_ids2017/MachineLearningCVE/`](file:///D:/Projects/SentinelAI/ml/datasets/raw/cic_ids2017/MachineLearningCVE/)
- **License / Terms**: UNB academic research license.
- **Domain**: Network-layer flow telemetry (79 statistical flow features such as Flow Duration, Packet Lengths, Inter-Arrival Times).

> **Architectural Viva Defense Principle**:
> Application attack detection (HTTP payload classifier) inspects raw malicious text strings submitted in HTTP queries or bodies (e.g., `' OR 1=1--`, `<script>alert(1)</script>`). In contrast, CIC-IDS2017 captures aggregated transport and network layer flow statistics (packet rates, flag counts). SentinelAI treats these as separate security layers and never claims network flow datasets contain raw payload strings.

---

## 2. Primary Dataset Statistical Profile

### Overview & Dimensions
- **Total Combined Records**: 31,067 instances
- **Raw Training Set**: 20,712 instances (66.67%) across 4 columns (`payload`, `length`, `attack_type`, `label`)
- **Raw Testing Set**: 10,355 instances (33.33%) across 4 columns (`payload`, `length`, `attack_type`, `label`)
- **Missing Values**: 0 nulls detected across both training and testing partitions.
- **Duplicate Payloads**: 0 duplicates within training or testing sets.
- **Data Leakage Audit**: 0 payload intersections between training and testing sets (verified disjoint).

---

## 3. Class Distribution & Imbalance Audit

| Canonical Class | Raw Label | Training Count | Training % | Testing Count | Testing % | Total Count | Total % |
|---|---|---|---|---|---|---|---|
| `NORMAL` | `norm` | 12,870 | 62.14% | 6,434 | 62.13% | **19,304** | **62.14%** |
| `SQL_INJECTION` | `sqli` | 7,235 | 34.93% | 3,617 | 34.93% | **10,852** | **34.93%** |
| `XSS` | `xss` | 355 | 1.71% | 177 | 1.71% | **532** | **1.71%** |
| `PATH_TRAVERSAL` | `path-traversal` | 193 | 0.93% | 97 | 0.94% | **290** | **0.93%** |
| `COMMAND_INJECTION` | `cmdi` | 59 | 0.28% | 30 | 0.29% | **89** | **0.29%** |
| **Total** | | **20,712** | **100.0%** | **10,355** | **100.0%** | **31,067** | **100.0%** |

---

## 4. Qualitative Payload Samples

### 1. `NORMAL`
- `'c/ caridad s/n'` (Length: 14)
- `'campello, el'` (Length: 12)
- Characteristics: Standard alphanumeric names, query parameters, addresses, IDs.

### 2. `SQL_INJECTION`
- `"1' where 6406=6406;select count(*) from rdb$fields as t1,rdb$types as t2..."` (Length: 115)
- Characteristics: Quotes, SQL keywords (`SELECT`, `UNION`, `WHERE`, `AND`), database metadata queries, tautologies (`1=1`).

### 3. `XSS`
- `'<svg><script>alert(/1/)</script>'` (Length: 32)
- `'confirm(2)>/'` (Length: 12)
- Characteristics: HTML tags, script execution hooks (`<svg>`, `onload`, `alert()`, event handlers).

### 4. `PATH_TRAVERSAL`
- `'/../../../../../../../../../../../../etc/passwd'` (Length: 47)
- `'file:/etc/passwd'` (Length: 16)
- Characteristics: Directory escape patterns (`../`, `..\\`), system file targets (`/etc/passwd`, `win.ini`).

### 5. `COMMAND_INJECTION`
- `'+dir+c:",8,cmdi,anom $&&dir+c:"'` (Length: 31)
- Characteristics: Shell command chaining (`|`, `&&`, `;`), OS commands (`dir`, `cat`, `whoami`).

---

## 5. Preprocessing Decisions for Phase 3 Model Training
1. **Canonical Label Mapping**: Maps raw shorthand labels to uppercase enum strings (`NORMAL`, `SQL_INJECTION`, `XSS`, `COMMAND_INJECTION`, `PATH_TRAVERSAL`).
2. **Text Representation**: TF-IDF vectorization with sub-word character n-grams (`ngram_range=(1, 3)` or `(2, 5)`) to capture attack tokens regardless of obfuscation.
3. **Class Imbalance Mitigation**: Use `class_weight='balanced'` in estimators to ensure minority attack classes (`cmdi` at 0.29%, `path-traversal` at 0.93%) achieve high recall without being drowned out by benign traffic.
4. **Reproducibility**: Script [`ml/training/preprocess.py`](file:///D:/Projects/SentinelAI/ml/training/preprocess.py) generates standardized CSV files in [`ml/datasets/processed/`](file:///D:/Projects/SentinelAI/ml/datasets/processed/).