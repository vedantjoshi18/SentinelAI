const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');
const { setupMockDb, clearMockDb } = require('./mockDb');

describe('Phase 12: Admin & User Management Test Suite', () => {
  let adminUser;
  let adminToken;
  let analystUser;
  let analystToken;
  let normalUser;
  let normalToken;

  function generateToken(user) {
    return jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  before(() => {
    setupMockDb();
  });

  beforeEach(async () => {
    clearMockDb();

    // Create Admin User
    adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@sentinelai.local',
      passwordHash: 'hash123',
      role: 'ADMIN',
      status: 'active',
    });
    adminToken = generateToken(adminUser);

    // Create Analyst User
    analystUser = await User.create({
      name: 'Alice Analyst',
      email: 'analyst@sentinelai.local',
      passwordHash: 'hash123',
      role: 'ANALYST',
      status: 'active',
    });
    analystToken = generateToken(analystUser);

    // Create Regular User
    normalUser = await User.create({
      name: 'Bob Standard',
      email: 'bob@sentinelai.local',
      passwordHash: 'hash123',
      role: 'USER',
      status: 'active',
    });
    normalToken = generateToken(normalUser);
  });

  describe('1. RBAC Enforcements on Admin Endpoints', () => {
    test('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/users');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    test('should reject standard USER with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer ' + normalToken);
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    test('should reject ANALYST role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer ' + analystToken);
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    test('should allow ADMIN role full access with 200 OK', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer ' + adminToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(Array.isArray(res.body.users), true);
      assert.strictEqual(res.body.users.length, 3);
    });
  });

  describe('2. User Retrieval & Administrative Statistics', () => {
    test('GET /api/admin/stats should return aggregated system metrics', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', 'Bearer ' + adminToken);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.stats.totalUsers, 3);
      assert.strictEqual(res.body.stats.byRole.ADMIN, 1);
      assert.strictEqual(res.body.stats.byRole.ANALYST, 1);
      assert.strictEqual(res.body.stats.byRole.USER, 1);
    });

    test('GET /api/admin/users should support filtering by role', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=ANALYST')
        .set('Authorization', 'Bearer ' + adminToken);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.users.length, 1);
      assert.strictEqual(res.body.users[0].email, 'analyst@sentinelai.local');
    });

    test('GET /api/admin/users/:id should retrieve single user details without passwordHash', async () => {
      const res = await request(app)
        .get('/api/admin/users/' + normalUser._id)
        .set('Authorization', 'Bearer ' + adminToken);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.email, 'bob@sentinelai.local');
      assert.strictEqual(res.body.user.passwordHash, undefined);
    });
  });

  describe('3. Role Management & Self-Demotion Guards', () => {
    test('PATCH /api/admin/users/:id/role should successfully promote user to ANALYST', async () => {
      const res = await request(app)
        .patch('/api/admin/users/' + normalUser._id + '/role')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ role: 'ANALYST' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.role, 'ANALYST');
    });

    test('PATCH /api/admin/users/:id/role should reject invalid role', async () => {
      const res = await request(app)
        .patch('/api/admin/users/' + normalUser._id + '/role')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ role: 'SUPER_HACKER' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    test('PATCH /api/admin/users/:id/role should prevent administrator from demoting self', async () => {
      const res = await request(app)
        .patch('/api/admin/users/' + adminUser._id + '/role')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ role: 'USER' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /cannot demote their own account/i);
    });
  });

  describe('4. Status Triage, Lockout & Account Unlocking', () => {
    test('PATCH /api/admin/users/:id/status should suspend user account', async () => {
      const res = await request(app)
        .patch('/api/admin/users/' + normalUser._id + '/status')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ status: 'suspended' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.status, 'suspended');
    });

    test('PATCH /api/admin/users/:id/status should prevent administrator from suspending self', async () => {
      const res = await request(app)
        .patch('/api/admin/users/' + adminUser._id + '/status')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ status: 'suspended' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /cannot suspend or lock their own account/i);
    });

    test('POST /api/admin/users/:id/unlock should reset failed attempts and unlock account', async () => {
      // Artificially lock the user
      normalUser.status = 'locked';
      normalUser.failedLoginAttempts = 5;
      normalUser.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await normalUser.save();

      const res = await request(app)
        .post('/api/admin/users/' + normalUser._id + '/unlock')
        .set('Authorization', 'Bearer ' + adminToken);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.status, 'active');
      assert.strictEqual(res.body.user.failedLoginAttempts, 0);
    });
  });

  describe('5. User Deletion & Safety Guards', () => {
    test('DELETE /api/admin/users/:id should prevent administrator from deleting self', async () => {
      const res = await request(app)
        .delete('/api/admin/users/' + adminUser._id)
        .set('Authorization', 'Bearer ' + adminToken);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /cannot delete their own account/i);
    });

    test('DELETE /api/admin/users/:id should successfully delete user', async () => {
      const res = await request(app)
        .delete('/api/admin/users/' + normalUser._id)
        .set('Authorization', 'Bearer ' + adminToken);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);

      // Verify user is gone
      const fetchRes = await request(app)
        .get('/api/admin/users/' + normalUser._id)
        .set('Authorization', 'Bearer ' + adminToken);
      assert.strictEqual(fetchRes.status, 404);
    });
  });
});
