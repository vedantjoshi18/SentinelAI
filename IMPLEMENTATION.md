# SentinelAI — Implementation Roadmap & Execution Log

**Project**: SentinelAI (AI-Powered Application Security & Intrusion Detection Platform)  
**Subject**: Application Security and Intrusion Detection  
**Architecture**: Monorepo (`client/`, `server/`, `ai-service/`, `ml/`, `tests/`, `docs/`)  

---

## Phase Execution Checklist

| Phase | Description | Status | Pass/Fail | Notes |
|---|---|---|---|---|
| **Phase 0** | **Project Foundation & Monorepo Setup** | **COMPLETED** | **PASSED** | React (Vite) + Express + FastAPI initialized, health checks live, tests passing. |
| **Phase 1** | Database + Authentication (MongoDB, JWT, bcrypt, RBAC) | Planned | Pending | User model, roles (USER, ANALYST, ADMIN), rate-limited login. |
| **Phase 2** | Dataset Inspection & Preparation | Planned | Pending | HttpParamsDataset raw data exploration & preprocessing pipeline. |
| **Phase 3** | Application Attack Classifier Training | Planned | Pending | TF-IDF + Logistic Regression / Random Forest, metrics evaluation. |
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