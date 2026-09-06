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

---

## Authentication & Authorization Endpoints (Phase 1)

### 3. User Registration
- **Endpoint**: `POST /api/auth/register`
- **Auth**: None
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@sentinel.ai",
  "password": "StrongPassword123!",
  "role": "USER" // Optional: "USER", "ANALYST", "ADMIN" (default: "USER")
}
```
- **Responses**:
  - `201 Created`: User successfully registered; returns JWT token and user profile (passwordHash omitted).
  - `400 Bad Request`: Input validation failed.
  - `409 Conflict`: Email address already registered.

### 4. User Login
- **Endpoint**: `POST /api/auth/login`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "jane.doe@sentinel.ai",
  "password": "StrongPassword123!"
}
```
- **Responses**:
  - `200 OK`: Successful authentication; returns JWT token and user profile.
  - `400 Bad Request`: Missing credentials.
  - `401 Unauthorized`: Invalid credentials (decrements remaining attempts).
  - `423 Locked`: Account temporarily locked after 5 consecutive failed attempts.

### 5. Current Authenticated User Profile
- **Endpoint**: `GET /api/auth/me`
- **Auth**: Bearer Token (`Authorization: Bearer <token>`)
- **Responses**:
  - `200 OK`: Returns authenticated user profile.
  - `401 Unauthorized`: Missing, invalid, or expired token.

### 6. RBAC Role Endpoints
- **Endpoint**: `GET /api/users/profile`
  - **Roles**: `USER`, `ANALYST`, `ADMIN`
- **Endpoint**: `GET /api/users/analyst/metrics`
  - **Roles**: `ANALYST`, `ADMIN`
- **Endpoint**: `GET /api/users/admin/overview`
  - **Roles**: `ADMIN`
- **Responses**:
  - `200 OK`: Access granted.
  - `403 Forbidden`: Insufficient role permissions.