# Implementation Plan: Phase 11 — React Security SOC Dashboard

**Status**: Ready to Execute  
**Spec Reference**: `docs/superpowers/specs/2026-09-06-phase11-soc-dashboard-design.md`  

---

## Task Breakdown

### Step 1: Client API Client & Authentication Context
- Create `client/src/services/api.js` (Axios client with Bearer token interceptor, stats, threats, inspect, auth endpoints).
- Create `client/src/context/AuthContext.jsx` (JWT token management, login/register/logout, and `loginAsDemoAnalyst()` helper).

### Step 2: Common UI & Layout Components
- Create `client/src/components/common/StatusBadge.jsx` (Severity and Policy Action badges).
- Create `client/src/components/common/AuthModal.jsx` (Login & Registration modal).
- Create `client/src/components/layout/Topbar.jsx` (System health badges, polling selector, refresh trigger, auth control).
- Create `client/src/components/layout/TabNavigation.jsx` (4-tab switcher).

### Step 3: SOC Overview Tab Components
- Create `client/src/components/dashboard/MetricCards.jsx` (4 KPI cards).
- Create `client/src/components/dashboard/RecentIncidentsTable.jsx` (Top recent critical alerts).

### Step 4: Threat Feed & Forensic Triage Components
- Create `client/src/components/threats/ThreatFilterBar.jsx` (Category, Severity, Action, Resolved filters).
- Create `client/src/components/threats/ThreatEventsTable.jsx` (Paginated event audit table).
- Create `client/src/components/threats/ThreatDetailModal.jsx` (Forensic inspector & triage notes form).

### Step 5: Attack Visualizations & Recharts Components
- Create `client/src/components/charts/ThreatCategoryBarChart.jsx` (Recharts BarChart of attack types).
- Create `client/src/components/charts/SeverityDistributionPie.jsx` (Recharts Donut chart of severity breakdown).

### Step 6: Interactive Threat Sandbox Components
- Create `client/src/components/sandbox/PayloadPresetSelector.jsx` (SQLi, XSS, Path Traversal, CMDi, Benign presets).
- Create `client/src/components/sandbox/CustomPayloadEditor.jsx` (Payload editor with JSON & Query inputs).
- Create `client/src/components/sandbox/DiagnosticInspector.jsx` (Live risk score meter, rule matches, AI scores).

### Step 7: Master App Integration
- Wire everything together into `client/src/App.jsx` with active tab switching and live polling.

### Step 8: Build Verification & Git Commit
- Run `npm run build` in `client/`.
- Verify server tests with `npm test`.
- Commit Phase 11 to git and generate Section 22 report.
