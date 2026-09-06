const { test, describe } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { sanitizeObject } = require('../src/middleware/sanitizationMiddleware');
const { validateSecurityConfig } = require('../src/config/securityValidator');
const { recordAndGetFrequency, resetFrequencyHistory } = require('../src/middleware/rateLimiter');

describe('Phase 13: Security Hardening & Defenses Test Suite', () => {
  describe('1. HTTP Security Headers (Helmet Hardening)', () => {
    test('should include strict X-Frame-Options: DENY header against clickjacking', async () => {
      const res = await request(app).get('/api/health');
      assert.strictEqual(res.headers['x-frame-options'], 'DENY');
    });

    test('should include X-Content-Type-Options: nosniff header', async () => {
      const res = await request(app).get('/api/health');
      assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    });

    test('should include Content-Security-Policy (CSP) headers', async () => {
      const res = await request(app).get('/api/health');
      assert.ok(res.headers['content-security-policy']);
      assert.match(res.headers['content-security-policy'], /default-src 'self'/);
    });
  });

  describe('2. Input Sanitization & NoSQL Injection Neutralization', () => {
    test('should strip MongoDB operator prefix $ from object keys', () => {
      const input = {
        username: 'admin',
        password: { $gt: '' },
        profile: { '$where': '1 == 1' },
      };
      const cleaned = sanitizeObject(input);
      assert.strictEqual(cleaned.password.gt, '');
      assert.strictEqual(cleaned.password.$gt, undefined);
      assert.strictEqual(cleaned.profile.where, '1 == 1');
      assert.strictEqual(cleaned.profile['$where'], undefined);
    });

    test('should strip null bytes (\0) from string inputs', () => {
      const malicious = {
        filename: 'report.pdf\0.exe',
        nested: { path: '/etc/passwd\0.png' },
      };
      const cleaned = sanitizeObject(malicious);
      assert.strictEqual(cleaned.filename, 'report.pdf.exe');
      assert.strictEqual(cleaned.nested.path, '/etc/passwd.png');
    });

    test('should neutralize prototype pollution keys (__proto__, constructor)', () => {
      const pollution = {
        name: 'test',
        __proto__: { isAdmin: true },
        constructor: { evil: true },
      };
      const cleaned = sanitizeObject(pollution);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(cleaned, '__proto__'), false);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(cleaned, 'constructor'), false);
      assert.strictEqual(cleaned.name, 'test');
    });
  });

  describe('3. Secret Hygiene & Environment Validation', () => {
    test('should reject production configuration using fallback or weak secrets', () => {
      const insecureConfig = {
        NODE_ENV: 'production',
        JWT_SECRET: 'sentinelai_dev_fallback_secret_change_in_production!',
        CLIENT_URL: 'https://soc.sentinelai.com',
      };
      const result = validateSecurityConfig(insecureConfig);
      assert.strictEqual(result.valid, false);
      assert.ok(result.issues.some((i) => i.includes('Default/fallback JWT_SECRET')));
    });

    test('should reject production configuration with short secrets (< 32 chars)', () => {
      const shortConfig = {
        NODE_ENV: 'production',
        JWT_SECRET: 'short_secret_key',
        CLIENT_URL: 'https://soc.sentinelai.com',
      };
      const result = validateSecurityConfig(shortConfig);
      assert.strictEqual(result.valid, false);
      assert.ok(result.issues.some((i) => i.includes('at least 32 characters')));
    });

    test('should accept production configuration with strong 64-character secret', () => {
      const secureConfig = {
        NODE_ENV: 'production',
        JWT_SECRET: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        CLIENT_URL: 'https://soc.sentinelai.com',
      };
      const result = validateSecurityConfig(secureConfig);
      assert.strictEqual(result.valid, true);
    });
  });

  describe('4. Rate Limiting Telemetry & Burst Accounting', () => {
    test('recordAndGetFrequency should track request accumulation within sliding window', () => {
      resetFrequencyHistory();
      const ip = '192.168.1.100';

      assert.strictEqual(recordAndGetFrequency(ip), 1);
      assert.strictEqual(recordAndGetFrequency(ip), 2);
      assert.strictEqual(recordAndGetFrequency(ip), 3);
      resetFrequencyHistory();
    });
  });
});
