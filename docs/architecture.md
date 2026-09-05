# SentinelAI Architecture & System Design

## High-Level Pipeline

```
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
```

## Core Subsystems
1. **Frontend (Client)**: React, Vite, Tailwind CSS, Recharts.
2. **Gateway / Application Server**: Node.js, Express, Helmet, CORS, JWT, rate limiting.
3. **AI Inference Service**: Python FastAPI, Uvicorn, scikit-learn, joblib.
4. **Data Persistence**: MongoDB with Mongoose ODM for Users, SecurityEvents, and UserBehaviour.