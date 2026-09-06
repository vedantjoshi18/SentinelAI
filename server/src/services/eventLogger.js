const SecurityEvent = require('../models/SecurityEvent');
const threatService = require('./threatService');

/**
 * SentinelAI Security Event Logger
 * Persists intrusion detection events and telemetry to MongoDB asynchronously.
 * Guaranteed to be non-blocking so audit failures never disrupt HTTP request flows.
 */

/**
 * Persists a security evaluation record into the database.
 *
 * @param {object} securityContext - Security context output by the security engine.
 * @param {object} req - Express request object.
 * @returns {Promise<object|null>} Created SecurityEvent document or null on error.
 */
async function logSecurityEvent(securityContext = {}, req = {}) {
  try {
    const {
      threatType = 'NORMAL',
      riskScore = 0,
      severity = 'LOW',
      action = 'ALLOW',
      factors = [],
      breakdown = {},
      ruleMatches = [],
      ruleSeverity = 'NONE',
      aiPrediction = {},
      telemetry = {},
      timestamp,
      method = req.method || 'GET',
      path = req.originalUrl || req.path || '/',
    } = securityContext;

    // Do not log calls to the threat audit APIs to avoid log recursion and pollution
    if (path.startsWith('/api/threats')) {
      return null;
    }

    const ip =
      securityContext.clientIp ||
      req.ip ||
      req.headers?.['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const userAgent = req.headers?.['user-agent'] || '';
    const userId = req.user?._id || req.user?.id || null;

    // Build sanitized payload snippet (extractStrings explicitly excludes passwords and secrets)
    let payloadSnippet = '';
    const strings = threatService.extractStrings({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (strings.length > 0) {
      payloadSnippet = strings.join(' | ').substring(0, 500);
    }

    const eventData = {
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      ip,
      method,
      path,
      threatType,
      riskScore,
      severity,
      action,
      ruleMatches,
      ruleSeverity,
      aiConfidence: aiPrediction.confidence ?? 0.0,
      aiModelVersion: aiPrediction.modelVersion || 'none',
      factors,
      breakdown,
      telemetry: {
        clientIp: ip,
        requestFrequency: telemetry.requestFrequency || 1,
        failedAuthAttempts: telemetry.failedAuthAttempts || 0,
        anomalyScore: telemetry.anomalyScore || 0.0,
      },
      userAgent,
      userId,
      payloadSnippet,
      resolved: false,
    };

    return await SecurityEvent.create(eventData);
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[EventLogger] Failed to persist security event:', err.message);
    }
    return null;
  }
}

module.exports = {
  logSecurityEvent,
};
