const mongoose = require('mongoose');
const User = require('../src/models/User');
const SecurityEvent = require('../src/models/SecurityEvent');
const UserBehaviour = require('../src/models/UserBehaviour');
const { behaviourService } = require('../src/services/behaviourService');

let inMemoryUsers = [];
let inMemoryEvents = [];
let inMemoryBehaviours = [];

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
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };

  // Attach prototype methods
  doc.comparePassword = User.prototype.comparePassword.bind(doc);
  doc.isLocked = User.prototype.isLocked.bind(doc);
  doc.incrementFailedAttempts = async function () {
    if (this.lockedUntil && this.lockedUntil.getTime() <= Date.now()) {
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
    return this;
  };
  doc.resetLoginAttempts = async function () {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
    if (this.status === 'locked') {
      this.status = 'active';
    }
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
    aiModelVersion: data.aiModelVersion || 'none',
    factors: Array.isArray(data.factors) ? [...data.factors] : [],
    breakdown: data.breakdown || {},
    telemetry: data.telemetry || {},
    userAgent: data.userAgent || '',
    userId: data.userId || null,
    payloadSnippet: data.payloadSnippet || '',
    resolved: Boolean(data.resolved),
    notes: data.notes || '',
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
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
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };

  doc.toJSON = function () {
    return { ...this };
  };
  doc.toObject = doc.toJSON;

  return doc;
}

function matchesFilter(event, filter = {}) {
  for (const [key, val] of Object.entries(filter)) {
    if (key === 'timestamp' && typeof val === 'object' && val !== null) {
      if (val.$gte && event.timestamp < new Date(val.$gte)) return false;
      if (val.$lte && event.timestamp > new Date(val.$lte)) return false;
    } else if (event[key] !== val) {
      return false;
    }
  }
  return true;
}

function setupMockDb() {
  // User Mocking
  User.findOne = function (query) {
    const email = query.email ? query.email.toLowerCase().trim() : null;
    const found = inMemoryUsers.find((u) => u.email === email);

    const chainable = {
      select: function (fields) {
        if (!found) return Promise.resolve(null);
        return Promise.resolve(found);
      },
      then: function (resolve, reject) {
        if (!found) return Promise.resolve(null).then(resolve, reject);
        const safeDoc = createUserDoc(found);
        delete safeDoc.passwordHash;
        return Promise.resolve(safeDoc).then(resolve, reject);
      },
    };

    return chainable;
  };

  User.findById = function (id) {
    const targetId = id ? id.toString() : '';
    const found = inMemoryUsers.find((u) => u._id.toString() === targetId);
    if (!found) return Promise.resolve(null);
    return Promise.resolve(found);
  };

  User.create = async function (data) {
    const doc = createUserDoc(data);
    inMemoryUsers.push(doc);
    return doc;
  };

  // SecurityEvent Mocking
  SecurityEvent.create = async function (data) {
    const doc = createEventDoc(data);
    inMemoryEvents.push(doc);
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

  // UserBehaviour Mocking
  UserBehaviour.create = async function (data) {
    const doc = createUserBehaviourDoc(data);
    inMemoryBehaviours.push(doc);
    return doc;
  };

  UserBehaviour.findOne = function (filter = {}) {
    const found = inMemoryBehaviours.find((b) => {
      if (filter.entityId && b.entityId !== filter.entityId) return false;
      if (filter.entityType && b.entityType !== filter.entityType) return false;
      return true;
    });
    return Promise.resolve(found ? createUserBehaviourDoc(found) : null);
  };

  UserBehaviour.findOneAndUpdate = function (filter = {}, update = {}, options = {}) {
    let foundIndex = inMemoryBehaviours.findIndex((b) => {
      if (filter.entityId && b.entityId !== filter.entityId) return false;
      if (filter.entityType && b.entityType !== filter.entityType) return false;
      return true;
    });

    const updateFields = update.$set || update;
    if (foundIndex === -1) {
      if (options.upsert) {
        const newDoc = createUserBehaviourDoc({ ...filter, ...updateFields });
        inMemoryBehaviours.push(newDoc);
        return Promise.resolve(createUserBehaviourDoc(newDoc));
      }
      return Promise.resolve(null);
    }

    const existing = inMemoryBehaviours[foundIndex];
    Object.assign(existing, updateFields, { updatedAt: new Date() });
    return Promise.resolve(createUserBehaviourDoc(existing));
  };

  UserBehaviour.find = function (filter = {}) {
    const matched = inMemoryBehaviours.filter((b) => {
      if (filter.entityId && b.entityId !== filter.entityId) return false;
      if (filter.entityType && b.entityType !== filter.entityType) return false;
      return true;
    });
    return Promise.resolve(matched.map(createUserBehaviourDoc));
  };

  UserBehaviour.countDocuments = function (filter = {}) {
    const matched = inMemoryBehaviours.filter((b) => {
      if (filter.entityId && b.entityId !== filter.entityId) return false;
      if (filter.entityType && b.entityType !== filter.entityType) return false;
      return true;
    });
    return Promise.resolve(matched.length);
  };
}

function clearMockDb() {
  inMemoryUsers = [];
  inMemoryEvents = [];
  inMemoryBehaviours = [];
  behaviourService.reset();
}

module.exports = {
  setupMockDb,
  clearMockDb,
  getUsers: () => inMemoryUsers,
  getEvents: () => inMemoryEvents,
  getBehaviours: () => inMemoryBehaviours,
};