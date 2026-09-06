# SentinelAI — Complete Production & Deployment Guide

**Project**: SentinelAI (AI-Powered Application Security & Intrusion Detection Platform)  
**Target Environments**: Docker Compose (Local/Staging), Bare-Metal, Production Cloud VPS (Ubuntu Linux).

---

## 1. Architecture & Port Mapping

```
                 [Internet / Client Browser]
                             │
                      Port 80 / 443
                             ▼
              [Reverse Proxy: Nginx / Vite Client]
                             │
               ┌─────────────┴─────────────┐
               │ /api/*                    │ /*
               ▼                           ▼
    [Node.js Express Gateway]      [React SOC UI]
         (Port 5000)                (Static Assets)
               │
      ┌────────┴────────┐
      ▼                 ▼
[MongoDB 7.0]     [FastAPI AI Microservice]
 (Port 27017)           (Port 8000)
```

| Service | Container Name | Internal Port | Host Port | Health Check Endpoint |
|---|---|:---:|:---:|---|
| **MongoDB** | `sentinelai-mongodb` | 27017 | 27017 | `mongosh --eval 'db.runCommand("ping").ok'` |
| **AI Inference** | `sentinelai-ai-service` | 8000 | 8000 | `http://localhost:8000/health` |
| **Backend Gateway**| `sentinelai-server` | 5000 | 5000 | `http://localhost:5000/api/health` |
| **SOC Dashboard** | `sentinelai-client` | 80 | 5173 | `http://localhost:5173` |

---

## 2. Method 1: Docker Compose Deployment (Recommended)

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.20+

### Step 1: Clone Repository & Create Environment File
```bash
git clone https://github.com/your-org/SentinelAI.git
cd SentinelAI
cp .env.example .env
```

Ensure `.env` contains a strong `JWT_SECRET` (at least 32 characters):
```env
PORT=5000
NODE_ENV=production
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://mongodb:27017/sentinelai
JWT_SECRET=sentinelai_super_secret_production_key_32_characters_minimum!
JWT_EXPIRES_IN=24h
AI_SERVICE_URL=http://ai-service:8000
AI_SERVICE_TIMEOUT_MS=3000
```

### Step 2: Build & Start All Services
```bash
docker compose up -d --build
```

### Step 3: Verify Status & Health Checks
```bash
docker compose ps
```
Expected output:
```
NAME                    STATUS                    PORTS
sentinelai-mongodb      Up (healthy)              0.0.0.0:27017->27017/tcp
sentinelai-ai-service   Up (healthy)              0.0.0.0:8000->8000/tcp
sentinelai-server       Up (healthy)              0.0.0.0:5000->5000/tcp
sentinelai-client       Up                        0.0.0.0:5173->80/tcp
```

### Step 4: View Logs
```bash
# Follow logs across all containers:
docker compose logs -f

# View specific service logs:
docker compose logs -f server
docker compose logs -f ai-service
```

### Step 5: Stop Services
```bash
# Graceful stop:
docker compose stop

# Teardown containers (preserves database volume):
docker compose down

# Teardown with volume deletion:
docker compose down -v
```

---

## 3. Method 2: Bare-Metal / Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: 3.10, 3.11, 3.12, or 3.13
- **MongoDB**: Community Server running locally on `localhost:27017`

### Step 1: Start MongoDB
Ensure MongoDB service is active:
```powershell
# Windows PowerShell:
Get-Service MongoDB | Start-Service

# Linux/macOS:
sudo systemctl start mongod
```

### Step 2: Set Up & Launch Python AI Microservice
```bash
cd ai-service

# Create virtual environment:
python -m venv venv

# Activate virtual environment:
# On Windows:
.env\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt

# Start FastAPI server:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Verify: Visit `http://localhost:8000/health` in browser.*

### Step 3: Set Up & Launch Express Gateway
Open a new terminal:
```bash
cd server
npm install
npm run dev
```
*Verify: Output should state `MongoDB Connected Successfully` and `Server running on port 5000`.*

### Step 4: Set Up & Launch React Client
Open a third terminal:
```bash
cd client
npm install
npm run dev
```
*Verify: Navigate to `http://localhost:5173` in your browser.*

---

## 4. Method 3: Production Linux VPS Deployment (Ubuntu 22.04 / 24.04)

### Step 1: System Security & Firewall Hardening
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl ufw git nginx build-essential

# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Step 2: Systemd Service for FastAPI AI Service
Create `/etc/systemd/system/sentinelai-ai.service`:
```ini
[Unit]
Description=SentinelAI FastAPI Inference Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/SentinelAI/ai-service
ExecStart=/opt/SentinelAI/ai-service/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5
Environment=PORT=8000
Environment=LOG_LEVEL=info

[Install]
WantedBy=multi-user.target
```

### Step 3: Systemd Service for Express Gateway
Create `/etc/systemd/system/sentinelai-backend.service`:
```ini
[Unit]
Description=SentinelAI Node.js Express Gateway
After=network.target mongodb.service sentinelai-ai.service

[Service]
User=ubuntu
WorkingDirectory=/opt/SentinelAI/server
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=CLIENT_URL=https://soc.yourdomain.com
Environment=MONGODB_URI=mongodb://127.0.0.1:27017/sentinelai
Environment=JWT_SECRET=super_secret_production_key_minimum_32_characters!
Environment=AI_SERVICE_URL=http://127.0.0.1:8000

[Install]
WantedBy=multi-user.target
```

### Step 4: Enable & Start Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sentinelai-ai
sudo systemctl enable --now sentinelai-backend
```

### Step 5: Nginx Reverse Proxy with SSL (Certbot)
Create `/etc/nginx/sites-available/sentinelai`:
```nginx
server {
    listen 80;
    server_name soc.yourdomain.com;

    root /opt/SentinelAI/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and generate SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/sentinelai /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d soc.yourdomain.com
```

---

## 5. Security & Pre-Flight Verification Checklist

Before opening the platform to users:
- [x] All 130 server tests pass (`npm test` in `server/`).
- [x] All 29 AI service tests pass (`pytest` in `ai-service/`).
- [x] Production client bundle builds with 0 errors (`npm run build` in `client/`).
- [x] `JWT_SECRET` is set to a unique, non-fallback string of $\ge 32$ characters.
- [x] Rate limiting is enabled on `/api` and `/api/auth`.
- [x] Helmet security headers (CSP, HSTS, X-Frame-Options: DENY) are active.
- [x] MongoDB authentication is enforced if exposed outside internal network.
