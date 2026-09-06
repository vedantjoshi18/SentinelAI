const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  calculateRisk,
  mapSeverity,
  mapAction,
  normalizeSignals,
  DEFAULT_THRESHOLDS,
  DEFAULT_ACTIONS,
  DEFAULT_WEIGHTS,
} = require('../src/services/riskEngine');

describe('Phase 6: Dynamic Risk Engine Test Suite', () => {
  describe('1. Baseline & Low Risk Assessment (ALLOW)', () => {
    test('should evaluate benign normal request as LOW severity and ALLOW action', () => {
      const benignSignals = {
        threatType: 'NORMAL',
        aiConfidence: 0.99,
        ruleSeverity: 'NONE',
        anomalyScore: 0.0,
        requestFrequency: 5,
        failedAuthAttempts: 0,
        historicalViolations: 0,
      };

      const result = calculateRisk(benignSignals);
      assert.ok(result.riskScore <= 29, `Expected score <= 29, got ${result.riskScore}`);
      assert.strictEqual(result.severity, 'LOW');
      assert.strictEqual(result.action, 'ALLOW');
      assert.deepStrictEqual(result.factors, []);
      assert.strictEqual(result.breakdown.rule, 0);
      assert.strictEqual(result.breakdown.anomaly, 0);
      assert.strictEqual(result.breakdown.failedAuth, 0);
      assert.strictEqual(result.breakdown.frequency, 0);
    });

    test('should handle empty input signals gracefully with safe defaults', () => {
      const result = calculateRisk({});
      assert.ok(typeof result.riskScore === 'number');
      assert.ok(result.riskScore >= 0 && result.riskScore <= 29);
      assert.strictEqual(result.severity, 'LOW');
      assert.strictEqual(result.action, 'ALLOW');
    });

    test('should keep mild baseline noise within LOW severity tier', () => {
      // 1 failed login + 15 req/min + 0.1 anomaly
      const mildSignals = {
        threatType: 'NORMAL',
        aiConfidence: 0.95,
        ruleSeverity: 'NONE',
        anomalyScore: 0.1,
        requestFrequency: 15,
        failedAuthAttempts: 1,
        historicalViolations: 0,
      };

      const result = calculateRisk(mildSignals);
      assert.ok(result.riskScore <= 29);
      assert.strictEqual(result.severity, 'LOW');
      assert.strictEqual(result.action, 'ALLOW');
    });
  });

  describe('2. Medium Risk & Suspicious Behavior (MONITOR)', () => {
    test('should evaluate moderate behavioral anomaly and rule suspicion as MEDIUM / MONITOR', () => {
      const suspiciousSignals = {
        threatType: 'NORMAL',
        aiConfidence: 0.60,
        ruleSeverity: 'MEDIUM',
        anomalyScore: 0.75,
        requestFrequency: 45,
        failedAuthAttempts: 2,
        historicalViolations: 1,
      };

      const result = calculateRisk(suspiciousSignals);
      assert.ok(result.riskScore >= 30 && result.riskScore <= 59, `Got score ${result.riskScore}`);
      assert.strictEqual(result.severity, 'MEDIUM');
      assert.strictEqual(result.action, 'MONITOR');
    });

    test('should map MEDIUM severity correctly using mapSeverity and mapAction', () => {
      assert.strictEqual(mapSeverity(30), 'MEDIUM');
      assert.strictEqual(mapSeverity(45), 'MEDIUM');
      assert.strictEqual(mapSeverity(59), 'MEDIUM');
      assert.strictEqual(mapAction('MEDIUM'), 'MONITOR');
    });
  });

  describe('3. High Risk & Active Exploits (BLOCK)', () => {
    test('should trigger HIGH_RULE_MATCH_FLOOR on HIGH rule match and enforce BLOCK', () => {
      const highRuleSignals = {
        threatType: 'NORMAL',
        aiConfidence: 0.90,
        ruleSeverity: 'HIGH',
        anomalyScore: 0.0,
      };

      const result = calculateRisk(highRuleSignals);
      assert.ok(result.riskScore >= 65, `Expected score >= 65, got ${result.riskScore}`);
      assert.strictEqual(result.severity, 'HIGH');
      assert.strictEqual(result.action, 'BLOCK');
      assert.ok(result.factors.includes('HIGH_RULE_MATCH_FLOOR'));
    });

    test('should trigger MODERATE_CONFIDENCE_AI_EXPLOIT_FLOOR for AI attack payload with 0.85 confidence', () => {
      const aiAttackSignals = {
        threatType: 'SQL_INJECTION',
        aiConfidence: 0.85,
        ruleSeverity: 'NONE',
        anomalyScore: 0.0,
      };

      const result = calculateRisk(aiAttackSignals);
      assert.ok(result.riskScore >= 65, `Expected score >= 65, got ${result.riskScore}`);
      assert.strictEqual(result.severity, 'HIGH');
      assert.strictEqual(result.action, 'BLOCK');
      assert.ok(result.factors.includes('MODERATE_CONFIDENCE_AI_EXPLOIT_FLOOR'));
    });
  });

  describe('4. Critical Risk & Severe Exploitation (BLOCK)', () => {
    test('should trigger CRITICAL_RULE_MATCH_FLOOR on CRITICAL rule match', () => {
      const criticalRuleSignals = {
        threatType: 'NORMAL',
        aiConfidence: 0.90,
        ruleSeverity: 'CRITICAL',
      };

      const result = calculateRisk(criticalRuleSignals);
      assert.ok(result.riskScore >= 85, `Expected score >= 85, got ${result.riskScore}`);
      assert.strictEqual(result.severity, 'CRITICAL');
      assert.strictEqual(result.action, 'BLOCK');
      assert.ok(result.factors.includes('CRITICAL_RULE_MATCH_FLOOR'));
    });

    test('should trigger HIGH_CONFIDENCE_AI_EXPLOIT_FLOOR for AI attack with >= 0.95 confidence', () => {
      const criticalAiSignals = {
        threatType: 'COMMAND_INJECTION',
        aiConfidence: 0.98,
        ruleSeverity: 'NONE',
      };

      const result = calculateRisk(criticalAiSignals);
      assert.ok(result.riskScore >= 85, `Expected score >= 85, got ${result.riskScore}`);
      assert.strictEqual(result.severity, 'CRITICAL');
      assert.strictEqual(result.action, 'BLOCK');
      assert.ok(result.factors.includes('HIGH_CONFIDENCE_AI_EXPLOIT_FLOOR'));
    });

    test('should trigger ACCOUNT_LOCKOUT_BURST_FLOOR when failed auth attempts >= 5', () => {
      const bruteForceSignals = {
        threatType: 'NORMAL',
        aiConfidence: 0.95,
        ruleSeverity: 'NONE',
        failedAuthAttempts: 5,
      };

      const result = calculateRisk(bruteForceSignals);
      assert.ok(result.riskScore >= 80, `Expected score >= 80, got ${result.riskScore}`);
      assert.strictEqual(result.severity, 'CRITICAL');
      assert.strictEqual(result.action, 'BLOCK');
      assert.ok(result.factors.includes('ACCOUNT_LOCKOUT_BURST_FLOOR'));
    });

    test('should cap compounded critical multi-signal attacks at 100', () => {
      const compoundSignals = {
        threatType: 'SQL_INJECTION',
        aiConfidence: 0.99,
        ruleSeverity: 'CRITICAL',
        anomalyScore: 1.0,
        requestFrequency: 150,
        failedAuthAttempts: 7,
        historicalViolations: 5,
      };

      const result = calculateRisk(compoundSignals);
      assert.strictEqual(result.riskScore, 100);
      assert.strictEqual(result.severity, 'CRITICAL');
      assert.strictEqual(result.action, 'BLOCK');
      assert.ok(result.factors.includes('CRITICAL_RULE_MATCH_FLOOR'));
      assert.ok(result.factors.includes('HIGH_CONFIDENCE_AI_EXPLOIT_FLOOR'));
      assert.ok(result.factors.includes('ACCOUNT_LOCKOUT_BURST_FLOOR'));
    });
  });

  describe('5. Mathematical Bounds, Sanitization & Determinism', () => {
    test('should strictly bound risk score between 0 and 100', () => {
      // Over-the-top extreme values
      const extremeHigh = calculateRisk({
        threatType: 'XSS',
        aiConfidence: 5.0,
        ruleSeverity: 'CRITICAL',
        anomalyScore: 999.0,
        requestFrequency: 10000,
        failedAuthAttempts: 500,
        historicalViolations: 100,
      });
      assert.strictEqual(extremeHigh.riskScore, 100);

      // Negative values
      const extremeLow = calculateRisk({
        threatType: 'NORMAL',
        aiConfidence: -1.0,
        ruleSeverity: 'NONE',
        anomalyScore: -5.0,
        requestFrequency: -20,
        failedAuthAttempts: -10,
        historicalViolations: -3,
      });
      assert.ok(extremeLow.riskScore >= 0 && extremeLow.riskScore <= 100);
    });

    test('should handle invalid non-numeric inputs without NaN or throwing', () => {
      const messySignals = {
        threatType: 'NORMAL',
        aiConfidence: 'not-a-number',
        ruleSeverity: 'UNKNOWN_SEVERITY',
        anomalyScore: null,
        requestFrequency: undefined,
        failedAuthAttempts: 'invalid',
        historicalViolations: {},
      };

      const result = calculateRisk(messySignals);
      assert.ok(typeof result.riskScore === 'number');
      assert.ok(!Number.isNaN(result.riskScore));
      assert.ok(result.riskScore >= 0 && result.riskScore <= 100);
    });

    test('should be strictly deterministic (identical inputs yield identical outputs)', () => {
      const input = {
        threatType: 'PATH_TRAVERSAL',
        aiConfidence: 0.88,
        ruleSeverity: 'MEDIUM',
        anomalyScore: 0.45,
        requestFrequency: 60,
        failedAuthAttempts: 2,
        historicalViolations: 1,
      };

      const first = calculateRisk(input);
      for (let i = 0; i < 50; i++) {
        const subsequent = calculateRisk(input);
        assert.strictEqual(subsequent.riskScore, first.riskScore);
        assert.strictEqual(subsequent.severity, first.severity);
        assert.strictEqual(subsequent.action, first.action);
        assert.deepStrictEqual(subsequent.breakdown, first.breakdown);
        assert.deepStrictEqual(subsequent.factors, first.factors);
      }
    });
  });

  describe('6. Telemetry Normalization & Breakdown', () => {
    test('normalizeSignals should convert signals into 0–100 scale accurately', () => {
      const norm = normalizeSignals({
        threatType: 'SQL_INJECTION',
        aiConfidence: 0.82,
        ruleSeverity: 'HIGH',
        anomalyScore: 0.65,
        requestFrequency: 75,
        failedAuthAttempts: 3,
        historicalViolations: 2,
      });

      assert.strictEqual(norm.aiScore, 82);
      assert.strictEqual(norm.ruleScore, 80);
      assert.strictEqual(norm.anomalyScore100, 65);
      assert.strictEqual(norm.authScore, 60);
      // (75 - 30) / 90 * 100 = 45 / 90 * 100 = 50
      assert.strictEqual(norm.freqScore, 50);
      // 2 * 25 = 50
      assert.strictEqual(norm.histScore, 50);
    });

    test('breakdown should report individual sub-scores in result', () => {
      const result = calculateRisk({
        threatType: 'XSS',
        aiConfidence: 0.90,
        ruleSeverity: 'HIGH',
        anomalyScore: 0.5,
        requestFrequency: 75,
        failedAuthAttempts: 2,
        historicalViolations: 1,
      });

      assert.ok(result.breakdown);
      assert.strictEqual(typeof result.breakdown.ai, 'number');
      assert.strictEqual(typeof result.breakdown.rule, 'number');
      assert.strictEqual(typeof result.breakdown.anomaly, 'number');
      assert.strictEqual(typeof result.breakdown.failedAuth, 'number');
      assert.strictEqual(typeof result.breakdown.frequency, 'number');
      assert.strictEqual(typeof result.breakdown.history, 'number');
      assert.strictEqual(result.breakdown.ai, 90);
      assert.strictEqual(result.breakdown.rule, 80);
      assert.strictEqual(result.breakdown.anomaly, 50);
      assert.strictEqual(result.breakdown.failedAuth, 40);
      assert.strictEqual(result.breakdown.frequency, 50);
      assert.strictEqual(result.breakdown.history, 25);
    });
  });

  describe('7. Configurable Weights, Thresholds & Modular Actions', () => {
    test('should allow custom weight overrides', () => {
      // Heavily weight rule and set everything else to 0
      const customConfig = {
        weights: {
          ai: 0,
          rule: 1.0,
          anomaly: 0,
          failedAuth: 0,
          requestFrequency: 0,
          historicalViolations: 0,
        },
      };

      const result = calculateRisk(
        { ruleSeverity: 'MEDIUM', aiConfidence: 0.99, threatType: 'NORMAL' },
        customConfig
      );

      // MEDIUM rule = 50
      assert.strictEqual(result.riskScore, 50);
      assert.strictEqual(result.severity, 'MEDIUM');
    });

    test('should allow custom threshold overrides', () => {
      const customConfig = {
        thresholds: {
          LOW_MAX: 15,
          MEDIUM_MAX: 35,
          HIGH_MAX: 50,
          CRITICAL_MIN: 51,
        },
      };

      // Score 40 with default thresholds would be MEDIUM, but with custom thresholds is HIGH
      const result = calculateRisk(
        { anomalyScore: 0.4, ruleSeverity: 'NONE' },
        customConfig
      );

      assert.strictEqual(mapSeverity(40, customConfig.thresholds), 'HIGH');
    });

    test('should allow custom action overrides', () => {
      const customConfig = {
        actions: {
          LOW: 'ALLOW',
          MEDIUM: 'CHALLENGE_CAPTCHA',
          HIGH: 'RATE_LIMIT_DROP',
          CRITICAL: 'TERMINATE_SESSION',
        },
      };

      const mediumResult = calculateRisk(
        {
          threatType: 'NORMAL',
          ruleSeverity: 'MEDIUM',
          anomalyScore: 0.8,
          failedAuthAttempts: 2,
          requestFrequency: 60,
        },
        customConfig
      );

      assert.strictEqual(mediumResult.severity, 'MEDIUM');
      assert.strictEqual(mediumResult.action, 'CHALLENGE_CAPTCHA');
    });
  });
});
