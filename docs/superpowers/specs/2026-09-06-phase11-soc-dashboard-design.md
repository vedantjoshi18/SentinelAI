# Design Specification: Phase 11 — React Security SOC Dashboard

**Date**: 2026-09-06  
**Status**: Approved  
**Target Module**: `client/`  

---

## 1. Overview
Phase 11 transforms the minimal Phase 0 health probe page into a professional, enterprise-grade Cyber Security Operations Center (SOC) Dashboard. The dashboard provides real-time situational awareness, visual attack analytics via Recharts, an interactive threat investigation stream with forensic modals and triage, and a live manual payload inspection sandbox.

---

## 2. Architecture & Layout
- **Visual Design**: High-contrast Dark Cyber SOC aesthetic:
  - Background: `#0B0F19` (deep space slate)
  - Card Surfaces: `#111827` (slate-900)
  - Border Accents: `#1F2937` (slate-800)
  - Cyber Highlights: Cyan (`#06B6D4`), Emerald (`#10B981`), Amber (`#F59E0B`), Rose (`#F43F5E`), Indigo (`#6366F1`)
- **Single-Page Multi-Tab Structure**:
  - **Top Bar**: System status indicators (Express API, FastAPI AI Service, Isolation Forest), polling interval toggle (`5s`, `10s`, `30s`, `Off`), manual **"Refresh Now"** trigger, and Authentication Bar (JWT status, "Quick Demo Analyst" sign-in, and Logout).
  - **Tab Navigation**:
    1. `Overview & KPIs`
    2. `Threat Event Stream`
    3. `Visualizations & Analytics`
    4. `Threat Sandbox`

---

## 3. Core Component Hierarchy
```text
client/src/
├── App.jsx                                  # Master layout, tab router, auto-polling coordinator
├── context/
│   └── AuthContext.jsx                      # JWT session management, demo analyst shortcut, auth headers
├── services/
│   └── api.js                               # Axios client with JWT interceptor & backend endpoints
├── components/
│   ├── layout/
│   │   ├── Topbar.jsx                       # Header, health pills, polling dropdown, auth status
│   │   └── TabNavigation.jsx                # Tab selector with active indicator and badge counters
│   ├── dashboard/
│   │   ├── MetricCards.jsx                  # 4 KPI cards (Total Events, Blocked, Monitored, Avg Risk)
│   │   └── RecentIncidentsTable.jsx         # Top 5 most critical recent events with fast triage link
│   ├── threats/
│   │   ├── ThreatFilterBar.jsx              # Filters by threatType, severity, action, resolved
│   │   ├── ThreatEventsTable.jsx            # Interactive paginated threat audit table
│   │   └── ThreatDetailModal.jsx            # Deep forensics inspector (Rules, AI, Factors, Triage update)
│   ├── charts/
│   │   ├── ThreatCategoryBarChart.jsx       # Recharts bar chart of threat types
│   │   └── SeverityDistributionPie.jsx      # Recharts donut chart of severity tiers
│   ├── sandbox/
│   │   ├── PayloadPresetSelector.jsx        # Attack presets (SQLi, XSS, Path Traversal, CMDi, Benign)
│   │   ├── CustomPayloadEditor.jsx          # Editable JSON/Text request builder
│   │   └── DiagnosticInspector.jsx          # Live gateway analysis results (Score, Action, Rules, AI)
│   └── common/
│       ├── AuthModal.jsx                    # Login / Registration modal with role selection
│       └── StatusBadge.jsx                  # Styled severity and action badges with glowing accents
```

---

## 4. API Endpoints Consumed
1. `GET /api/threats/stats`: Aggregated metrics (total, blocked, monitored, allowed, category counts, severity distribution).
2. `GET /api/threats`: Paginated audit log with multi-attribute filtering.
3. `GET /api/threats/:id`: Individual forensic telemetry record.
4. `PATCH /api/threats/:id/status`: Analyst triage endpoint (`resolved`, `notes`).
5. `POST /api/threats/inspect`: Deep payload inspection sandbox.
6. `GET /api/health`: Microservice health status.
7. `POST /api/auth/login` & `POST /api/auth/register`: Authentication and JWT generation.

---

## 5. Verification Plan
- Build check: `npm run build` in `client/` passes cleanly with zero errors.
- End-to-end browser walkthrough:
  1. Health status pills all green.
  2. "Quick Demo Analyst" logs in with JWT token and unlocks audit data.
  3. KPI cards populate from live MongoDB data.
  4. Threat Category Bar Chart & Severity Pie Chart render accurately.
  5. Threat Event table filters and forensic triage updates work.
  6. Threat Sandbox evaluates attack payloads and displays risk score breakdowns in real-time.
