# SentinelAI: AI-Powered Application Security & Intrusion Detection Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Phase](https://img.shields.io/badge/Status-Phase%200%20Foundation-emerald.svg)]()
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20FastAPI%20%7C%20MongoDB-purple.svg)]()

> A portfolio-grade, real-world security platform combining deterministic security rules, multi-class payload machine learning, behavioral anomaly detection, and automated risk scoring to protect web applications.

---

## 1. Project Overview & Problem Statement

Modern web applications face sophisticated, multi-vector attacks ranging from code injections (SQLi, XSS, Command Injection, Path Traversal) to automated credential stuffing and behavioral anomalies. Traditional Web Application Firewalls (WAFs) rely heavily on static signature pattern matching which can suffer from high false-positive rates or fail against obfuscated zero-day variations. Conversely, standalone AI classifiers lack operational security context, deterministic safeguards, and defense-in-depth guarantees.

**SentinelAI** bridges this gap by unifying:
1. **Deterministic Security Rules** for immediate high-confidence pattern detection.
2. **AI Attack Payload Classifier** using NLP vectorization (TF-IDF) and scikit-learn models to classify request payloads.
3. **Behavioral Anomaly Detection** using Isolation Forest to detect anomalous request bursts, failed authentication rates, and irregular access patterns.
4. **Dynamic Risk Engine** that synthesizes multiple security signals into a normalized 0–100 risk score and triggers automated policy actions (ALLOW, MONITOR, BLOCK).
5. **SOC-Inspired Security Dashboard** built in React for real-time threat analysis, audit logging, manual payload inspection, and role-based incident triage.

---

## 2. System Architecture & Flow

\\\
                    USER REQUEST
                         |
                         v
                 React Frontend
                         |
                         v
                Node.js + Express
                         |
                         v
             Authentication / Validation
                         |
                         v
                Security Middleware
                         |
              +----------+----------+
              |                     |
              v                     v
       Rule-Based Detection      AI Service (FastAPI)
                                    |
                         +----------+----------+
                         |                     |
                         v                     v
                  Attack Classifier      Anomaly Detector
                         |                     |
                         +----------+----------+
                                    |
                                    v
                              Risk Engine
                                    |
                    +---------------+---------------+
                    |               |               |
                    v               v               v
                  ALLOW          MONITOR           BLOCK
                                    |
                                    v
                              MongoDB Logs
                                    |
                                    v
                              React Dashboard
\\\

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios |
| **Backend API** | Node.js, Express.js, Mongoose, JWT, bcryptjs, Helmet, CORS, express-rate-limit |
| **AI Microservice** | Python 3.13, FastAPI, Uvicorn, scikit-learn, pandas, NumPy, joblib, Pydantic |
| **Database** | MongoDB |
| **DevOps & Testing** | Docker, Docker Compose, Supertest, Pytest, Node Test Runner |

---

## 4. Repository Structure

\\\
sentinelai/
├── client/              # React frontend (Vite + Tailwind CSS + Recharts)
├── server/              # Node.js Express backend (Middleware, Risk Engine, RBAC)
├── ai-service/          # Python FastAPI microservice (ML Models & Inferences)
├── ml/                  # Datasets, Jupyter notebooks, model training scripts
├── tests/               # Integration, security, and end-to-end tests
├── docs/                # Architectural, API, and viva documentation
├── docker-compose.yml   # Multi-container orchestration
├── .env.example         # Template environment variables
└── README.md            # Platform overview and documentation
\\\

---

## 5. Getting Started & Installation

### Prerequisites
- **Node.js**: v18+ (tested on Node v25)
- **Python**: v3.10+ (tested on Python 3.13)
- **MongoDB**: Local or MongoDB Atlas instance
- **Git**

### 1. Clone & Configure Environment
\\\ash
git clone <repository-url>
cd SentinelAI
cp .env.example .env
\\\

### 2. Backend Setup
\\\ash
cd server
npm install
npm run dev
\\\
Server runs at: \http://localhost:5000\
Health check: \http://localhost:5000/api/health\

### 3. AI Service Setup
\\\ash
cd ai-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
\\\
AI Service runs at: \http://127.0.0.1:8000\
Health check: \http://127.0.0.1:8000/health\

### 4. Frontend Client Setup
\\\ash
cd client
npm install
npm run dev
\\\
Client runs at: \http://localhost:5173\

---

## 6. Testing

### Run Server Tests
\\\ash
cd server
npm test
\\\

### Run AI Service Tests
\\\ash
cd ai-service
.\venv\Scripts\pytest
\\\

---

## 7. Limitations & Future Scope
- **Current Scope**: Focuses on HTTP payload attack classification (SQLi, XSS, Command Injection, Path Traversal) and user behavioral anomaly modeling.
- **Future Scope**: Integration with network-flow telemetry (e.g., CIC-IDS2017), automated honeypot traps, and streaming event pipelines (Kafka/Redis).

---

## 8. License
MIT License. Built for university micro-project viva and portfolio demonstration.
