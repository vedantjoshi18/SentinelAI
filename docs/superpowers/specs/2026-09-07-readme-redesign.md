# SentinelAI — Production-Grade README Design Specification

**Spec Title**: SentinelAI Comprehensive README & System Showcase  
**Date**: 2026-09-07  
**Status**: Approved (Transitioning to Plan)  
**Target File**: `README.md`  

---

## 1. Goal & Objectives

The objective is to produce a definitive, portfolio-grade, and viva-ready `README.md` for **SentinelAI**. It must serve dual purposes seamlessly:
1. **Executive & Evaluator Clarity**: Give reviewers, evaluators, and recruiters an immediate, high-level understanding of what the platform solves, its defense-in-depth architecture, key machine learning benchmarks, and live status in under 60 seconds.
2. **Deep Hands-On Testing Guide**: Provide reproducible, zero-assumption setup steps (Docker & Bare-Metal) and an 11-feature hands-on verification manual (with exact CLI `curl` payloads and UI click-through paths) so anyone can test and verify all platform features on their local machine.

---

## 2. Document Architecture & Section Breakdown

The new `README.md` will be structured into the following 11 high-impact sections:

### Section 1: Header, Status Badges & Quick Navigation
- **Hero Title**: SentinelAI: AI-Powered Application Security & Intrusion Detection Platform
- **Tagline**: Multi-layer defense-in-depth platform combining deterministic WAF rules, character-level TF-IDF NLP machine learning, unsupervised behavioral anomaly detection, and a dynamic risk scoring engine with automated enforcement.
- **Badges**:
  - Node.js (v18+)
  - Python (3.10+ / FastAPI)
  - React 18 / Vite / Tailwind CSS
  - Database: MongoDB 7.0 + Zero-Config In-Memory Fallback
  - Containerization: Docker & Docker Compose
  - Test Suite: 100% Pass (130 Server tests, 29 AI Pytests)
  - License: MIT
- **Quick Links / Table of Contents** linking directly to each section.

### Section 2: Executive Overview & Problem Statement
- **The Problem in Modern Web Security**:
  - *Static WAF Limitations*: Regex signatures break when faced with polyglot evasions, encoding tricks, and zero-day variations, while suffering from false positive spikes on benign inputs.
  - *Standalone AI Pitfalls*: Pure machine learning classifiers lack operational security context, are prone to adversarial dilution, and cannot provide deterministic guarantees required by compliance standards.
- **The SentinelAI Approach**:
  - Combines deterministic signatures for immediate high-confidence matching with sub-word NLP classification for obfuscated attack variants and Isolation Forest behavioral tracking for anomalous traffic bursts.
  - Synthesizes all security signals through a dynamic risk engine with mathematically enforced non-dilution risk floors.
  - Presents telemetry in real time via a dark SOC operations dashboard.

### Section 3: Architecture & Security Pipeline
- **Visual Mermaid Diagram** illustrating the end-to-end request lifecycle:
  - User/Attacker Request -> React Frontend / External API Client -> Express Security Gateway -> Sanitization Middleware -> Security Middleware Deep Inspection.
  - Parallel inspection pipelines:
    1. Deterministic Rule Engine (24 compiled rules).
    2. FastAPI AI Attack Classifier (TF-IDF + Logistic Regression).
    3. Isolation Forest Behavioral Anomaly Profiler (Sliding window telemetry).
  - Multi-Signal Synthesis in Dynamic Risk Engine (Weights, Sanitization, Risk Floors: CRITICAL=85, HIGH=65, AI >= 0.95=85, Anomaly >= 0.85=80).
  - Action Policy Enforcement: ALLOW (0-29), MONITOR (30-59), BLOCK 403 (60-100).
  - Asynchronous Non-Blocking Event Logger -> MongoDB Storage.
  - React SOC Dashboard with real-time analytics and triage.
- **Component Responsibility Matrix**: Detailed breakdown table of the 6 core components, their runtime technology, and primary function.

### Section 4: Zero-Friction Setup & Pre-Configured Accounts
- **Automated In-Memory DB Fallback**:
  - Emphasize that developers and evaluators can clone and run SentinelAI **without having MongoDB installed or running**.
  - In development mode, the server automatically boots an in-memory storage engine pre-populated with realistic historical threats and pre-configured accounts.
- **Pre-Configured Demo Credentials & 1-Click Access**:
  - Admin: `demo.admin@sentinelai.local` / `AdminPassword123!`
  - SOC Analyst: `demo.analyst@sentinelai.local` / `AnalystPassword123!`
  - Highlight the 1-click login button directly available in the web UI.

### Section 5: Getting Started (Two Quick Launch Options)
- **Option 1: Docker Compose (1-Command Full Stack)**:
  - `docker compose up --build`
  - Explains port mappings (Client: `http://localhost:5173`, Server: `http://localhost:5000`, AI Service: `http://localhost:8000`, MongoDB: `27017`).
- **Option 2: Bare-Metal Local Development**:
  - Prerequisites check (Node v18+, Python v3.10+).
  - Step 1: Clone repo and setup `.env` (`cp .env.example .env`).
  - Step 2: Launch AI Microservice (`cd ai-service`, virtualenv creation, `pip install -r requirements.txt`, `uvicorn app.main:app --port 8000 --reload`).
  - Step 3: Launch Express Server (`cd server`, `npm install`, `npm run dev`).
  - Step 4: Launch React Client (`cd client`, `npm install`, `npm run dev`).

### Section 6: Comprehensive Feature Testing Guide (11 End-to-End Scenarios)
- **Automated Test Runners**:
  - Express Server Test Suite: `npm test` in `server/` (130 automated unit and integration tests passing).
  - AI Service Test Suite: `pytest` in `ai-service/` (29 automated tests passing).
  - Frontend Build Verification: `npm run build` in `client/` (clean Vite build, 0 errors).
- **Interactive Hands-On Test Scenarios (with exact CLI curl and UI instructions)**:
  1. *SQL Injection (SQLi) Detection & Gateway Interception*: Submit tautology payload; expect HTTP 403 Forbidden with diagnostic JSON; verify counter increment in SOC Overview.
  2. *Cross-Site Scripting (XSS) & Path Traversal / LFI Interception*: Submit `<img src=x onerror=...>` and `../../etc/passwd` to profile endpoints; expect HTTP 403.
  3. *Brute-Force Credential Stuffing & Automated Account Lockout*: Run 5 consecutive failed logins; test 6th attempt; expect HTTP 423 Locked.
  4. *Behavioral Anomaly Detection via Isolation Forest*: Send volumetric/entropy spike payload to `POST /anomaly`; verify `CRITICAL` anomaly level and indicators.
  5. *Interactive Threat Sandbox (Web UI)*: Open `/sandbox`, select attack presets (SQLi, XSS, CMDi), execute inspection, review real-time gauge score, matched rules, and AI confidence.
  6. *Live SOC Threat Feed & Forensic Incident Triage*: Navigate to `/threats`, filter by severity or vector, open inspection modal, change resolution status to "Investigating" with analyst notes.
  7. *Attack Analytics & Recharts Visualizations*: Navigate to `/analytics`, view interactive donut severity distribution, category frequency bars, and system telemetry metrics.
  8. *Deterministic WAF Rule Catalog*: Navigate to `/rules`, browse the 24 active compiled signatures across 4 threat categories with zero-eval execution guarantees.
  9. *Access Governance & Administrative RBAC*: Login as Admin, open `/admin`, demonstrate role toggling (`USER`/`ANALYST`/`ADMIN`), unlock locked victim accounts, and test self-deletion safeguards.
  10. *System & Microservice Cluster Health*: Navigate to `/system`, view live latency heartbeats and component statuses for Express Gateway, AI Classifier, Anomaly Detector, and Database.
  11. *Network IDS Layer 3/4 Flow Intrusion Classifier*: Send flow feature vector to `POST /api/network/flow`; verify DoS SYN Flood, Port Scan, or Brute Force classification.

### Section 7: Key Machine Learning & Security Methodology
- **Application Attack Classifier**:
  - Character-level TF-IDF n-grams (2-5 grams, 15,000 features, sublinear TF) to capture sub-word syntax fragments without being fooled by token splitting.
  - Balanced Logistic Regression vs Random Forest benchmark (99.86% vs 97.72% accuracy; 97.17% vs 83.30% Macro F1; explaining why Logistic Regression won).
- **Behavioral Anomaly Detector**:
  - 6-dimensional telemetry vector (`request_frequency`, `burst_frequency`, `failed_auth_count`, `error_4xx_rate`, `path_entropy`, `avg_interval_ms`).
  - Isolation Forest vs One-Class SVM benchmark (99.92% ROC-AUC, 100% precision, 6.34 µs inference latency).
- **Dynamic Risk Scoring & Defensive Risk Floors**:
  - Explains the critical security flaw of naive weighted averages (dilution vulnerability).
  - Explains the mathematical guarantee provided by SentinelAI's defensive risk floors (`CRITICAL_RULE_MATCH_FLOOR` = 85, `HIGH_CONFIDENCE_AI_EXPLOIT_FLOOR` = 85, `ACCOUNT_LOCKOUT_BURST_FLOOR` = 80, `CRITICAL_BEHAVIORAL_ANOMALY_FLOOR` = 80).

### Section 8: API Reference Summary
- Summary tables of Express API endpoints (`/api/auth/*`, `/api/threats/*`, `/api/admin/*`, `/api/users/*`, `/api/health`).
- Summary tables of FastAPI AI Microservice endpoints (`/predict`, `/anomaly`, `/network/flow`, `/health`).

### Section 9: Monorepo Architecture & Directory Layout
- Annotated file tree showing the purpose of each directory (`client/`, `server/`, `ai-service/`, `ml/`, `tests/`, `docs/`).

### Section 10: Security Hardening & Production Compliance
- Security features table: Helmet CSP/HSTS, NoSQL operator sanitization, prototype pollution protection, ReDoS-safe regex boundaries, rate limiting, and credential redaction.

### Section 11: Documentation & References
- Deep links to companion guides:
  - `docs/PLATFORM_GUIDE.md` (System components & access guide)
  - `docs/viva.md` (Academic defense & viva preparation)
  - `docs/demonstrations.md` (Verifiable demonstration scripts)
  - `docs/DEPLOYMENT_GUIDE.md` (Cloud VPS & SSL setup)
  - `docs/openapi.yaml` (Full OpenAPI 3.0 specification)

---

## 3. Verification & Acceptance Criteria

1. **Accuracy**: All ports, commands, endpoints, demo credentials, and file paths must accurately reflect the SentinelAI codebase.
2. **Clarity**: All commands must be copy-paste ready for both Windows PowerShell and Linux/macOS bash.
3. **Completeness**: All 11 platform features documented with clear expected outputs and UI navigation instructions.
4. **Self-Review Completed**: No placeholders, no TODOs, accurate Markdown links, valid Mermaid diagram syntax.
