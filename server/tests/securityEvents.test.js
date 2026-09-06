const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');
const SecurityEvent = require('../src/models/SecurityEvent');
const { logSecurityEvent } = require('../src/services/eventLogger');
const { setupMockDb, clearMockDb, getEvents } = require('./mockDb');
const { resetFrequencyHistory } = require('../src/middleware/rateLimiter');

describe('Phase 8: Security Event Logging & Audit APIs Test Suite', () => {
  let analystToken;
  let adminToken;
  let userToken;

  before(async () => {
    setupMockDb();
  });

  beforeEach(async () => {
    clearMockDb();
    resetFrequencyHistory();

    // Create test accounts
    const analystUser = await User.create({
      name: 'SOC Analyst',
      email: 'analyst@sentinelai.local',
      passwordHash: 'hashed_password',
      role: 'ANALYST',
    });

    const adminUser = await User.create({
      name: 'Security Admin',
      email: 'admin@sentinelai.local',
      passwordHash: 'hashed_password',
      role: 'ADMIN',
    });

    const standardUser = await User.create({
      name: 'Standard User',
      email: 'user@sentinelai.local',
      passwordHash: 'hashed_password',
      role: 'USER',
    });

    analystToken = jwt.sign(
      { id: analystUser._id, email: analystUser.email, role: 'ANALYST' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: 'ADMIN' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { id: standardUser._id, email: standardUser.email, role: 'USER' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('1. Security Event Logger Unit Tests', () => {
    test('should persist complete security telemetry document into MongoDB', async () => {
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/test/query',
        ip: '192.168.1.100',
        headers: { 'user-agent': 'Mozilla/5.0 SentinelBrowser' },
        body: { query: 'SELECT * FROM users' },
      };

      const mockContext = {
        threatType: 'SQL_INJECTION',
        riskScore: 85,
        severity: 'CRITICAL',
        action: 'BLOCK',
        factors: ['CRITICAL_RULE_MATCH_FLOOR'],
        breakdown: { ai: 90, rule: 100, anomaly: 0, failedAuth: 0, frequency: 0, history: 0 },
        ruleMatches: ['SQLI_TAUTOLOGY'],
        ruleSeverity: 'CRITICAL',
        aiPrediction: { threatType: 'SQL_INJECTION', confidence: 0.98, modelVersion: 'v1' },
        telemetry: { clientIp: '192.168.1.100', requestFrequency: 3, failedAuthAttempts: 0 },
      };

      const event = await logSecurityEvent(mockContext, mockReq);

      assert.ok(event !== null);
      assert.strictEqual(event.threatType, 'SQL_INJECTION');
      assert.strictEqual(event.riskScore, 85);
      assert.strictEqual(event.severity, 'CRITICAL');
      assert.strictEqual(event.action, 'BLOCK');
      assert.strictEqual(event.ip, '192.168.1.100');
      assert.strictEqual(event.method, 'POST');
      assert.strictEqual(event.path, '/api/test/query');
      assert.strictEqual(event.resolved, false);
      assert.ok(event.payloadSnippet.includes('SELECT * FROM users'));
    });

    test('should sanitize sensitive password fields from payload snippet', async () => {
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/auth/login',
        body: {
          email: 'victim@target.com',
          password: 'SuperSecretPasswordDoNotLog!',
        },
      };

      const mockContext = {
        threatType: 'NORMAL',
        riskScore: 5,
        severity: 'LOW',
        action: 'ALLOW',
      };

      const event = await logSecurityEvent(mockContext, mockReq);

      assert.ok(event !== null);
      assert.ok(event.payloadSnippet.includes('victim@target.com'));
      assert.ok(!event.payloadSnippet.includes('SuperSecretPasswordDoNotLog!'));
    });
  });

  describe('2. Automated Security Event Logging via Security Gateway', () => {
    test('should automatically log security event when gateway BLOCKS an attack', async () => {
      // Send attack that triggers gateway BLOCK
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "admin' OR 1=1 --",
          password: 'Password123!',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.blocked, true);

      // Verify event was saved to database
      const events = getEvents();
      assert.ok(events.length >= 1);

      const blockedEvent = events.find((e) => e.action === 'BLOCK');
      assert.ok(blockedEvent !== undefined);
      assert.strictEqual(blockedEvent.threatType, 'SQL_INJECTION');
      assert.strictEqual(blockedEvent.severity, 'HIGH');
      assert.ok(blockedEvent.riskScore >= 65);
    });
  });

  describe('3. SOC Audit Query API (GET /api/threats)', () => {
    beforeEach(async () => {
      // Seed test events
      await SecurityEvent.create({
        ip: '10.0.0.1',
        method: 'POST',
        path: '/api/auth/login',
        threatType: 'SQL_INJECTION',
        riskScore: 85,
        severity: 'CRITICAL',
        action: 'BLOCK',
        resolved: false,
      });

      await SecurityEvent.create({
        ip: '10.0.0.2',
        method: 'POST',
        path: '/api/comments',
        threatType: 'XSS',
        riskScore: 90,
        severity: 'CRITICAL',
        action: 'BLOCK',
        resolved: false,
      });

      await SecurityEvent.create({
        ip: '10.0.0.3',
        method: 'GET',
        path: '/api/files?doc=../../etc/passwd',
        threatType: 'PATH_TRAVERSAL',
        riskScore: 65,
        severity: 'HIGH',
        action: 'BLOCK',
        resolved: true,
      });

      await SecurityEvent.create({
        ip: '10.0.0.4',
        method: 'GET',
        path: '/api/profile',
        threatType: 'NORMAL',
        riskScore: 10,
        severity: 'LOW',
        action: 'ALLOW',
        resolved: false,
      });
    });

    test('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/threats');
      assert.strictEqual(res.status, 401);
    });

    test('should reject standard USER with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/threats')
        .set('Authorization', `Bearer ${userToken}`);

      assert.strictEqual(res.status, 403);
    });

    test('should allow ANALYST role to retrieve paginated threat events', async () => {
      const res = await request(app)
        .get('/api/threats?page=1&limit=10')
        .set('Authorization', `Bearer ${analystToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.pagination.total, 4);
      assert.strictEqual(res.body.events.length, 4);
    });

    test('should allow ADMIN role to filter events by threatType', async () => {
      const res = await request(app)
        .get('/api/threats?threatType=SQL_INJECTION')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.events.length, 1);
      assert.strictEqual(res.body.events[0].threatType, 'SQL_INJECTION');
    });

    test('should filter events by severity', async () => {
      const res = await request(app)
        .get('/api/threats?severity=CRITICAL')
        .set('Authorization', `Bearer ${analystToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.events.length, 2);
      for (const ev of res.body.events) {
        assert.strictEqual(ev.severity, 'CRITICAL');
      }
    });

    test('should filter events by action', async () => {
      const res = await request(app)
        .get('/api/threats?action=ALLOW')
        .set('Authorization', `Bearer ${analystToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.events.length, 1);
      assert.strictEqual(res.body.events[0].action, 'ALLOW');
    });

    test('should support pagination limits', async () => {
      const res = await request(app)
        .get('/api/threats?page=1&limit=2')
        .set('Authorization', `Bearer ${analystToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.pagination.limit, 2);
      assert.strictEqual(res.body.pagination.totalPages, 2);
      assert.strictEqual(res.body.events.length, 2);
    });
  });

  describe('4. SOC Overview Summary Metrics (GET /api/threats/stats)', () => {
    beforeEach(async () => {
      await SecurityEvent.create({
        ip: '1.1.1.1',
        threatType: 'SQL_INJECTION',
        severity: 'CRITICAL',
        action: 'BLOCK',
        riskScore: 95,
      });
      await SecurityEvent.create({
        ip: '1.1.1.2',
        threatType: 'XSS',
        severity: 'HIGH',
        action: 'BLOCK',
        riskScore: 75,
      });
      await SecurityEvent.create({
        ip: '1.1.1.3',
        threatType: 'NORMAL',
        severity: 'LOW',
        action: 'ALLOW',
        riskScore: 5,
      });
    });

    test('should reject unauthorized access to stats', async () => {
      const res = await request(app).get('/api/threats/stats');
      assert.strictEqual(res.status, 401);
    });

    test('should return aggregated SOC statistics to ANALYST', async () => {
      const res = await request(app)
        .get('/api/threats/stats')
        .set('Authorization', `Bearer ${analystToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.stats.totalEvents, 3);
      assert.strictEqual(res.body.stats.blockedCount, 2);
      assert.strictEqual(res.body.stats.allowedCount, 1);
      assert.strictEqual(res.body.stats.byThreatType.SQL_INJECTION, 1);
      assert.strictEqual(res.body.stats.byThreatType.XSS, 1);
      assert.strictEqual(res.body.stats.bySeverity.CRITICAL, 1);
      assert.strictEqual(res.body.stats.bySeverity.HIGH, 1);
      assert.ok(Array.isArray(res.body.stats.recentThreats));
      assert.strictEqual(res.body.stats.recentThreats.length, 2);
    });
  });

  describe('5. Event Triage & Incident Resolution', () => {
    let testEventId;

    beforeEach(async () => {
      const ev = await SecurityEvent.create({
        ip: '10.0.0.99',
        threatType: 'COMMAND_INJECTION',
        severity: 'CRITICAL',
        action: 'BLOCK',
        riskScore: 100,
        resolved: false,
      });
      testEventId = ev._id;
    });

    test('GET /api/threats/:id should retrieve single security event details', async () => {
      const res = await request(app)
        .get(`/api/threats/${testEventId}`)
        .set('Authorization', `Bearer ${analystToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.event.threatType, 'COMMAND_INJECTION');
      assert.strictEqual(res.body.event.riskScore, 100);
    });

    test('GET /api/threats/:id should return 404 for nonexistent event ID', async () => {
      const res = await request(app)
        .get('/api/threats/nonexistentid1234567890')
        .set('Authorization', `Bearer ${analystToken}`);

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });

    test('PATCH /api/threats/:id/status should update incident resolution and analyst notes', async () => {
      const res = await request(app)
        .patch(`/api/threats/${testEventId}/status`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          resolved: true,
          notes: 'Confirmed penetration testing simulation; rule tuning verified.',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.event.resolved, true);
      assert.strictEqual(
        res.body.event.notes,
        'Confirmed penetration testing simulation; rule tuning verified.'
      );
    });
  });
});
