# SentinelAI README Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul `README.md` into a comprehensive, portfolio-grade, and viva-ready technical showcase and 11-feature testing guide for the SentinelAI platform.

**Architecture:** Single consolidated master `README.md` file featuring structured tables, clean Mermaid architecture diagrams, copy-paste shell commands (PowerShell + Bash), and clear cross-links to specialized guides in `docs/`.

**Tech Stack:** GitHub Flavored Markdown, Mermaid diagrams, Shell/PowerShell scripts, HTTP payload snippets.

## Global Constraints

- Retain high readability with clear table of contents and anchor navigation.
- All CLI commands must be runnable out-of-the-box on Windows PowerShell and Linux/macOS bash.
- Include accurate port numbers (`5173`, `5000`, `8000`, `27017`), exact pre-configured credentials, and working endpoint paths.
- Avoid broken links; verify all file links point to valid repository files.
- Zero placeholder text (`TODO`, `TBD`).

---

### Task 1: Structure Core Narrative & System Architecture (Sections 1-5)

**Files:**
- Modify: `README.md:1-172`
- Reference: `docs/superpowers/specs/2026-09-07-readme-redesign.md`

**Interfaces:**
- Consumes: Spec sections 1 through 5, `docker-compose.yml`, `server/src/config/db.js`.
- Produces: Header, Badges, Table of Contents, Executive Overview, Architecture & Mermaid Pipeline diagram, Zero-Friction Setup (In-Memory DB fallback + demo credentials), and Two Launch Modes (Docker Compose & Bare-Metal).

- [ ] **Step 1: Draft Sections 1–5 content**
  - Section 1: Title, Tagline, Badges (Node 18+, Python 3.10+ / FastAPI, React 18 / Vite, MongoDB 7 + In-Memory Fallback, Docker, 100% Tests Pass, MIT License), Table of Contents.
  - Section 2: Executive Overview, The WAF & Standalone AI problem statement, SentinelAI's defense-in-depth solution.
  - Section 3: Architecture & Security Pipeline with Mermaid sequence/flowchart, Component Matrix table.
  - Section 4: Zero-Friction Setup, In-Memory DB automatic fallback, Pre-seeded demo credentials (`demo.admin@sentinelai.local` and `demo.analyst@sentinelai.local`).
  - Section 5: Getting Started (Option A: `docker compose up --build`, Option B: Bare-Metal 4-step startup).

- [ ] **Step 2: Commit draft of foundation sections**

```bash
git add README.md
git commit -m "docs: draft core architecture, overview, and quickstart in README"
```

---

### Task 2: Build the 11-Feature Hands-On Testing Guide (Section 6)

**Files:**
- Modify: `README.md`
- Reference: `docs/demonstrations.md`, `tests/`, `server/tests/`

**Interfaces:**
- Consumes: `docs/demonstrations.md`, server test suites, AI test suites.
- Produces: Complete automated test runner instructions and 11 end-to-end interactive testing recipes (CLI curl commands + UI verification steps).

- [ ] **Step 1: Draft automated test runner section**
  - Server tests: `cd server && npm test` (130 tests passing).
  - AI tests: `cd ai-service && pytest` (29 tests passing).
  - Client build: `cd client && npm run build`.

- [ ] **Step 2: Draft the 11 feature test recipes**
  - Feature 1: SQL Injection (SQLi) Detection & Gateway 403 Blocking.
  - Feature 2: Cross-Site Scripting (XSS) & Path Traversal / LFI Interception.
  - Feature 3: Brute-Force Credential Stuffing & Account Lockout (HTTP 423).
  - Feature 4: Behavioral Anomaly Detection via Isolation Forest (`POST /anomaly`).
  - Feature 5: Interactive Threat Sandbox (Web UI deep-packet analysis).
  - Feature 6: SOC Live Threat Feed & Forensic Incident Triage.
  - Feature 7: Attack Analytics & Recharts Telemetry Visualizations.
  - Feature 8: Deterministic WAF Rule Catalog (24 signatures).
  - Feature 9: Access Governance & Administrative RBAC (User unlock, roles).
  - Feature 10: System & Microservice Cluster Health Monitoring.
  - Feature 11: Network IDS Layer 3/4 Flow Classifier (`POST /api/network/flow`).

- [ ] **Step 3: Commit testing guide additions**

```bash
git add README.md
git commit -m "docs: add 11-feature testing guide and test commands to README"
```

---

### Task 3: Draft ML Methodology, API Reference, Hardening & Deep Links (Sections 7-11)

**Files:**
- Modify: `README.md`
- Reference: `docs/ml-methodology.md`, `docs/PLATFORM_GUIDE.md`, `docs/security.md`

**Interfaces:**
- Consumes: Evaluation results from `ml/evaluation/results/`, OpenAPI endpoints, security controls in `server/src/app.js`.
- Produces: Technical ML benchmark tables, Defensive Risk Floor logic, API endpoint reference tables, Monorepo directory tree, Security Hardening summary, and Documentation cross-links.

- [ ] **Step 1: Draft Sections 7–11 content**
  - Section 7: Key ML & Security Methodology (TF-IDF + Logistic Regression benchmark vs Random Forest, Isolation Forest vs One-Class SVM benchmark, Dynamic Risk Scoring & Risk Floors).
  - Section 8: API Reference Summary (Express Gateway endpoints and FastAPI AI microservice endpoints).
  - Section 9: Monorepo Architecture & Directory Layout.
  - Section 10: Security Hardening & Production Compliance (Helmet, NoSQL stripping, ReDoS guards, rate limits).
  - Section 11: Documentation & Viva Defense Deep Links (`PLATFORM_GUIDE.md`, `viva.md`, `demonstrations.md`, `DEPLOYMENT_GUIDE.md`, `openapi.yaml`).

- [ ] **Step 2: Commit final documentation sections**

```bash
git add README.md
git commit -m "docs: add ML benchmarks, API reference, and documentation links to README"
```

---

### Task 4: Complete Document Verification & Polish

**Files:**
- Verify: `README.md`

**Interfaces:**
- Consumes: Complete `README.md`.
- Produces: Verified, cleanly formatted, 0-broken-links README ready for presentation.

- [ ] **Step 1: Verify all links and relative file paths**
  - Check that all referenced file links (`docs/PLATFORM_GUIDE.md`, etc.) resolve.
  - Verify Mermaid diagram rendering syntax.
  - Confirm consistent casing, formatting, and markdown lint standards.

- [ ] **Step 2: Final Git Commit**

```bash
git add README.md
git commit -m "docs: complete production-grade README.md overhaul"
```
