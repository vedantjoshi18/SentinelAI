const { test, describe } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('Backend API Health & Foundation', () => {
  test('GET /api/health should respond with status 200 and { status: "ok" }', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, { status: 'ok' });
  });

  test('GET /api/nonexistent should return 404 with structured error', async () => {
    const res = await request(app).get('/api/nonexistent');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Resource not found');
  });
});
