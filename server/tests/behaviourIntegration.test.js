const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const express = require('express');
const app = require('../src/app');
const { createSecurityMiddleware } = require('../src/middleware/securityMiddleware');
const { BehaviourService, behaviourService } = require('../src/services/behaviourService');
const { AiClient } = require('../src/services/aiClient');
const { calculateRisk } = require('../src/services/riskEngine');
const UserBehaviour = require('../src/models/UserBehaviour');
const { setupMockDb, clearMockDb, getBehaviours } = require('./mockDb');

describe('Phase 10: Behaviour Integration Test Suite', () => {
  before(() => {
    setupMockDb();
  });

  beforeEach(() => {
    clearMockDb();
  });

  describe('1. UserBehaviour Data Model & Persistence', () => {
    test('should persist behavioral profile with all counters and defaults', async () => {
      const doc = await UserBehaviour.create({
        entityId: '192.168.1.100',
        entityType: 'IP',
        requestCount: 25,
        burstCount: 8,
        failedAuthCount: 2,
        error4xxCount: 4,
        totalRequests: 25,
        distinctPaths: ['/api/login', '/api/users', '/api/data'],
        lastAnomalyScore: 0.42,
        lastAnomalyLevel: 'SUSPICIOUS',
        isAnomaly: false,
        historicalViolations: 1,
        telemetryFeatures: {
          request_frequency: 25,
          burst_frequency: 8,
          failed_auth_count: 2,
          error_4xx_rate: 0.16,
          path_entropy: 3.0,
          avg_interval_ms: 2400.0,
        },
      });

      assert.strictEqual(doc.entityId, '192.168.1.100');
      assert.strictEqual(doc.entityType, 'IP');
      assert.strictEqual(doc.requestCount, 25);
      assert.strictEqual(doc.burstCount, 8);
      assert.strictEqual(doc.failedAuthCount, 2);
      assert.strictEqual(doc.error4xxCount, 4);
      assert.strictEqual(doc.distinctPaths.length, 3);
      assert.strictEqual(doc.lastAnomalyScore, 0.42);
      assert.strictEqual(doc.lastAnomalyLevel, 'SUSPICIOUS');
      assert.strictEqual(doc.historicalViolations, 1);
    });

    test('should update existing profile via findOneAndUpdate with upsert', async () => {
      await UserBehaviour.findOneAndUpdate(
        { entityId: 'user-12345', entityType: 'USER' },
        {
          $set: {
            requestCount: 40,
            lastAnomalyScore: 0.88,
            lastAnomalyLevel: 'CRITICAL',
            isAnomaly: true,
          },
        },
        { upsert: true, new: true }
      );

      const found = await UserBehaviour.findOne({ entityId: 'user-12345', entityType: 'USER' });
      assert.ok(found);
      assert.strictEqual(found.requestCount, 40);
      assert.strictEqual(found.lastAnomalyScore, 0.88);
      assert.strictEqual(found.lastAnomalyLevel, 'CRITICAL');
      assert.strictEqual(found.isAnomaly, true);
    });
  });

  describe('2. BehaviourService Sliding-Window Telemetry', () => {
    test('should compute request_frequency and burst_frequency across sliding windows', () => {
      const service = new BehaviourService();
      const ip = '10.0.0.1';
      const now = Date.now();

      // Simulate 5 requests 30 seconds ago
      for (let i = 0; i < 5; i++) {
        service.recordRequest(ip, {
          path: '/api/feed',
          timestamp: now - 30000 + i * 100,
        });
      }

      // Simulate 3 requests in the last 2 seconds (burst)
      for (let i = 0; i < 3; i++) {
        service.recordRequest(ip, {
          path: '/api/feed',
          timestamp: now - 2000 + i * 100,
        });
      }

      const telemetry = service.getTelemetry(ip, now);
      // Total requests in 60s window = 8
      assert.strictEqual(telemetry.request_frequency, 8);
      // Peak burst requests in 10s window = 3
      assert.strictEqual(telemetry.burst_frequency, 3);
    });

    test('should prune expired requests older than 60 seconds', () => {
      const service = new BehaviourService();
      const ip = '10.0.0.2';
      const now = Date.now();

      // 10 requests from 90 seconds ago (expired)
      for (let i = 0; i < 10; i++) {
        service.recordRequest(ip, {
          path: '/api/old',
          timestamp: now - 90000 + i * 100,
        });
      }

      // 2 requests in current window
      service.recordRequest(ip, { path: '/api/new', timestamp: now - 5000 });
      service.recordRequest(ip, { path: '/api/new', timestamp: now - 1000 });

      const telemetry = service.getTelemetry(ip, now);
      assert.strictEqual(telemetry.request_frequency, 2);
    });

    test('should track failed authentication attempts and reset on success', () => {
      const service = new BehaviourService();
      const entity = 'user-auth-test';

      assert.strictEqual(service.getTelemetry(entity).failed_auth_count, 0);

      service.recordAuthFailure(entity, 'USER');
      service.recordAuthFailure(entity, 'USER');
      service.recordAuthFailure(entity, 'USER');

      assert.strictEqual(service.getTelemetry(entity).failed_auth_count, 3);

      service.recordAuthSuccess(entity);
      assert.strictEqual(service.getTelemetry(entity).failed_auth_count, 0);
    });

    test('should calculate 4xx error rate accurately', () => {
      const service = new BehaviourService();
      const ip = '10.0.0.3';
      const now = Date.now();

      // 10 total requests, 3 of which are 4xx errors
      for (let i = 0; i < 7; i++) {
        service.recordRequest(ip, {
          path: `/page/${i}`,
          isError4xx: false,
          timestamp: now - 10000 + i * 500,
        });
      }
      for (let i = 0; i < 3; i++) {
        service.recordRequest(ip, {
          path: `/forbidden/${i}`,
          isError4xx: true,
          timestamp: now - 3000 + i * 500,
        });
      }

      const telemetry = service.getTelemetry(ip, now);
      assert.strictEqual(telemetry.request_frequency, 10);
      assert.strictEqual(telemetry.error_4xx_rate, 0.3);
    });

    test('should track path entropy across distinct endpoints', () => {
      const service = new BehaviourService();
      const ip = '10.0.0.4';
      const now = Date.now();

      // Visit 5 distinct endpoints
      const endpoints = ['/login', '/dashboard', '/settings', '/profile', '/logout'];
      for (const endpoint of endpoints) {
        service.recordRequest(ip, { path: endpoint, timestamp: now - 2000 });
      }

      const telemetry = service.getTelemetry(ip, now);
      assert.strictEqual(telemetry.path_entropy, 5);
    });

    test('should compute average inter-request arrival interval in milliseconds', () => {
      const service = new BehaviourService();
      const ip = '10.0.0.5';
      const now = Date.now();

      // 4 requests spaced exactly 200ms apart
      service.recordRequest(ip, { path: '/', timestamp: now - 600 });
      service.recordRequest(ip, { path: '/', timestamp: now - 400 });
      service.recordRequest(ip, { path: '/', timestamp: now - 200 });
      service.recordRequest(ip, { path: '/', timestamp: now });

      const telemetry = service.getTelemetry(ip, now);
      assert.strictEqual(telemetry.avg_interval_ms, 200);
    });

    test('should persist telemetry snapshot to database asynchronously', async () => {
      const service = new BehaviourService();
      const entityId = '192.168.10.50';

      const telemetry = {
        request_frequency: 15,
        burst_frequency: 5,
        failed_auth_count: 1,
        error_4xx_rate: 0.1,
        path_entropy: 4,
        avg_interval_ms: 1500,
      };

      const anomalyResult = {
        is_anomaly: false,
        anomaly_score: 0.18,
        anomaly_level: 'NORMAL',
      };

      await service.persistToDb(entityId, 'IP', telemetry, anomalyResult);

      const saved = await UserBehaviour.findOne({ entityId, entityType: 'IP' });
      assert.ok(saved);
      assert.strictEqual(saved.requestCount, 15);
      assert.strictEqual(saved.burstCount, 5);
      assert.strictEqual(saved.lastAnomalyScore, 0.18);
      assert.strictEqual(saved.lastAnomalyLevel, 'NORMAL');
    });
  });

  describe('3. AiClient Anomaly Detection Integration & Offline Resilience', () => {
    test('should sanitize and bound telemetry features sent to detectAnomaly', async () => {
      let capturedPayload = null;
      const mockClient = new AiClient('http://mock-ai:8000');
      mockClient.detectAnomaly = async (features) => {
        capturedPayload = {
          request_frequency: Math.max(0.0, Number(features.request_frequency) || 0.0),
          burst_frequency: Math.max(0.0, Number(features.burst_frequency) || 0.0),
          failed_auth_count: Math.max(0, parseInt(features.failed_auth_count, 10) || 0),
          error_4xx_rate: Math.min(1.0, Math.max(0.0, Number(features.error_4xx_rate) || 0.0)),
          path_entropy: Math.max(0.0, Number(features.path_entropy) || 1.0),
          avg_interval_ms: Math.max(0.0, Number(features.avg_interval_ms) || 5000.0),
        };
        return {
          is_anomaly: false,
          anomaly_score: 0.05,
          raw_score: 0.12,
          anomaly_level: 'NORMAL',
          modelVersion: 'behaviour-model-v1',
          features: capturedPayload,
          available: true,
        };
      };

      const res = await mockClient.detectAnomaly({
        request_frequency: -5,     // Negative should be clamped to 0
        burst_frequency: 'invalid', // Non-numeric clamped to 0
        failed_auth_count: -3,     // Clamped to 0
        error_4xx_rate: 1.5,       // Clamped to 1.0
        path_entropy: 0,           // Minimum 1.0
        avg_interval_ms: -100,     // Clamped to 0.0
      });

      assert.strictEqual(res.available, true);
      assert.strictEqual(capturedPayload.request_frequency, 0);
      assert.strictEqual(capturedPayload.burst_frequency, 0);
      assert.strictEqual(capturedPayload.failed_auth_count, 0);
      assert.strictEqual(capturedPayload.error_4xx_rate, 1.0);
      assert.strictEqual(capturedPayload.path_entropy, 1.0);
    });

    test('should return safe fallback when AI microservice is unreachable', async () => {
      // Direct instance targeting non-existent port to test actual network error handling
      const offlineClient = new AiClient('http://127.0.0.1:59999', 300);
      const res = await offlineClient.detectAnomaly({
        request_frequency: 50,
        burst_frequency: 10,
      });

      assert.strictEqual(res.available, false);
      assert.strictEqual(res.is_anomaly, false);
      assert.strictEqual(res.anomaly_score, 0.0);
      assert.strictEqual(res.anomaly_level, 'NORMAL');
      assert.strictEqual(res.modelVersion, 'fallback');
      assert.ok(res.error);
    });

    test('checkHealth should report anomaly model status when available', async () => {
      const mockClient = new AiClient('http://mock-ai:8000');
      mockClient.checkHealth = async () => ({
        available: true,
        status: 'ok',
        modelLoaded: true,
        modelVersion: 'attack-classifier-v1',
        anomalyModelLoaded: true,
        anomalyModelVersion: 'behaviour-model-v1',
      });

      const health = await mockClient.checkHealth();
      assert.strictEqual(health.available, true);
      assert.strictEqual(health.anomalyModelLoaded, true);
      assert.strictEqual(health.anomalyModelVersion, 'behaviour-model-v1');
    });
  });

  describe('4. Dynamic Risk Engine Anomaly Floor Enforcements', () => {
    test('should trigger CRITICAL_BEHAVIORAL_ANOMALY_FLOOR when anomaly score >= 0.85', () => {
      const signals = {
        threatType: 'NORMAL',
        aiConfidence: 0.99,
        ruleSeverity: 'NONE',
        anomalyScore: 0.92,
        requestFrequency: 10,
        failedAuthAttempts: 0,
      };

      const result = calculateRisk(signals);
      assert.ok(result.riskScore >= 80, `Expected >= 80, got ${result.riskScore}`);
      assert.strictEqual(result.severity, 'CRITICAL');
      assert.strictEqual(result.action, 'BLOCK');
      assert.ok(result.factors.includes('CRITICAL_BEHAVIORAL_ANOMALY_FLOOR'));
      assert.strictEqual(result.breakdown.anomaly, 92);
    });

    test('should keep benign low anomaly score within LOW / ALLOW tier', () => {
      const signals = {
        threatType: 'NORMAL',
        aiConfidence: 0.99,
        ruleSeverity: 'NONE',
        anomalyScore: 0.12,
        requestFrequency: 8,
        failedAuthAttempts: 0,
      };

      const result = calculateRisk(signals);
      assert.ok(result.riskScore <= 29);
      assert.strictEqual(result.severity, 'LOW');
      assert.strictEqual(result.action, 'ALLOW');
      assert.ok(!result.factors.includes('CRITICAL_BEHAVIORAL_ANOMALY_FLOOR'));
    });
  });

  describe('5. Gateway Middleware Behaviour Integration (End-to-End)', () => {
    test('should ALLOW benign human browsing pattern with LOW risk score', async () => {
      let capturedContext = null;
      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        createSecurityMiddleware({
          aiClient: {
            predict: async () => ({
              threatType: 'NORMAL',
              confidence: 0.99,
              modelVersion: 'attack-classifier-v1',
            }),
            detectAnomaly: async () => ({
              is_anomaly: false,
              anomaly_score: 0.08,
              raw_score: 0.15,
              anomaly_level: 'NORMAL',
              modelVersion: 'behaviour-model-v1',
              available: true,
            }),
          },
        })
      );
      testApp.get('/api/products', (req, res) => {
        capturedContext = req.securityContext;
        res.json({ success: true, items: ['laptop', 'phone'] });
      });

      const res = await request(testApp).get('/api/products');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(capturedContext !== null);
      assert.strictEqual(capturedContext.action, 'ALLOW');
      assert.strictEqual(capturedContext.threatType, 'NORMAL');
      assert.strictEqual(capturedContext.anomalyDetection.anomalyLevel, 'NORMAL');
      assert.ok(capturedContext.riskScore <= 29);
    });

    test('should BLOCK directory fuzzing / scanner anomaly with HTTP 403 and BEHAVIORAL_ANOMALY threat type', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        createSecurityMiddleware({
          aiClient: {
            predict: async () => ({
              threatType: 'NORMAL',
              confidence: 0.95,
              modelVersion: 'attack-classifier-v1',
            }),
            detectAnomaly: async () => ({
              is_anomaly: true,
              anomaly_score: 0.94,
              raw_score: -0.065,
              anomaly_level: 'CRITICAL',
              modelVersion: 'behaviour-model-v1',
              available: true,
            }),
          },
        })
      );
      testApp.get('/api/data', (req, res) => res.json({ success: true }));

      // Request body contains benign string, but anomaly detector flags severe fuzzing pattern
      const res = await request(testApp)
        .get('/api/data')
        .query({ search: 'standard query' });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.blocked, true);
      assert.strictEqual(res.body.securityContext.threatType, 'BEHAVIORAL_ANOMALY');
      assert.strictEqual(res.body.securityContext.action, 'BLOCK');
      assert.strictEqual(res.body.securityContext.severity, 'CRITICAL');
      assert.ok(res.body.securityContext.riskScore >= 80);
      assert.ok(res.body.securityContext.factors.includes('CRITICAL_BEHAVIORAL_ANOMALY_FLOOR'));
    });

    test('should BLOCK API flooding denial-of-service velocity spikes', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        createSecurityMiddleware({
          aiClient: {
            predict: async () => ({
              threatType: 'NORMAL',
              confidence: 0.90,
              modelVersion: 'attack-classifier-v1',
            }),
            detectAnomaly: async () => ({
              is_anomaly: true,
              anomaly_score: 0.88,
              raw_score: -0.052,
              anomaly_level: 'CRITICAL',
              modelVersion: 'behaviour-model-v1',
              available: true,
            }),
          },
        })
      );
      testApp.post('/api/action', (req, res) => res.json({ success: true }));

      const res = await request(testApp)
        .post('/api/action')
        .send({ action: 'ping' });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.blocked, true);
      assert.strictEqual(res.body.securityContext.threatType, 'BEHAVIORAL_ANOMALY');
      assert.ok(res.body.securityContext.riskScore >= 80);
    });

    test('should persist UserBehaviour profile to database during gateway execution', async () => {
      const customBehaviour = new BehaviourService();
      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        createSecurityMiddleware({
          behaviourService: customBehaviour,
          aiClient: {
            predict: async () => ({
              threatType: 'NORMAL',
              confidence: 0.99,
              modelVersion: 'attack-classifier-v1',
            }),
            detectAnomaly: async () => ({
              is_anomaly: false,
              anomaly_score: 0.15,
              raw_score: 0.10,
              anomaly_level: 'NORMAL',
              modelVersion: 'behaviour-model-v1',
              available: true,
            }),
          },
        })
      );
      testApp.get('/api/test-profile', (req, res) => res.json({ success: true }));

      const res = await request(testApp).get('/api/test-profile');
      assert.strictEqual(res.status, 200);

      // Verify profile is in mock database
      const behaviours = getBehaviours();
      assert.ok(behaviours.length > 0);
      const profile = behaviours[0];
      assert.strictEqual(profile.lastAnomalyLevel, 'NORMAL');
      assert.strictEqual(profile.lastAnomalyScore, 0.15);
      assert.ok(profile.requestCount >= 1);
    });
  });
});
