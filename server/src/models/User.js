const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never return password hash in regular queries
    },
    role: {
      type: String,
      enum: {
        values: ['USER', 'ANALYST', 'ADMIN'],
        message: '{VALUE} is not a valid role',
      },
      default: 'USER',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'locked'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Method: Compare candidate plaintext password against stored bcrypt hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) {
    throw new Error('Password hash not loaded for comparison');
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method: Check if account is currently locked
userSchema.methods.isLocked = function () {
  return Boolean(this.lockedUntil && this.lockedUntil.getTime() > Date.now());
};

// Method: Handle failed login attempt and apply lock if threshold exceeded
userSchema.methods.incrementFailedAttempts = async function () {
  // If lock already expired, reset counter to 1
  if (this.lockedUntil && this.lockedUntil.getTime() <= Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockedUntil = null;
    this.status = 'active';
  } else {
    this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  }

  // Lock account for 15 minutes after 5 consecutive failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    this.status = 'locked';
  }

  return this.save();
};

// Method: Reset failed attempts upon successful authentication
userSchema.methods.resetLoginAttempts = async function () {
  if (this.failedLoginAttempts > 0 || this.lockedUntil !== null) {
    this.failedLoginAttempts = 0;
    // Only revert status to active if lockout was due to automated temporary lockedUntil
    if (this.status === 'locked' && this.lockedUntil !== null) {
      this.status = 'active';
    }
    this.lockedUntil = null;
    return this.save();
  }
  return this;
};

// Static helper: Hash plaintext password
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

// Ensure passwordHash and __v are never serialized in responses
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

userSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;