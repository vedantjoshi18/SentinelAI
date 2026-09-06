const mongoose = require('mongoose');

/**
 * SentinelAI SecurityEvent Model
 * Persists comprehensive intrusion detection telemetry and audit records.
 */
const securityEventSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ip: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      required: true,
      default: 'GET',
    },
    path: {
      type: String,
      required: true,
      index: true,
    },
    threatType: {
      type: String,
      enum: [
        'NORMAL',
        'SQL_INJECTION',
        'XSS',
        'PATH_TRAVERSAL',
        'COMMAND_INJECTION',
        'MULTIPLE',
        'UNKNOWN',
      ],
      default: 'NORMAL',
      index: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
      index: true,
    },
    action: {
      type: String,
      enum: ['ALLOW', 'MONITOR', 'BLOCK'],
      default: 'ALLOW',
      index: true,
    },
    ruleMatches: {
      type: [String],
      default: [],
    },
    ruleSeverity: {
      type: String,
      default: 'NONE',
    },
    aiConfidence: {
      type: Number,
      default: 0.0,
      min: 0.0,
      max: 1.0,
    },
    aiModelVersion: {
      type: String,
      default: 'none',
    },
    factors: {
      type: [String],
      default: [],
    },
    breakdown: {
      ai: { type: Number, default: 0 },
      rule: { type: Number, default: 0 },
      anomaly: { type: Number, default: 0 },
      failedAuth: { type: Number, default: 0 },
      frequency: { type: Number, default: 0 },
      history: { type: Number, default: 0 },
    },
    telemetry: {
      clientIp: String,
      requestFrequency: Number,
      failedAuthAttempts: Number,
      anomalyScore: Number,
    },
    userAgent: {
      type: String,
      default: '',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    payloadSnippet: {
      type: String,
      default: '',
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal SOC filtering and aggregation performance
securityEventSchema.index({ timestamp: -1 });
securityEventSchema.index({ threatType: 1, timestamp: -1 });
securityEventSchema.index({ severity: 1, timestamp: -1 });
securityEventSchema.index({ action: 1, timestamp: -1 });
securityEventSchema.index({ ip: 1, timestamp: -1 });
securityEventSchema.index({ resolved: 1, timestamp: -1 });

const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);

module.exports = SecurityEvent;
