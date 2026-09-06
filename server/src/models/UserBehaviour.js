const mongoose = require('mongoose');

/**
 * SentinelAI UserBehaviour Model
 * Persists sliding-window behavioral telemetry, violation history,
 * and ML anomaly detection profiles for users and client IPs.
 */
const userBehaviourSchema = new mongoose.Schema(
  {
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['IP', 'USER'],
      default: 'IP',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ip: {
      type: String,
      default: '',
    },
    windowStart: {
      type: Date,
      default: Date.now,
    },
    requestCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    burstCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    failedAuthCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    error4xxCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRequests: {
      type: Number,
      default: 0,
      min: 0,
    },
    distinctPaths: {
      type: [String],
      default: [],
    },
    lastAnomalyScore: {
      type: Number,
      default: 0.0,
      min: 0.0,
      max: 1.0,
    },
    lastAnomalyLevel: {
      type: String,
      enum: ['NORMAL', 'SUSPICIOUS', 'CRITICAL'],
      default: 'NORMAL',
    },
    isAnomaly: {
      type: Boolean,
      default: false,
    },
    historicalViolations: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true,
    },
    telemetryFeatures: {
      request_frequency: { type: Number, default: 0 },
      burst_frequency: { type: Number, default: 0 },
      failed_auth_count: { type: Number, default: 0 },
      error_4xx_rate: { type: Number, default: 0 },
      path_entropy: { type: Number, default: 1 },
      avg_interval_ms: { type: Number, default: 5000 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on entityId + entityType for fast unique lookups
userBehaviourSchema.index({ entityId: 1, entityType: 1 }, { unique: true });

const UserBehaviour = mongoose.model('UserBehaviour', userBehaviourSchema);

module.exports = UserBehaviour;
