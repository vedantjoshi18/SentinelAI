# SentinelAI — Complete Platform Architecture & User Guide

**Project**: SentinelAI (AI-Powered Application Security & Intrusion Detection Platform)  
**Platform Version**: 1.0.0 (Production Release)  
**Architecture**: Monorepo (`client/`, `server/`, `ai-service/`, `ml/`, `tests/`, `docs/`)

---

## Table of Contents
1. [Platform Overview & Quick Access](#1-platform-overview--quick-access)
2. [Component-by-Component Deep Dive](#2-component-by-component-deep-dive)
   - [Component 1: Security Gateway & Request Interceptor](#component-1-security-gateway--request-interceptor)
   - [Component 2: Deterministic Rule Engine (24 Signatures)](#component-2-deterministic-rule-engine-24-signatures)
   - [Component 3: AI Application Attack Classifier](#component-3-ai-application-attack-classifier)
   - [Component 4: Behavioral Anomaly Detection (Isolation Forest)](#component-4-behavioral-anomaly-detection-isolation-forest)
   - [Component 5: Dynamic Risk Scoring & Decision Engine](#component-5-dynamic-risk-scoring--decision-engine)
   - [Component 6: Layer 3/4 Network IDS (CIC-IDS2017)](#component-6-layer-34-network-ids-cic-ids2017)
   - [Component 7: Real-Time Cyber SOC Dashboard](#component-7-real-time-cyber-soc-dashboard)
   - [Component 8: Forensic Incident Triage & Resolution](#component-8-forensic-incident-triage--resolution)
   - [Component 9: Interactive Threat Sandbox](#component-9-interactive-threat-sandbox)
   - [Component 10: Admin & RBAC User Management](#component-10-admin--rbac-user-management)
3. [User Roles & Access Levels](#3-user-roles--access-levels)
4. [Step-by-Step Platform Walkthrough](#4-step-by-step-platform-walkthrough)

---

## 1. Platform Overview & Quick Access

SentinelAI is an enterprise-grade hybrid intrusion detection and application security platform designed to defend web applications against both deterministic OWASP Top 10 vulnerabilities and volumetric behavioral anomalies.

### Access URLs
| Service | Local URL | Description | Default Credentials |
|---|---|---|---|
| **SOC Dashboard (Web UI)** | `http://localhost:5173` | React 18 Cyber SOC Dashboard | Guest mode or One-Click Login |
| **API Gateway** | `http://localhost:5000` | Express REST API & Health | None (Bearer JWT required for SOC APIs) |
| **AI Inference Service** | `http://localhost:8000` | FastAPI ML Microservice | Public microservice port |
| **Interactive OpenAPI Docs** | `http://localhost:8000/docs` | Swagger UI for AI & Flow APIs | None |

### Instant One-Click Login Buttons
On the topbar of the web UI:
- **`Demo Analyst`**: Automatically logs in as `demo.analyst@sentinelai.local` (Password: `AnalystPassword123!`), providing immediate access to the SOC Overview, Live Threat Feed, Visualizations, and Sandbox.
- **`Demo Admin`**: Automatically logs in as `demo.admin@sentinelai.local` (Password: `AdminPassword123!`), unlocking the **Admin & RBAC** user management panel in addition to all analyst tools.

---

## 2. Component-by-Component Deep Dive

### Component 1: Security Gateway & Request Interceptor
- **Location**: `server/src/middleware/securityMiddleware.js`
- **Role**: Sits in front of every Express route, deeply inspecting incoming requests.
- **Key Capabilities**:
  1. Recursively extracts and inspects JSON bodies, URL-encoded forms, query parameters, and URL path parameters.
  2. Passes request inputs through the Deterministic Rule Engine, the AI Attack Classifier, and the Behavioral Telemetry engine.
  3. Fuses signals via the Dynamic Risk Engine.
  4. Automatically blocks malicious requests with **HTTP 403 Forbidden** before they can reach internal route handlers or databases.
  5. Asynchronously writes security telemetry documents to MongoDB via `SecurityEvent` without adding latency to the response.

### Component 2: Deterministic Rule Engine (24 Signatures)
- **Location**: `server/src/services/threatService.js`
- **Role**: Provides deterministic pattern recognition for explicit exploits.
- **Execution**: Sub-millisecond static regex inspection with zero unsafe evaluation.
- **Attack Vector Coverage**:
  - **SQL Injection (SQLi)**: Tautologies (`' OR 1=1`), `UNION SELECT`, stacked queries (`; DROP TABLE`), schema metadata extraction (`information_schema`), blind time-delays (`SLEEP(5)`).
  - **Cross-Site Scripting (XSS)**: Explicit `<script>` tags, inline event handlers (`onload`, `onerror`), JavaScript pseudo-protocol URIs (`javascript:alert(1)`), dangerous SVG attributes.
  - **Path Traversal / LFI**: Directory escape sequences (`../`, `..\`), URL-encoded variations (`%2e%2e%2f`), null byte terminations (`%00`).
  - **Command Injection**: Shell chaining operators (`|`, `;`, `&&`), subshell execution (`$(...)`, backticks), Windows drive traversal (`cmd.exe /c`), remote download pipes (`curl | sh`).

### Component 3: AI Application Attack Classifier
- **Location**: `ai-service/app/services/classifier.py`
- **Model**: Sub-word Character n-grams (`ngram_range=(2, 5)`, `analyzer="char_wb"`) + Balanced SGD Logistic Regression.
- **Performance**: **99.86% Accuracy**, **97.17% Macro F1** on 10,355 test instances.
- **Key Capability**: Detects obfuscated, fragmented, or zero-day variations that evade standard regex signatures.
- **Startup**: Loaded once into memory at FastAPI startup; evaluates inputs in $< 0.2$ milliseconds.

### Component 4: Behavioral Anomaly Detection (Isolation Forest)
- **Location**: `ai-service/app/services/anomaly.py` & `server/src/services/behaviourService.js`
- **Role**: Identifies automated bot attacks, credential stuffing, and brute-force scans.
- **Sliding-Window Metrics Tracked**:
  - `request_frequency`: Requests per 60-second window.
  - `burst_frequency`: Requests in peak 10-second window.
  - `failed_auth_count`: Authentication failures on specific entity.
  - `error_4xx_rate`: Proportion of 4xx responses received by client.
  - `path_entropy`: Diversity of endpoints explored (detects crawlers).
  - `avg_interval_ms`: Average inter-arrival arrival timing.
- **Model**: Isolation Forest trained on 20,000 synthetic behavioral samples (**99.92% ROC-AUC**).

### Component 5: Dynamic Risk Scoring & Decision Engine
- **Location**: `server/src/services/riskEngine.js`
- **Role**: Unifies multi-signal telemetry into a single bounded 0–100 risk score:
  $$	ext{Risk Score} = w_{	ext{rule}} S_{	ext{rule}} + w_{	ext{ai}} S_{	ext{ai}} + w_{	ext{anomaly}} S_{	ext{anomaly}} + w_{	ext{freq}} S_{	ext{freq}} + w_{	ext{auth}} S_{	ext{auth}}$$
- **Enforcement Floor Overrides**:
  - Critical deterministic rule match $\implies$ Risk Score $\ge 85$ (`BLOCK`).
  - High-confidence AI exploit ($\ge 0.95$) $\implies$ Risk Score $\ge 80$ (`BLOCK`).
  - Critical behavioral anomaly ($\ge 0.85$) $\implies$ Risk Score $\ge 80$ (`BLOCK`).
  - Repeated authentication lockout ($\ge 5$ failures) $\implies$ Risk Score $\ge 60$ (`MONITOR` / `BLOCK`).
- **Policy Decision**:
  - `0 – 29`: **ALLOW** (Clean request).
  - `30 – 59`: **MONITOR** (Suspicious traffic, telemetry flagged for analyst triage).
  - `60 – 100`: **BLOCK** (Intrusion intercepted, HTTP 403 returned).

### Component 6: Layer 3/4 Network IDS (CIC-IDS2017)
- **Location**: `ai-service/app/services/network_ids.py` (`POST /network/flow`)
- **Role**: Analyzes network flow statistics (packet rates, byte rates, SYN/ACK ratios).
- **Detects**: DoS SYN Floods, Port Scanning sweeps, and Volumetric bandwidth flooding.

### Component 7: Real-Time Cyber SOC Dashboard
- **Location**: `client/src/App.jsx`
- **Features**:
  - Dark Cyber SOC styling (`#0B0F19`).
  - Executive metric cards displaying total requests, blocked intrusions, and average risk level.
  - Interactive Recharts bar and donut charts.
  - Live security event feed with multi-criteria filtering by vector, severity, action, and keyword search.

### Component 8: Forensic Incident Triage & Resolution
- **Location**: `client/src/components/threats/ThreatDetailModal.jsx`
- **Role**: Enables security analysts to inspect full request telemetry, sanitize payload snippets (passwords automatically redacted), verify matching rule signatures, and toggle incident resolution with notes via `PATCH /api/threats/:id/status`.

### Component 9: Interactive Threat Sandbox
- **Location**: `client/src/components/sandbox/`
- **Role**: Allows manual payload construction and pre-configured attack preset evaluation against the live detection engines without triggering gateway blocks.
- **Presets Available**: SQLi Tautology, XSS Script Injections, Path Traversal probes, Command Injection pipes, and Benign clean inputs.

### Component 10: Admin & RBAC User Management
- **Location**: `client/src/components/admin/UserManagementView.jsx` & `server/src/controllers/adminController.js`
- **Role**: Dedicated panel for administrators to manage user accounts, assign roles (`USER`, `ANALYST`, `ADMIN`), toggle account status (`active`, `suspended`, `locked`), and manually unlock accounts locked by brute-force defenses.
- **Safety Guards**: Administrators cannot demote or delete their own accounts.

---

## 3. User Roles & Access Levels

| Feature / Endpoint | Guest (Unauthenticated) | Standard USER | SOC ANALYST | Platform ADMIN |
|---|:---:|:---:|:---:|:---:|
| **Public Health Check** | Yes | Yes | Yes | Yes |
| **Threat Sandbox Inspection** | Yes | Yes | Yes | Yes |
| **Authentication & Profile** | Login/Register | Yes | Yes | Yes |
| **View SOC Telemetry & Stats** | No | No | Yes | Yes |
| **Browse Threat Event Feed** | No | No | Yes | Yes |
| **Triage & Resolve Incidents** | No | No | Yes | Yes |
| **User Role & Status Management** | No | No | No | Yes |
| **Unlock Accounts & Reset Attempts**| No | No | No | Yes |
