const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');
const { setupMockDb, clearMockDb } = require('./mockDb');

describe('Phase 1: Database & Authentication Test Suite', () => {
  before(() => {
    setupMockDb();
  });

  beforeEach(() => {
    clearMockDb();
  });

  describe('1. User Registration (POST /api/auth/register)', () => {
    test('should successfully register a new user with bcrypt-hashed password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Security',
          email: 'alice@sentinel.ai',
          password: 'SecurePassword123!',
          role: 'USER',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(typeof res.body.token, 'string');
      assert.strictEqual(res.body.user.email, 'alice@sentinel.ai');
      assert.strictEqual(res.body.user.name, 'Alice Security');
      assert.strictEqual(res.body.user.role, 'USER');
      assert.strictEqual(res.body.user.status, 'active');
      // Verify passwordHash is NEVER exposed in the API response
      assert.strictEqual(res.body.user.passwordHash, undefined);
    });

    test('should reject duplicate email registration with 409 Conflict', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bob Analyst',
          email: 'bob@sentinel.ai',
          password: 'StrongPassword123!',
        });

      // Second registration with same email (case insensitive)
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bob Duplicate',
          email: 'BOB@sentinel.ai',
          password: 'AnotherPassword456!',
        });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /already exists/i);
    });

    test('should reject registration with invalid email or weak password (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'C',
          email: 'not-an-email',
          password: 'short',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(Array.isArray(res.body.details));
      assert.ok(res.body.details.length >= 2);
    });

    test('should ignore role parameter on self-registration and enforce USER role (BUG-SEC-001)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Attacker Attempting Escalation',
          email: 'attacker@sentinel.ai',
          password: 'AttackerPassword123!',
          role: 'ADMIN',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.role, 'USER');
    });
  });

  describe('2. User Login & Repeated-Login Protection (POST /api/auth/login)', () => {
    beforeEach(async () => {
      // Seed a user for login testing
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dev User',
          email: 'dev@sentinel.ai',
          password: 'CorrectPassword123!',
        });
    });

    test('should successfully authenticate user and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dev@sentinel.ai',
          password: 'CorrectPassword123!',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(typeof res.body.token, 'string');
      assert.strictEqual(res.body.user.email, 'dev@sentinel.ai');
      assert.strictEqual(res.body.user.passwordHash, undefined);
    });

    test('should reject login with incorrect password and decrement remaining attempts', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dev@sentinel.ai',
          password: 'WrongPassword999!',
        });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'Invalid credentials');
      assert.strictEqual(res.body.remainingAttempts, 4);
    });

    test('should reject missing login credentials with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: '',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    test('should temporarily lock account after 5 consecutive failed login attempts', async () => {
      // 5 consecutive wrong attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'dev@sentinel.ai',
            password: 'BadPassword!',
          });
      }

      // 6th attempt should return 423 Locked
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dev@sentinel.ai',
          password: 'CorrectPassword123!',
        });

      assert.strictEqual(res.status, 423);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /temporarily locked/i);
    });
  });

  describe('3. JWT Authentication & Profile Verification (GET /api/auth/me)', () => {
    let validToken;

    beforeEach(async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Me Tester',
          email: 'me@sentinel.ai',
          password: 'Password123!@#',
        });
      validToken = regRes.body.token;
    });

    test('should return current user profile with valid JWT Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.email, 'me@sentinel.ai');
      assert.strictEqual(res.body.user.passwordHash, undefined);
    });

    test('should return 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /token required/i);
    });

    test('should return 401 when JWT token is invalid or tampered', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.token');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /invalid or expired/i);
    });

    test('should return 401 when JWT token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: 'someid', role: 'USER' },
        env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /invalid or expired/i);
    });
  });

  describe('4. Role-Based Access Control (RBAC)', () => {
    let userToken;
    let analystToken;
    let adminToken;

    beforeEach(async () => {
      // Register standard USER
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Regular User',
          email: 'user@sentinel.ai',
          password: 'UserPass123!@#',
        });
      userToken = userRes.body.token;

      // Provision ANALYST
      const analystUser = await User.create({
        name: 'Sec Analyst',
        email: 'analyst@sentinel.ai',
        passwordHash: 'hash123',
        role: 'ANALYST',
        status: 'active',
      });
      analystToken = jwt.sign(
        { id: analystUser._id.toString(), email: analystUser.email, role: 'ANALYST' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Provision ADMIN
      const adminUser = await User.create({
        name: 'Sys Admin',
        email: 'admin@sentinel.ai',
        passwordHash: 'hash123',
        role: 'ADMIN',
        status: 'active',
      });
      adminToken = jwt.sign(
        { id: adminUser._id.toString(), email: adminUser.email, role: 'ADMIN' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    test('USER should be rejected with 403 Forbidden when accessing ADMIN endpoint', async () => {
      const res = await request(app)
        .get('/api/users/admin/overview')
        .set('Authorization', `Bearer ${userToken}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /insufficient permissions/i);
    });

    test('USER should be rejected with 403 Forbidden when accessing ANALYST endpoint', async () => {
      const res = await request(app)
        .get('/api/users/analyst/metrics')
        .set('Authorization', `Bearer ${userToken}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /insufficient permissions/i);
    });

    test('ANALYST should be permitted on ANALYST endpoint but rejected on ADMIN endpoint', async () => {
      const analystRes = await request(app)
        .get('/api/users/analyst/metrics')
        .set('Authorization', `Bearer ${analystToken}`);

      assert.strictEqual(analystRes.status, 200);
      assert.strictEqual(analystRes.body.success, true);

      const adminRes = await request(app)
        .get('/api/users/admin/overview')
        .set('Authorization', `Bearer ${analystToken}`);

      assert.strictEqual(adminRes.status, 403);
      assert.strictEqual(adminRes.body.success, false);
    });

    test('ADMIN should be permitted to access ADMIN, ANALYST, and profile endpoints', async () => {
      const adminRes = await request(app)
        .get('/api/users/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(adminRes.status, 200);
      assert.strictEqual(adminRes.body.success, true);
      assert.strictEqual(adminRes.body.user, 'admin@sentinel.ai');

      const analystRes = await request(app)
        .get('/api/users/analyst/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(analystRes.status, 200);
      assert.strictEqual(analystRes.body.success, true);
    });
  });
});