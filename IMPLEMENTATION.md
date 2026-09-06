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
| **Phase 4** | **FastAPI AI Inference Service** | **COMPLETED** | **PASSED** | Startup artifact loading, `POST /predict`, Pydantic validation, structured errors, versioning. |
| **Phase 5** | **Deterministic Security Rule Engine** | **COMPLETED** | **PASSED** | 24 modular rules across SQLi, XSS, Path Traversal, and Command Injection, zero execution, tests passing. |
| **Phase 6** | **Dynamic Risk Engine** | **COMPLETED** | **PASSED** | Multi-signal normalization to 0–100 risk score, floor overrides, ALLOW/MONITOR/BLOCK policy mapping. |
| **Phase 7** | **Security Middleware Integration** | **COMPLETED** | **PASSED** | Request interceptor, deep inspection (Rules + AI + Risk Engine), rate limiting, automated 403 blocking. |
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

---

## Phase 4: FastAPI AI Inference Service Details

### Objectives Met:
1. **Startup Model Caching**:
   - `AttackClassifierService` loads `model.joblib` and `vectorizer.joblib` once at application startup using FastAPI's lifespan event.
   - Ensures sub-millisecond inference with zero disk read or retraining overhead per request.
2. **Pydantic Validation**:
   - `PredictionRequest`: Validates non-empty input strings, rejects whitespace-only or missing payload requests with HTTP 422.
   - `PredictionResponse`: Strongly typed output schema specifying `threatType`, `confidence` (0.0 to 1.0), `modelVersion`, and per-class `probabilities`.
3. **Endpoint Implementation**:
   - `POST /predict` and `POST /api/predict`: Returns predicted threat type and calibrated probability score.
   - Returns 503 if model is uninitialized and 422 on invalid payload structures.
4. **Health Check**:
   - `GET /health` returns `status: "ok"`, `modelLoaded: true`, and `modelVersion: "attack-classifier-v1"`.
5. **Testing & Live Verification**:
   - 13 comprehensive pytest test cases passing in `ai-service/tests/test_predict.py` and `ai-service/tests/test_health.py`.
   - Verified live with `uvicorn` and `Invoke-RestMethod` across Normal, SQLi, XSS, Path Traversal, and Command Injection inputs.

---

## Phase 5: Deterministic Security Rule Engine Details

### Objectives Met:
1. **Modular Rule Catalog (`server/src/services/rules/`)**:
   - 24 deterministic detection rules covering SQL Injection, XSS, Path Traversal, and Command Injection.
   - Distinct severity weights: `CRITICAL` (4), `HIGH` (3), `MEDIUM` (2), `LOW` (1), `NONE` (0).
2. **Deterministic Threat Service (`server/src/services/threatService.js`)**:
   - Analyzes raw strings, JSON request bodies, and URL query structures.
   - Performs safe URL-decoding to uncover encoded evasion attempts (e.g. `%3Cscript%3E`, `%27%20OR%201=1`).
   - Automatically computes aggregate match list, highest severity level, and unified category (`SQL_INJECTION`, `XSS`, `PATH_TRAVERSAL`, `COMMAND_INJECTION`, or `MULTIPLE`).
3. **Execution Safety Guarantee**:
   - Strictly pattern-matching based; bounded text lengths prevent ReDoS.
   - Never evaluates or executes input (`eval`, shell, or vm).
4. **Verification & Testing**:
   - 22 dedicated test cases in `server/tests/threatRules.test.js` passing (39 total tests passing in server test suite).
5. **Documentation**:
   - Documented defense-in-depth architecture, rule catalog, and safety model in `docs/security.md`.

---

## Phase 6: Dynamic Risk Engine Details

### Objectives Met:
1. **Multi-Signal Normalization (`server/src/services/riskEngine.js`)**:
   - Ingests telemetry across 6 security dimensions:
     - AI Payload Prediction Confidence (weight: 0.35)
     - Deterministic Rule Signature Match (weight: 0.30)
     - Behavioral Anomaly Detector Score (weight: 0.15)
     - Repeated Failed Authentication Attempts (weight: 0.10)
     - Request Burst Frequency Rate (weight: 0.05)
     - Historical Violation Frequency (weight: 0.05)
   - Normalizes all input signals into consistent 0–100 scale with robust input sanitization against NaN/invalid types.
2. **Defensive Risk Floors (Non-Dilution Guarantee)**:
   - Prevents active, high-confidence exploits from being watered down by benign peripheral metrics:
     - `CRITICAL` Rule Match enforces floor of **85** (`CRITICAL_RULE_MATCH_FLOOR`).
     - `HIGH` Rule Match enforces floor of **65** (`HIGH_RULE_MATCH_FLOOR`).
     - AI Payload Confidence $\ge 0.95$ enforces floor of **85** (`HIGH_CONFIDENCE_AI_EXPLOIT_FLOOR`).
     - AI Payload Confidence $\ge 0.80$ enforces floor of **65** (`MODERATE_CONFIDENCE_AI_EXPLOIT_FLOOR`).
     - Account Lockout burst ($\ge 5$ failed auth attempts) enforces floor of **80** (`ACCOUNT_LOCKOUT_BURST_FLOOR`).
3. **Thresholding and Automated Action Policy**:
   - Strict 4-tier risk severity classification:
     - **0 – 29**: `LOW` $\rightarrow$ `ALLOW`
     - **30 – 59**: `MEDIUM` $\rightarrow$ `MONITOR`
     - **60 – 79**: `HIGH` $\rightarrow$ `BLOCK`
     - **80 – 100**: `CRITICAL` $\rightarrow$ `BLOCK`
   - Strict mathematical bounds $[0, 100]$ and deterministic evaluation guarantees.
   - Modular configurability allowing custom threshold, weight, and action mappings.
4. **Diagnostic Telemetry Breakdown**:
   - Outputs detailed sub-scores (`breakdown`) and triggered floor overrides (`factors`) for audit logs and SOC visualization.
5. **Verification & Testing**:
   - 19 dedicated unit tests in `server/tests/riskEngine.test.js` validating benign baselines, threshold tiers, floor overrides, bounds sanitization, determinism, and custom config overrides.
   - Full server test suite passing (58/58 tests passing).

---

## Phase 7: Security Middleware Integration Details

### Objectives Met:
1. **AI Microservice Client (`server/src/services/aiClient.js`)**:
   - Asynchronous HTTP client communicating with FastAPI `POST /predict`.
   - Built-in fault tolerance: handles network timeouts, unreachability, and server errors via graceful fallback without crashing Express.
   - Microservice health probe `checkHealth()` targeting `GET /health`.
2. **Rate Limiting & Velocity Tracking (`server/src/middleware/rateLimiter.js`)**:
   - `apiLimiter`: 120 requests/minute general API rate limiter.
   - `authLimiter`: 20 requests/15 minutes strict auth endpoint limiter to deter brute-force credential stuffing.
   - `recordAndGetFrequency`: In-memory 60-second sliding window tracking requests/minute per client IP, feeding actual velocity into the dynamic risk engine.
3. **Deep Packet Security Middleware (`server/src/middleware/securityMiddleware.js`)**:
   - Intercepts all incoming Express requests before business logic or controllers execute.
   - Multi-surface input extraction: inspects JSON bodies, URL query parameters, and route parameters. Excludes sensitive password fields to avoid false positives.
   - Pipelined evaluation: Deterministic Rules $\rightarrow$ AI Payload Classifier $\rightarrow$ Risk Engine $\rightarrow$ Enforcement.
   - Automated Policy Enforcement:
     - `BLOCK`: Returns immediate HTTP `403 Forbidden` with structured JSON diagnostic context (`threatType`, `riskScore`, `severity`, `factors`, `ruleMatches`).
     - `MONITOR` or `ALLOW`: Attaches enriched `req.securityContext` and invokes `next()`.
   - Non-blocking `onSecurityEvent` audit hook for Phase 8 event logging.
   - Exemption handling for health probes (`/api/health`) and sandbox inspection.
4. **Threat Inspection Sandbox (`server/src/controllers/threatController.js` & `server/src/routes/threatRoutes.js`)**:
   - `POST /api/threats/inspect`: Allows security analysts, dashboard users, or testing tools to submit arbitrary payloads for full diagnostic inspection without gateway blocking.
5. **Verification & Testing**:
   - 14 dedicated integration test cases in `server/tests/securityMiddleware.test.js` verifying SQLi, XSS, Path Traversal, and Command Injection blocking, benign pass-through, AI floor enforcement, offline resilience, and event dispatch.
   - Total test count: **72/72 tests passing** across 28 suites in `server`.
   - AI service pytest test suite: **13/13 tests passing**.