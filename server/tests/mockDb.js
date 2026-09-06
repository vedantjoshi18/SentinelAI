const mongoose = require('mongoose');
const User = require('../src/models/User');

let inMemoryUsers = [];

function createUserDoc(data) {
  const doc = {
    _id: data._id || new mongoose.Types.ObjectId().toString(),
    name: data.name,
    email: data.email.toLowerCase().trim(),
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

function setupMockDb() {
  User.findOne = function (query) {
    const email = query.email ? query.email.toLowerCase().trim() : null;
    const found = inMemoryUsers.find((u) => u.email === email);

    const chainable = {
      select: function (fields) {
        if (!found) return Promise.resolve(null);
        // If passwordHash requested via +passwordHash, keep it on doc
        return Promise.resolve(found);
      },
      then: function (resolve, reject) {
        if (!found) return Promise.resolve(null).then(resolve, reject);
        // Clone without passwordHash by default
        const safeDoc = createUserDoc(found);
        delete safeDoc.passwordHash;
        return Promise.resolve(safeDoc).then(resolve, reject);
      },
    };

    return chainable;
  };

  User.findById = function (id) {
    const targetId = id.toString();
    const found = inMemoryUsers.find((u) => u._id.toString() === targetId);
    if (!found) return Promise.resolve(null);
    return Promise.resolve(found);
  };

  User.create = async function (data) {
    const doc = createUserDoc(data);
    inMemoryUsers.push(doc);
    return doc;
  };
}

function clearMockDb() {
  inMemoryUsers = [];
}

module.exports = {
  setupMockDb,
  clearMockDb,
  getUsers: () => inMemoryUsers,
};