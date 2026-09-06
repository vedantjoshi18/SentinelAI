# SentinelAI — Viva & Oral Defense Preparation Guide

**Project**: SentinelAI (AI-Powered Application Security & Intrusion Detection Platform)  
**Author**: SentinelAI Core Security Team  
**Architecture**: Monorepo (`client/`, `server/`, `ai-service/`, `ml/`, `tests/`, `docs/`)

---

## 1. Executive Summary & Problem Formulation

### Q: What problem does SentinelAI solve?
**Answer**: Modern web applications face sophisticated, multi-vector attacks spanning Layer 7 application exploitation (SQLi, XSS, Path Traversal, Command Injection) and behavioral anomalies (brute-force credential stuffing, volumetric API flooding, endpoint fuzzing). Traditional WAFs rely exclusively on rigid regex pattern matching, resulting in high false negatives on obfuscated payloads and zero protection against distributed behavioral anomalies. Pure machine-learning approaches, conversely, introduce inference latency and susceptibility to adversarial perturbations. SentinelAI resolves this dilemma through a **hybrid multi-stage defense-in-depth architecture**:
1. **Deterministic Rule Engine (24 Signatures)**: Sub-millisecond regex pattern matching for immediate interception of unambiguous attacks.
2. **AI Attack Classifier (Sub-word TF-IDF + SGD Classifier)**: 99.86% accuracy detecting obfuscated and zero-day variations.
3. **Behavioral Anomaly Detector (Isolation Forest)**: Real-time 60s sliding window analyzing velocity, bursts, auth failures, 4xx rates, entropy, and arrival intervals.
4. **Dynamic Risk Engine**: Mathematically bounds risk $\in [0, 100]$ using weighted multi-signal fusion with critical floor overrides.
5. **Real-time Cyber SOC Dashboard**: Dark-mode telemetry, forensic triage, attack sandbox, and role-based user administration.

---

## 2. Machine Learning Justifications & Benchmarks

### Q: Why did you choose Logistic Regression with sub-word character n-grams instead of Deep Learning (BERT, LSTM, CNN)?
**Answer**:
1. **Inference Latency Floor**: In an active HTTP gateway interceptor, latency budget per request is strictly $< 5$ milliseconds. Balanced Logistic Regression with sub-word character n-grams evaluates in **0.18 milliseconds**, whereas a transformer (such as SecBERT) requires 30–80 milliseconds per request and significant GPU memory.
2. **Obfuscation Robustness**: Character n-grams (`ngram_range=(2, 5)`, `analyzer="char_wb"`) capture fragmented attack tokens across word boundaries, recognizing obfuscations like `UN/**/ION` or `1' OR '1'='1` without requiring full word dictionary presence.
3. **Empirical Superiority in Benchmark**: In empirical benchmark evaluations against Random Forest on 10,355 test instances:
   - **Logistic Regression**: **99.86% Accuracy**, **97.17% Macro F1**, **84.4% Precision on Command Injection**.
   - **Random Forest**: 97.72% Accuracy, 83.30% Macro F1, and only 11.2% Precision on Command Injection (high false alarm rate).

### Q: Why Isolation Forest for Behavioral Anomaly Detection instead of One-Class SVM or Autoencoders?
**Answer**:
1. **Linear Time Complexity $O(n \log n)$**: Isolation Forest isolates anomalies by randomly partitioning feature values; anomalous bursts require significantly fewer partitions to isolate than nominal clusters.
2. **Zero In-Memory Model Drift**: One-Class SVM suffers from $O(n^2)$ to $O(n^3)$ training complexity and sensitivity to hyperparameter $\nu$. In empirical testing on our 20,000-sample behavioral dataset, Isolation Forest attained **99.92% ROC-AUC** with **100% Precision**, isolating brute force and fuzzing attacks with zero false positives.

---

## 3. Architecture & Gateway Security

### Q: How does SentinelAI handle AI service failure?
**Answer**: Through **graceful degradation and fail-safe autonomy**:
- Express communicates with FastAPI via `aiClient.js` with a strict 3000ms timeout.
- If FastAPI is offline or restarts, `aiClient` catches network connection errors (`ECONNREFUSED`, `ETIMEDOUT`) and returns a safe fallback payload (`available: false`).
- The **Deterministic Rule Engine continues enforcing all 24 security signatures** without interruption. The application gateway never crashes or allows attacks through due to AI microservice downtime.

### Q: How is account lockout protected against Denial of Service?
**Answer**:
- Account lockout triggers after 5 consecutive failed login attempts on a specific email.
- The lockout window is strictly time-bounded (15 minutes).
- Administrative users can manually reset failed attempts and unlock accounts via `POST /api/admin/users/:id/unlock`.
- The rate limiter also enforces IP-level bounds (20 attempts / 15 minutes) to prevent single-source credential flooding across multiple accounts.

---

## 4. Key Defense Metrics Summary Table

| Metric | Target Class / Subsystem | Value | Verification |
|---|---|---|---|
| **L7 Classifier Accuracy** | Overall Test Set (10,355 samples) | **99.86%** | `ml/evaluation/results/` |
| **L7 Macro F1-Score** | 5-Class Balance (SQLi, XSS, Path, CMDi, Normal) | **97.17%** | Scikit-Learn Classification Report |
| **Anomaly ROC-AUC** | Isolation Forest Behavioral Anomaly | **99.92%** | `tests/test_anomaly.py` |
| **Server Test Coverage**| Gateway, Auth, Rules, Risk, Audit, Admin, Hardening | **130 Tests Passing** | `npm test` in `server/` |
| **AI Test Coverage** | Prediction, Anomaly, Network IDS, Health | **29 Tests Passing** | `pytest` in `ai-service/` |
| **Client Bundle** | React 18, Vite, Tailwind CSS, Recharts | **0 Build Errors** | `npm run build` in `client/` |
