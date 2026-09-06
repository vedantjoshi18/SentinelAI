# SentinelAI — End-to-End Live Demonstrations Guide

**Project**: SentinelAI  
**Subject**: Application Security and Intrusion Detection Platform  
**Purpose**: Step-by-step reproducible viva demonstration scripts.

---

## Prerequisites
Ensure all three services are running:
1. AI Service: `http://localhost:8000/health` (Reports `modelLoaded: true`, `anomalyModelLoaded: true`)
2. Express Server: `http://localhost:5000/api/health` (Reports `status: "ok"`)
3. SOC Dashboard: `http://localhost:5173`

---

## Flow 1: SQL Injection Attack Detection & Gateway Interception (HTTP 403)

### Objective
Demonstrate that an inbound SQL Injection payload is immediately identified by both the deterministic rule engine and AI classifier, triggering a risk score of 80+ and returning an automated HTTP 403 Forbidden with security context.

### Execution Command
```bash
curl -i -X POST http://localhost:5000/api/auth/login   -H "Content-Type: application/json"   -d '{"email": "admin@sentinelai.local", "password": "' OR 1=1 --"}'
```

### Expected Output
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "error": "Request blocked by SentinelAI Security Gateway",
  "threatType": "SQL_INJECTION",
  "severity": "HIGH",
  "riskScore": 85,
  "action": "BLOCK"
}
```

### Dashboard Reflection
1. Navigate to **SOC Overview**: Notice the *Intrusions Blocked* counter increments by 1.
2. Click **Threat Event Feed**: The blocked incident appears at the top of the audit log with an `SQL_INJECTION` tag and `BLOCK` status.

---

## Flow 2: Cross-Site Scripting (XSS) Interception

### Objective
Demonstrate deterministic detection of inline JavaScript event handler injections.

### Execution Command
```bash
curl -i -X POST http://localhost:5000/api/users/profile   -H "Content-Type: application/json"   -d '{"name": "<img src=x onerror=alert(document.cookie)>"}'
```

### Expected Output
```http
HTTP/1.1 403 Forbidden

{
  "success": false,
  "error": "Request blocked by SentinelAI Security Gateway",
  "threatType": "XSS",
  "severity": "HIGH",
  "riskScore": 85,
  "action": "BLOCK"
}
```

---

## Flow 3: Brute-Force Credential Stuffing & Account Lockout (HTTP 423)

### Objective
Demonstrate that 5 consecutive failed login attempts trigger the automated account lockout policy with HTTP 423 Locked.

### Execution Command
Run 5 failed login attempts with invalid credentials:
```bash
for i in {1..5}; do
  curl -s -X POST http://localhost:5000/api/auth/login     -H "Content-Type: application/json"     -d '{"email": "victim@sentinelai.local", "password": "WrongPassword!"}'
done
```

Then attempt a 6th login:
```bash
curl -i -X POST http://localhost:5000/api/auth/login   -H "Content-Type: application/json"   -d '{"email": "victim@sentinelai.local", "password": "WrongPassword!"}'
```

### Expected Output
```http
HTTP/1.1 423 Locked

{
  "success": false,
  "error": "Account temporarily locked due to excessive failed attempts. Try again in 15 minutes."
}
```

---

## Flow 4: Behavioral Anomaly Detection via Isolation Forest

### Objective
Demonstrate detection of high-frequency directory fuzzing crawlers using the AI anomaly service.

### Execution Command
```bash
curl -i -X POST http://localhost:8000/anomaly   -H "Content-Type: application/json"   -d '{
    "request_frequency": 120.0,
    "burst_frequency": 35.0,
    "failed_auth_count": 0,
    "error_4xx_rate": 0.85,
    "path_entropy": 4.2,
    "avg_interval_ms": 15.0
  }'
```

### Expected Output
```json
{
  "success": true,
  "is_anomaly": true,
  "anomaly_score": 0.92,
  "anomaly_level": "CRITICAL",
  "indicators": [
    "HIGH_REQUEST_VELOCITY",
    "HIGH_BURST_DENSITY",
    "ELEVATED_CLIENT_ERROR_RATE"
  ]
}
```

---

## Flow 5: Interactive Threat Sandbox Diagnostics

### Objective
Demonstrate manual deep packet security inspection in the web browser.

### Steps
1. Navigate to `http://localhost:5173`
2. Click **Threat Sandbox** in the top navigation bar.
3. Select the preset **SQL Injection — Tautology** or enter a custom payload:
   ```json
   {
     "query": "SELECT * FROM users WHERE id = 1 UNION SELECT null, username, password FROM users"
   }
   ```
4. Click **Execute Inspection**.
5. Observe the instant diagnostic breakdown:
   - Risk score gauge: `95/100` (Critical)
   - Action: `BLOCK`
   - Deterministic rule matches: `SQLI_UNION_SELECT`
   - AI classifier prediction: `SQL_INJECTION` with 99.8% confidence

---

## Flow 6: Administrator User Management & Account Unlocking

### Objective
Demonstrate server-side enforced RBAC controls and administrative lockout triage.

### Steps
1. Click **Demo Admin** in the dashboard topbar or sign in modal.
2. Notice the **Admin & RBAC** tab appears in the top navigation.
3. In the user management table:
   - Locate the locked account (`victim@sentinelai.local`).
   - Click the green **Unlock** button.
   - The account status immediately resets to `Active` and failed login attempts reset to `0`.
   - Change user roles between `USER`, `ANALYST`, and `ADMIN`.
