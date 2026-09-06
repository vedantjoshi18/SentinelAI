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
| **Phase 8** | **Security Event Logging & Audit APIs** | **COMPLETED** | **PASSED** | MongoDB SecurityEvent schema, non-blocking logger, RBAC-protected SOC audit & metrics APIs. |
| **Phase 9** | **Behavioural Anomaly Detection** | **COMPLETED** | **PASSED** | Isolation Forest vs One-Class SVM benchmark (99.92% ROC-AUC, 100% precision), FastAPI `POST /anomaly`. |
| **Phase 10** | **Behaviour Integration** | **COMPLETED** | **PASSED** | Real-time sliding window telemetry, Anomaly Detector AI integration, UserBehaviour persistence, 105 tests passing. |
| **Phase 11** | **React Security SOC Dashboard** | **COMPLETED** | **PASSED** | Dark SOC theme (#0B0F19), Recharts visualizations, live DB stats, forensic triage modal, manual analysis sandbox. |
| **Phase 12** | **Admin & User Management** | **COMPLETED** | **PASSED** | Server-side enforced RBAC controls, user administration, status toggling, lockout reset, 15 tests passing. |
| **Phase 13** | **Security Hardening & Defenses** | **COMPLETED** | **PASSED** | Helmet CSP/HSTS headers, input sanitization, NoSQL injection neutralization, rate limiting, secret validator. |
| **Phase 14** | **Comprehensive Verification & Testing** | **COMPLETED** | **PASSED** | 130 server tests passing, 29 AI pytest tests passing, client builds cleanly in production. |
| **Phase 15** | **Network IDS (Layer 3/4 Flow Intrusion Detection)** | **COMPLETED** | **PASSED** | CIC-IDS2017 flow feature classifier, DoS SYN flood, port scan & brute force detection in FastAPI. |
| **Phase 16** | **Professionalization & Production Readiness** | **COMPLETED** | **PASSED** | Docker Compose multi-container stack, Dockerfiles, Nginx reverse proxy, OpenAPI 3.0 specification. |
| **Phase 17** | **Complete Documentation** | **COMPLETED** | **PASSED** | viva.md, architecture.md, api.md, ml-methodology.md, dataset.md, PLATFORM_GUIDE.md, DEPLOYMENT_GUIDE.md. |
| **Phase 18** | **Final End-to-End Live Demonstrations** | **COMPLETED** | **PASSED** | 6 verifiable viva demonstration scripts in docs/demonstrations.md for evaluator testing. |

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

---

## Phase 8: Security Event Logging & Audit APIs Details

### Objectives Met:
1. **SecurityEvent Data Model (`server/src/models/SecurityEvent.js`)**:
   - Comprehensive Mongoose schema persisting timestamp, IP, HTTP method, path, threat category, risk score (0–100), severity tier, enforcement action, matched rules, AI confidence & model version, factors, breakdown, request velocity telemetry, user agent, user reference, sanitized payload snippet, and analyst resolution status.
   - Compound indexes on `{ timestamp: -1 }`, `{ threatType: 1, timestamp: -1 }`, `{ severity: 1, timestamp: -1 }`, `{ action: 1, timestamp: -1 }`, `{ ip: 1, timestamp: -1 }`, `{ resolved: 1, timestamp: -1 }` for high-throughput SOC querying.
2. **Non-Blocking Audit Event Logger (`server/src/services/eventLogger.js`)**:
   - Integrated as the default handler in `securityMiddleware`.
   - Asynchronous fire-and-forget logging ensuring zero latency impact on request handling.
   - Sensitive password sanitization: payload strings exclude sensitive credentials, hashes, and secrets.
   - Self-referential recursion prevention: internal queries to `/api/threats` are excluded from security event logging.
3. **SOC Threat Audit APIs (`server/src/controllers/threatController.js` & `server/src/routes/threatRoutes.js`)**:
   - `GET /api/threats`: Paginated audit logs with multi-attribute filtering by `threatType`, `severity`, `action`, `ip`, `resolved`, and timestamp range (`startDate`, `endDate`).
   - `GET /api/threats/stats`: Aggregated metrics for dashboard visualizations (total events, blocked, monitored, allowed, threat breakdown by category, severity distribution, and recent critical threat incidents).
   - `GET /api/threats/:id`: Individual event retrieval with full forensic telemetry.
   - `PATCH /api/threats/:id/status`: Incident triage endpoint allowing SOC analysts to update resolution status and attach investigative notes.
4. **Role-Based Access Control (RBAC)**:
   - Audit query and triage endpoints are strictly protected by JWT authentication and RBAC (`ANALYST` and `ADMIN` roles only). Standard `USER` roles are rejected with HTTP `403 Forbidden`.
5. **Verification & Testing**:
   - 15 dedicated unit and integration tests in `server/tests/securityEvents.test.js` testing schema persistence, password sanitization, automatic gateway event creation, pagination, filtering, stats aggregation, single event retrieval, triage updates, and RBAC rejection.
   - Full server test suite passing: **87/87 tests passing** across 34 test suites.
   - AI service pytest test suite: **13/13 tests passing**.

---

## Phase 9: Behavioural Anomaly Detection Details

### Objectives Met:
1. **Model Benchmark & Architecture Selection (`ml/training/train_anomaly_detector.py`)**:
   - Evaluated **Isolation Forest** against **One-Class SVM** across 12,000 behavioral telemetry instances (10,000 normal human browsing records + 2,000 attack profiles covering credential stuffing, directory fuzzing, API flooding, and low-and-slow reconnaissance).
   - Results Benchmark:
     - **Isolation Forest**: **99.92% ROC-AUC**, **100.00% Precision**, **78.04% F1-score**, **6.34 µs/sample** inference latency, $O(t \cdot n \log n)$ scaling.
     - **One-Class SVM**: 80.04% ROC-AUC, 81.52% Precision, 66.37% F1-score, 25.39 µs/sample latency, $O(n^3)$ scaling.
     - **Verdict**: Isolation Forest decisively chosen for sub-millisecond inference and zero false positives.
2. **Feature Engineering & Scaling**:
   - 6-dimensional behavioral telemetry feature vector:
     - `request_frequency` (velocity in req/min)
     - `burst_frequency` (peak req/10s window)
     - `failed_auth_count` (consecutive failed logins)
     - `error_4xx_rate` (ratio of 4xx client errors)
     - `path_entropy` (endpoint exploration diversity)
     - `avg_interval_ms` (mean inter-request delay)
   - Standardized using `StandardScaler`.
3. **Artifact Serialization**:
   - `ai-service/app/models/anomaly_detector/model.joblib`
   - `ai-service/app/models/anomaly_detector/scaler.joblib`
   - `ai-service/app/models/anomaly_detector/meta.joblib`
   - `ml/evaluation/results/anomaly_evaluation.json`
4. **FastAPI Microservice Integration (`POST /anomaly` & `POST /api/anomaly`)**:
   - `AnomalyRequest` & `AnomalyResponse` Pydantic schemas validating non-negative values and proper bounded error rates.
   - Singleton `AnomalyDetectorService` with in-memory caching during application lifespan.
   - Piecewise calibrated score mapping raw decision function to standardized $[0.0, 1.0]$ severity score with categorical classification (`NORMAL`, `SUSPICIOUS`, `CRITICAL`).
   - `GET /health` endpoint updated to report both attack and anomaly model readiness.
5. **Verification & Testing**:
   - 9 dedicated pytest test cases in `ai-service/tests/test_anomaly.py` verifying normal baseline, credential stuffing, directory fuzzing, API flooding, route aliases, and 422 input validation.
   - Total AI service test count: **22/22 pytest tests passing**.
   - Total Server test count: **87/87 tests passing**.
   - Jupyter Notebook `ml/notebooks/03_anomaly_detector.ipynb` documenting benchmarking results, charts, and methodology.

---

## Phase 10: Behaviour Integration Details

### Objectives Met:
1. **AI Anomaly Client Integration (`server/src/services/aiClient.js`)**:
   - Implemented `detectAnomaly(features)` method communicating with FastAPI `POST /anomaly`.
   - Feature boundary enforcement: ensures strictly valid non-negative values (`request_frequency`, `burst_frequency`, `failed_auth_count`, `path_entropy`, `avg_interval_ms`) and normalized `error_4xx_rate` $\in [0.0, 1.0]$.
   - Resilient fallback mechanism: handles connection failures, timeouts, and network drops gracefully with offline fallback payload without interrupting the Express pipeline.
   - Updated `checkHealth()` to report `anomalyModelLoaded` and `anomalyModelVersion`.
2. **UserBehaviour Data Model (`server/src/models/UserBehaviour.js`)**:
   - Comprehensive Mongoose schema persisting behavioral profiles for users and client IPs.
   - Tracks `entityId`, `entityType` (`IP` or `USER`), `userId`, `ip`, `windowStart`, `requestCount`, `burstCount`, `failedAuthCount`, `error4xxCount`, `totalRequests`, `distinctPaths`, `lastAnomalyScore`, `lastAnomalyLevel`, `isAnomaly`, `historicalViolations`, `lastActive`, and serialized `telemetryFeatures`.
   - Compound unique index on `{ entityId: 1, entityType: 1 }` for sub-millisecond query performance and `{ lastActive: -1 }`.
3. **High-Throughput Sliding-Window Engine (`server/src/services/behaviourService.js`)**:
   - In-memory sliding window manager maintaining active telemetry with zero database read overhead per request:
     - Primary 60-second sliding window (`WINDOW_MS = 60_000`) for velocity calculation (`request_frequency`).
     - 10-second peak burst window (`BURST_MS = 10_000`) for burst spike tracking (`burst_frequency`).
     - Endpoint exploration diversity tracking (`path_entropy`).
     - Proportionate HTTP 4xx client response tracking (`error_4xx_rate`).
     - Microsecond inter-request arrival interval analysis (`avg_interval_ms`).
   - Non-blocking asynchronous DB persistence bridge (`persistToDb()`) upserting state to `UserBehaviour`.
4. **Dynamic Risk Engine Anomaly Floor Override (`server/src/services/riskEngine.js`)**:
   - Added `CRITICAL_BEHAVIORAL_ANOMALY_FLOOR`: forces risk score $\ge 80$ and enforcement action `BLOCK` whenever the AI Anomaly Detector reports an anomaly score $\ge 0.85$ (or `anomalyLevel === 'CRITICAL'`).
   - Guarantees that severe volumetric attacks, directory fuzzing crawlers, or brute-force credential stuffing are strictly blocked even if request payloads lack explicit SQL/XSS regex tokens.
5. **Gateway Security Middleware Integration (`server/src/middleware/securityMiddleware.js`)**:
   - Automated entity resolution (`req.user?._id` vs `clientIp`).
   - Real-time sliding window recording and telemetry extraction on every inbound request.
   - Response listener hook (`res.on('finish')`) observing 4xx client errors to dynamically increase error rates for directory fuzzers and scanner bots.
   - Seamless handoff to `aiClient.detectAnomaly(telemetry)`.
   - Threat categorization: flags incidents as `BEHAVIORAL_ANOMALY` when anomaly detection triggers.
   - Enriched `req.securityContext.anomalyDetection` and telemetry parameters dispatched to non-blocking audit logging.
6. **Authentication Controller & Audit Sync**:
   - `server/src/controllers/authController.js` updates `behaviourService` on failed and successful authentication events.
   - `server/src/models/SecurityEvent.js` expanded `threatType` enum with `'BEHAVIORAL_ANOMALY'` and added full telemetry breakdown.
7. **Verification & Testing**:
   - 18 dedicated test cases in `server/tests/behaviourIntegration.test.js` verifying schema persistence, sliding window mechanics, expired request pruning, 4xx rates, entropy, inter-arrival timing, AI client sanitization, offline fallback, health probe, risk floors, and end-to-end gateway blocking.
   - Total Server test count: **105/105 tests passing** across 40 test suites.
   - Total AI service test count: **22/22 pytest tests passing**.

---

## Phase 11: React Security SOC Dashboard Details

### Objectives Met:
1. **Cyber SOC Dark Theme & Layout Architecture**:
   - Modern cybersecurity operations center palette (`#0B0F19` deep background, `#111827` cards, cyan/emerald/rose/amber semantic accents).
   - Sticky `Topbar` displaying live microservice health badges (Express Gateway, AI Classifier, Isolation Forest Anomaly Engine), dynamic auto-sync frequency selector (`5s`, `10s`, `30s`, `Off`), manual refresh trigger, and user session controls.
   - Clean 4-tab navigation bar (`TabNavigation`): **SOC Overview**, **Threat Event Feed**, **Attack Visualizations**, **Threat Sandbox**.
2. **Global Authentication & Session Management**:
   - `client/src/context/AuthContext.jsx` with Bearer token persistence in `localStorage` and automatic JWT header injection via Axios request interceptors (`client/src/services/api.js`).
   - `⚡ Instant Demo Analyst Login` shortcut button auto-logging in or registering `demo.analyst@sentinelai.local` with analyst privileges for zero-friction evaluation.
   - Modal-based sign-in and registration (`AuthModal`) with validation and error feedback.
3. **Tab 1: SOC Overview & Executive Metrics**:
   - Real-time `MetricCards` presenting Total Evaluated Events, Blocked Intrusions with percentage interception rate, Monitored Suspicious Events, and Average Risk Level gauge.
   - `RecentIncidentsTable` showing top critical high-risk events with severity badges, risk scores, and quick triage inspection.
   - Interactive 5-stage SentinelAI Defense Pipeline architecture map.
4. **Tab 2: Live Threat Event Audit Feed**:
   - Comprehensive `ThreatEventsTable` displaying timestamp, origin IP, threat vector, HTTP method/path, calculated risk score, severity badge, and policy action badge (`ALLOW` / `MONITOR` / `BLOCK`).
   - `ThreatFilterBar` enabling instant multi-criteria filtering by Threat Category (SQLi, XSS, Path Traversal, CMDi, Behavioral Anomaly, Normal), Severity (Critical, High, Medium, Low), Action, and free-text IP/Path search.
   - Client-side and server-side pagination support.
5. **Tab 3: Attack Visualizations & Telemetry**:
   - Recharts-powered `ThreatCategoryBarChart` breaking down attack vector frequencies with color-coded categorical bars.
   - Recharts-powered `SeverityDistributionPie` rendering donut visualization of severity levels with tooltips and percentages.
   - Micro-telemetry breakdown cards displaying real-time metrics across all system decisions.
6. **Tab 4: Interactive Threat Sandbox**:
   - Realistic attack presets selector (`PayloadPresetSelector`) covering SQL Injection tautology, XSS script injection, Path Traversal / LFI probe, and Command Injection.
   - Live payload constructor (`CustomPayloadEditor`) supporting custom HTTP methods, paths, and JSON payloads.
   - Real-time deep packet diagnostic inspector (`DiagnosticInspector`) displaying computed risk scores, dynamic engine decisions, deterministic rule signatures matched, and AI model predictions.
7. **Forensic Incident Triage Modal**:
   - `ThreatDetailModal` displaying full request telemetry (headers, user agent, IP, query params, body snippets with password redaction).
   - Signal breakdown details (Rules, AI, Anomaly detection, and frequency factors).
   - Interactive analyst triage update allowing toggling resolution status and saving investigative notes via `PATCH /api/threats/:id/status`.
8. **Verification & Build**:
   - `npm run build` in `client/` builds and bundles cleanly with 0 errors (`vite v5.4.21 built in 4.43s`).
   - All 105 tests in `server/` pass with zero failures.
   - All 22 tests in `ai-service/` pass with zero failures.

---

## Phase 12: Admin & User Management Details

### Objectives Met:
1. **Server-Side RBAC Enforcement**:
   - `server/src/controllers/adminController.js` and `server/src/routes/adminRoutes.js` mounted at `/api/admin`.
   - Strict `authenticate` and `authorizeRoles('ADMIN')` middleware pipeline on all endpoints.
   - Prevents unauthorized access from unauthenticated clients (401) and standard users/analysts (403).
2. **Administrative Operations**:
   - `GET /api/admin/users`: Paginated user list with role, status, and free-text search filters.
   - `GET /api/admin/stats`: Aggregates total users, role distributions, and locked accounts.
   - `PATCH /api/admin/users/:id/role`: Dynamically updates user role (`USER`, `ANALYST`, `ADMIN`) with self-demotion safety guard.
   - `PATCH /api/admin/users/:id/status`: Updates account status (`active`, `suspended`, `locked`) with self-suspension guard.
   - `POST /api/admin/users/:id/unlock`: Resets `failedLoginAttempts: 0` and `lockedUntil: null`, restoring account to `active`.
   - `DELETE /api/admin/users/:id`: Permanently deletes user with self-deletion guard.
3. **Frontend Integration**:
   - `UserManagementView.jsx` rendered in Tab 5 ("Admin & RBAC"), accessible to `ADMIN` accounts or via `⚡ Demo Admin` button.
   - Features executive user metric cards, searchable/filterable user table, interactive role and status dropdowns, and instant unlock buttons.
4. **Verification**: 15 dedicated tests in `server/tests/admin.test.js` passing cleanly.

---

## Phase 13: Security Hardening & Defenses Details

### Objectives Met:
1. **Helmet HTTP Security Headers**:
   - Strict Content Security Policy (CSP) with parameterized directives (`default-src 'self'`).
   - Frameguard `X-Frame-Options: DENY` preventing clickjacking.
   - MIME sniffing protection `X-Content-Type-Options: nosniff`.
   - Automated HSTS (`Strict-Transport-Security`) in production mode (`maxAge: 31536000, includeSubDomains: true, preload: true`).
2. **Input Sanitization & NoSQL Injection Defense**:
   - `server/src/middleware/sanitizationMiddleware.js` recursively strips MongoDB operator keys (`$where`, `$gt`, etc.) from incoming bodies, query parameters, and URL parameters.
   - Strips null-byte injections (`\0`) and prototype pollution vectors (`__proto__`, `constructor`).
3. **Cryptographic Secret Hygiene**:
   - `server/src/config/securityValidator.js` enforces minimum 32-character entropy and flags default/fallback secrets in production.
4. **Verification**: 10 dedicated tests in `server/tests/securityHardening.test.js` passing cleanly.

---

## Phase 14: Comprehensive Verification & Testing Details

### Objectives Met:
1. **Full-Spectrum Verification**:
   - Server Test Suite: **130/130 automated tests passing** across 51 suites (`npm test` in `server/`).
   - AI Service Test Suite: **29/29 pytest tests passing** across prediction, anomaly, and network flow modules (`pytest` in `ai-service/`).
   - Frontend Production Bundle: **0 build errors** via Vite (`npm run build` in `client/`).
2. **Zero Known Regressions**: All deterministic rule tests, risk engine bounds, AI clients, sliding-window anomalies, RBAC guards, and security hardening tests pass concurrently.

---

## Phase 15: Network IDS (Layer 3/4 Flow Intrusion Detection) Details

### Objectives Met:
1. **Architectural Separation**:
   - Clear separation established between Layer 7 HTTP application payload classification and Layer 3/4 CIC-IDS2017 network flow statistics.
2. **Flow Feature Classifier**:
   - `ai-service/app/schemas/network.py`: Pydantic validation for flow metrics (`flow_duration_ms`, `total_fwd_packets`, `total_bwd_packets`, `flow_bytes_per_sec`, `flow_packets_per_sec`, `syn_flag_count`, `ack_flag_count`, `fin_flag_count`).
   - `ai-service/app/services/network_ids.py`: Classifies flows into `BENIGN`, `DOS_SYN_FLOOD`, `PORT_SCAN`, `BRUTE_FORCE`.
   - `ai-service/app/api/routes/network.py`: Route `POST /network/flow` and `/api/network/flow`.
3. **Backend Client Integration**:
   - `server/src/services/aiClient.js` includes `classifyNetworkFlow(flowData)` and monitors `networkIdsLoaded` in health probes.
4. **Verification**: 7 dedicated test cases in `ai-service/tests/test_network_ids.py` passing cleanly.

---

## Phase 16: Professionalization & Production Readiness Details

### Objectives Met:
1. **Multi-Container Docker Architecture**:
   - Root `docker-compose.yml` orchestrating MongoDB 7.0, FastAPI AI Microservice, Node.js Express Gateway, and Nginx-powered React Client with automated healthchecks and internal network bridges.
   - Individual multi-stage Dockerfiles and `.dockerignore` files for `server`, `ai-service`, and `client`.
2. **OpenAPI 3.0 Specification**:
   - `docs/openapi.yaml` documenting all API endpoints, schemas, parameters, and responses.

---

## Phase 17: Complete Documentation Details

### Objectives Met:
1. **Master Guides**:
   - `docs/PLATFORM_GUIDE.md`: Comprehensive explanation of all 10 system components, user roles, and access walkthrough.
   - `docs/DEPLOYMENT_GUIDE.md`: Production deployment guide for Docker Compose, Bare-Metal, and Linux Cloud VPS with Let's Encrypt SSL/TLS.
   - `docs/viva.md`: In-depth oral defense and viva questions covering algorithms, theoretical foundations, benchmarks, and architectural decisions.
   - `docs/architecture.md`, `docs/api.md`, `docs/ml-methodology.md`, `docs/dataset.md`, and `docs/security.md`.

---

## Phase 18: Final End-to-End Live Demonstrations Details

### Objectives Met:
1. **Reproducible Demonstration Scripts**:
   - `docs/demonstrations.md` detailing 6 live scenarios with exact curl commands, HTTP response codes (403, 423, 200), and dashboard reflections:
     1. SQL Injection Attack Detection & Automated Gateway Block (403).
     2. Cross-Site Scripting (XSS) & Path Traversal Interception.
     3. Brute Force Credential Stuffing & Automated Account Lockout (423).
     4. Volumetric Burst & Directory Fuzzing Behavioral Anomaly Detection.
     5. Interactive Threat Sandbox Deep Packet Diagnostics.
     6. Administrator User Management, Role Elevation & Lockout Triage.