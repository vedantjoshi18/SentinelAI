# SentinelAI API Specification

## Foundation Endpoints (Phase 0)

### 1. Backend Health Check
- **Endpoint**: `GET /api/health`
- **Auth**: None
- **Response**:
```json
{
  "status": "ok"
}
```

### 2. AI Service Health Check
- **Endpoint**: `GET /health`
- **Auth**: None
- **Response**:
```json
{
  "status": "ok"
}
```

*Subsequent phases will document Auth, Threats, Logs, Predict, and Anomaly endpoints.*