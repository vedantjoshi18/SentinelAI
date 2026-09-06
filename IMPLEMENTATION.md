# SentinelAI — Implementation Roadmap & Execution Log

**Project**: SentinelAI (AI-Powered Application Security & Intrusion Detection Platform)  
**Subject**: Application Security and Intrusion Detection  
**Architecture**: Monorepo (`client/`, `server/`, `ai-service/`, `ml/`, `tests/`, `docs/`)  

---

## Phase Execution Checklist

| Phase | Description | Status | Pass/Fail | Notes |
|---|---|---|---|---|
| **Phase 0** | **Project Foundation & Monorepo Setup** | **COMPLETED** | **PASSED** | React (Vite) + Express + FastAPI initialized, health checks live, tests passing. |
| **Phase 1** | **Database + Authentication (MongoDB, JWT, bcrypt, RBAC)** | **COMPLETED** | **PASSED** | User model, roles (USER, ANALYST, ADMIN), bcrypt hashing, JWT, repeated-login lockout, RBAC. |
| **Phase 2** | **Dataset Inspection & Preparation** | **COMPLETED** | **PASSED** | Inspected 31,067 records across 5 classes, 0 nulls, 0 duplicates, 0 leakage, generated notebook & processed datasets. |
| **Phase 3** | **Application Attack Classifier Training** | **COMPLETED** | **PASSED** | Sub-word char TF-IDF + Balanced Logistic Regression, 99.86% accuracy, 97.17% Macro F1, artifacts serialized. |
| **Phase 4** | FastAPI AI Inference Service | Planned | Pending | `POST /predict` endpoint, Pydantic validation, model versioning. |
| **Phase 5** | Deterministic Security Rule Engine | Planned | Pending | Modular signature rules for SQLi, XSS, Path Traversal, Cmd Injection. |
| **Phase 6** | Dynamic Risk Engine | Planned | Pending | Multi-signal normalization to 0–100 risk score and policy mapping. |
| **Phase 7** | Security Middleware Integration | Planned | Pending | Intercept Express requests, call AI + Rules + Risk Engine, ALLOW/MONITOR/BLOCK. |
| **Phase 8** | Security Event Logging & Audit APIs | Planned | Pending | MongoDB SecurityEvent audit logging with pagination & filtering. |
| **Phase 9** | Behavioural Anomaly Detection | Planned | Pending | Isolation Forest on request frequencies, failed logins, error spikes. |
| **Phase 10** | Behaviour Integration | Planned | Pending | UserBehaviour tracking feeding anomaly scores to the Risk Engine. |
| **Phase 11** | React Security SOC Dashboard | Planned | Pending | Dark SOC theme, Recharts visualizations, live DB stats, manual analysis sandbox. |
| **Phase 12** | Admin & User Management | Planned | Pending | Server-side enforced RBAC controls and user administration. |
| **Phase 13** | Security Hardening & Defenses | Planned | Pending | Helmet, CORS, input sanitization, rate limits, secret hygiene. |
| **Phase 14** | Comprehensive Verification & Testing | Planned | Pending | Unit, integration, security, and ML model test suites. |
| **Phase 15** | Optional Network IDS | Optional | Pending | Flow-based intrusion detection with CIC-IDS2017 (separate from payload classifier). |
| **Phase 16** | Professionalization | Planned | Pending | Docker Compose, API swagger, structured logs, production readiness. |
| **Phase 17** | Complete Documentation | Planned | Pending | viva.md, architecture.md, api.md, ml-methodology.md, dataset.md. |
| **Phase 18** | Final End-to-End Live Demonstrations | Planned | Pending | 6 verifiable demonstration flows for viva presentation. |

---

## Phase 0: Project Foundation Details

### Objectives Met:
1. **Monorepo Structure**: Structured according to standard SOC specification (`client`, `server`, `ai-service`, `ml`, `tests`, `docs`).
2. **Backend**: Node.js/Express initialized with Helmet, CORS, JSON parsing, logging, and health endpoint `GET /api/health`.
3. **AI Service**: Python FastAPI initialized with Uvicorn, Pydantic, Scikit-learn, and health endpoint `GET /health`.
4. **Frontend Client**: React 18 with Vite and Tailwind CSS initialized, displaying live SOC health monitoring.
5. **Environment Configuration**: Template `.env.example` created.
6. **Git Hygiene**: Comprehensive `.gitignore` preventing secrets, node_modules, and cache files from being tracked.
7. **Verification**: Automated test runners (`node --test` for server, `pytest` for FastAPI, `vite build` for client) all passing cleanly.

---

## Phase 1: Database & Authentication Details

### Objectives Met:
1. **Mongoose Database Connection**: `server/src/config/db.js` providing resilient MongoDB connection management.
2. **User Model (`server/src/models/User.js`)**:
   - Fields: `_id`, `name`, `email`, `passwordHash` (select: false), `role` (`USER`, `ANALYST`, `ADMIN`), `status` (`active`, `suspended`, `locked`), `failedLoginAttempts`, `lockedUntil`, `createdAt`, `updatedAt`.
   - Methods: `comparePassword`, `isLocked`, `incrementFailedAttempts`, `resetLoginAttempts`.
   - Security: bcrypt password hashing (cost factor 10), `passwordHash` and `__v` stripped from all JSON/object serializations.
3. **Authentication Endpoints**:
   - `POST /api/auth/register`: Input validation (name length, normalized email, password complexity), duplicate email detection (409 Conflict), JWT issuance.
   - `POST /api/auth/login`: Account lockout check (423 Locked after 5 consecutive failures), bcrypt verification, failure attempt tracking, JWT issuance.
   - `GET /api/auth/me`: Bearer token validation, retrieves sanitized user profile.
4. **Role-Based Access Control (RBAC)**:
   - `authMiddleware.js`: Validates Bearer token format, verifies signature using environment variable `JWT_SECRET`, checks expiration, verifies account is active.
   - `roleMiddleware.js`: Enforces role-level permissions (`USER`, `ANALYST`, `ADMIN`) on protected endpoints with 403 Forbidden responses.
5. **Verification**: 17 comprehensive automated tests passing with zero failures.

---

## Phase 2: Dataset Inspection & Preparation Details

### Objectives Met:
1. **Raw Dataset Inspection**:
   - Primary: HttpParamsDataset under `ml/datasets/raw/http_params/` (`payload_train.csv` and `payload_test.csv`).
   - Total rows: 31,067 records (Train: 20,712 | Test: 10,355).
   - Columns: `payload`, `length`, `attack_type`, `label`.
2. **Quality & Leakage Audit**:
   - Missing values: 0 nulls across both partitions.
   - Duplicate records: 0 duplicate payloads.
   - Cross-partition data leakage: 0 intersecting payloads between train and test sets.
3. **Class Verification**:
   - Exact 5 target classes verified: `NORMAL` (62.14%), `SQL_INJECTION` (34.93%), `XSS` (1.71%), `PATH_TRAVERSAL` (0.93%), `COMMAND_INJECTION` (0.29%).
4. **Reproducible Pipeline**:
   - Script `ml/training/preprocess.py` creates standardized canonical CSVs in `ml/datasets/processed/`.
   - Jupyter Notebook `ml/notebooks/01_dataset_exploration.ipynb` documents statistical audits, charts, and viva talking points.
5. **Architectural Separation**:
   - Clearly documented separation between Layer 7 HTTP application payload detection and Layer 3/4 CIC-IDS2017 network flow statistics.

---

## Phase 3: Application Attack Classifier Details

### Objectives Met:
1. **Model Selection Benchmark**:
   - Evaluated Balanced Logistic Regression vs Balanced Random Forest on 10,355 test instances.
   - Logistic Regression proved far superior: 99.86% accuracy & 97.17% Macro F1 vs 97.72% accuracy & 83.30% Macro F1 for Random Forest.
   - Random Forest suffered from high false positives on Command Injection (11.2% precision vs 84.4% for Logistic Regression).
2. **Feature Extraction**:
   - Sub-word character n-grams (`analyzer="char_wb"`, `ngram_range=(2, 5)`, `max_features=15000`, `sublinear_tf=True`).
3. **Artifact Serialization**:
   - `ai-service/app/models/attack_classifier/model.joblib` (601 KB).
   - `ai-service/app/models/attack_classifier/vectorizer.joblib` (505 KB).
   - `ml/evaluation/results/classifier_evaluation.json`.
4. **Evaluation Metrics**:
   - Accuracy: **99.86%**
   - Macro Precision: **96.84%**
   - Macro Recall: **97.53%**
   - Macro F1-Score: **97.17%**
   - Weighted F1-Score: **99.86%**
5. **Live Verification**:
   - 13 representative test cases covering Normal, SQLi, XSS, Path Traversal, and Command Injection all passed with >94% confidence.
6. **Documentation & Notebooks**:
   - Generated `ml/notebooks/02_attack_classifier.ipynb` and `docs/ml-methodology.md`.