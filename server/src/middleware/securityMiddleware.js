const { aiClient: defaultAiClient } = require('../services/aiClient');
const threatService = require('../services/threatService');
const riskEngine = require('../services/riskEngine');
const { recordAndGetFrequency } = require('./rateLimiter');
const { behaviourService: defaultBehaviourService } = require('../services/behaviourService');

const { logSecurityEvent: defaultEventLogger } = require('../services/eventLogger');
const { verifyToken } = require('../utils/token');

const DEFAULT_EXEMPT_PATHS = [
  '/api/health',
  '/health',
  '/api/threats/inspect',
  '/favicon.ico',
];

/**
 * Creates an instance of the SentinelAI Security Middleware.
 * Supports dependency injection for testing and flexible security policies.
 *
 * @param {object} options - Configuration overrides.
 * @returns {Function} Express middleware function.
 */
function createSecurityMiddleware(options = {}) {
  const ai = options.aiClient || defaultAiClient;
  const threat = options.threatService || threatService;
  const risk = options.riskEngine || riskEngine;
  const behaviour = options.behaviourService || defaultBehaviourService;
  const exemptPaths = options.exemptPaths || DEFAULT_EXEMPT_PATHS;
  const onSecurityEvent = options.onSecurityEvent !== undefined
    ? options.onSecurityEvent
    : defaultEventLogger;

  return async function securityMiddleware(req, res, next) {
    try {
      // 1. Exemption check
      const currentPath = req.path || '';
      const originalUrl = req.originalUrl || '';
      const isExempt = exemptPaths.some(
        (exempt) => currentPath === exempt || originalUrl.startsWith(exempt)
      );

      if (isExempt) {
        return next();
      }

      // 2. Gather inspectable inputs from body, query parameters, and route parameters
      const inspectablePayload = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      // 3. Deterministic Security Rule Engine Analysis
      const ruleResult = threat.analyzeInput(inspectablePayload);

      // 4. Extract text payload for AI Attack Classifier
      const extractedStrings = threat.extractStrings(inspectablePayload);
      let aiResult;

      if (extractedStrings.length > 0) {
        // Concatenate strings into bounded payload for ML evaluation
        const combinedText = extractedStrings.join('\n').substring(0, 10000);
        aiResult = await ai.predict(combinedText);
      } else {
        // No payload text to evaluate (e.g. parameter-less GET)
        aiResult = {
          threatType: 'NORMAL',
          confidence: 1.0,
          modelVersion: 'none',
          probabilities: { NORMAL: 1.0 },
          available: true,
        };
      }

      // 5. Gather request context telemetry & behavioral analysis
      const clientIp =
        req.ip ||
        req.headers['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        '127.0.0.1';

      // Pre-extract authenticated user identity if Bearer token is provided
      let authenticatedUserId = req.user?._id ? req.user._id.toString() : null;
      if (!authenticatedUserId && req.headers?.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const rawToken = req.headers.authorization.split(' ')[1];
          const decoded = verifyToken(rawToken);
          if (decoded && (decoded.id || decoded._id)) {
            authenticatedUserId = (decoded.id || decoded._id).toString();
          }
        } catch (_) {
          // Non-blocking: unauthenticated / invalid tokens fall back to IP tracking
        }
      }

      const entityId = authenticatedUserId || clientIp;
      const entityType = authenticatedUserId ? 'USER' : 'IP';

      // Record request in behaviour service & calculate real-time sliding window features
      const telemetry = behaviour.recordRequest(entityId, {
        path: currentPath,
        method: req.method,
        entityType,
        userId: authenticatedUserId || req.user?._id || null,
        ip: clientIp,
      });

      // Hook response finish to capture 4xx client errors for directory fuzzing / scanner detection
      res.on('finish', () => {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          behaviour.recordError4xx(entityId);
        }
      });

      // Update rate limiter velocity counter
      recordAndGetFrequency(clientIp);

      const isLoginEndpoint = currentPath === '/api/auth/login';
      const failedAuthAttempts = isLoginEndpoint
        ? 0
        : Math.max(
            req.user?.failedLoginAttempts || 0,
            telemetry.failed_auth_count || 0
          );
      const historicalViolations = behaviour.getHistoricalViolations(entityId);

      // Evaluate behavioural anomaly detection via AI microservice (if available)
      let anomalyResult = {
        is_anomaly: false,
        anomaly_score: 0.0,
        raw_score: 0.0,
        anomaly_level: 'NORMAL',
        modelVersion: 'none',
        available: false,
      };

      if (typeof ai.detectAnomaly === 'function') {
        anomalyResult = await ai.detectAnomaly(telemetry);
      }

      const anomalyScore = anomalyResult.anomaly_score || 0.0;

      // 6. Calculate Dynamic Risk Score and Enforcement Action
      const riskResult = risk.calculateRisk({
        threatType: aiResult.threatType,
        aiConfidence: aiResult.confidence,
        ruleSeverity: ruleResult.ruleSeverity,
        anomalyScore,
        anomalyLevel: anomalyResult.anomaly_level,
        requestFrequency: telemetry.request_frequency,
        failedAuthAttempts,
        historicalViolations,
      });

      // 7. Determine primary threat category
      let primaryThreatType = 'NORMAL';
      if (ruleResult.ruleCategory && ruleResult.ruleCategory !== 'NONE' && ruleResult.ruleCategory !== 'NORMAL') {
        primaryThreatType = ruleResult.ruleCategory;
      } else if (aiResult.threatType && aiResult.threatType !== 'NORMAL') {
        primaryThreatType = aiResult.threatType;
      } else if (anomalyResult.is_anomaly || anomalyScore >= 0.70 || anomalyResult.anomaly_level === 'CRITICAL') {
        primaryThreatType = 'BEHAVIORAL_ANOMALY';
      }

      // 8. Attach full security context to request for downstream audit logging and handlers
      req.securityContext = {
        threatType: primaryThreatType,
        riskScore: riskResult.riskScore,
        severity: riskResult.severity,
        action: riskResult.action,
        factors: riskResult.factors,
        breakdown: riskResult.breakdown,
        ruleMatches: ruleResult.ruleMatches,
        ruleSeverity: ruleResult.ruleSeverity,
        aiPrediction: {
          threatType: aiResult.threatType,
          confidence: aiResult.confidence,
          available: aiResult.available,
          modelVersion: aiResult.modelVersion,
        },
        anomalyDetection: {
          isAnomaly: anomalyResult.is_anomaly,
          anomalyScore: anomalyResult.anomaly_score,
          rawScore: anomalyResult.raw_score,
          anomalyLevel: anomalyResult.anomaly_level,
          modelVersion: anomalyResult.modelVersion,
          available: anomalyResult.available,
        },
        telemetry: {
          clientIp,
          entityId,
          entityType,
          requestFrequency: telemetry.request_frequency,
          burstFrequency: telemetry.burst_frequency,
          failedAuthAttempts,
          error4xxRate: telemetry.error_4xx_rate,
          pathEntropy: telemetry.path_entropy,
          avgIntervalMs: telemetry.avg_interval_ms,
          anomalyScore,
        },
        timestamp: new Date().toISOString(),
        method: req.method,
        path: originalUrl || currentPath,
      };

      // 9. Update behaviour tracking state and asynchronous DB persistence
      if (riskResult.action === 'BLOCK') {
        behaviour.recordViolation(entityId, entityType);
      }
      behaviour.updateAnomalyResult(entityId, anomalyResult);
      Promise.resolve(behaviour.persistToDb(entityId, entityType, telemetry, anomalyResult)).catch(() => {});

      // 10. Dispatch event hook for audit logging (non-blocking)
      if (typeof onSecurityEvent === 'function') {
        try {
          Promise.resolve(onSecurityEvent(req.securityContext, req)).catch(() => {});
        } catch (logErr) {
          // Non-blocking: audit log errors must never impact request flow
        }
      }

      // 11. Automated Policy Enforcement
      if (riskResult.action === 'BLOCK') {
        return res.status(403).json({
          success: false,
          error: 'Request blocked by SentinelAI Security Engine',
          blocked: true,
          securityContext: {
            threatType: req.securityContext.threatType,
            riskScore: riskResult.riskScore,
            severity: riskResult.severity,
            action: 'BLOCK',
            factors: riskResult.factors,
            ruleMatches: ruleResult.ruleMatches,
            timestamp: req.securityContext.timestamp,
          },
        });
      }

      // For ALLOW or MONITOR, proceed downstream
      return next();
    } catch (middlewareError) {
      // Fail-safe defense: unexpected exceptions in security inspection must be safely passed to express error handler
      return next(middlewareError);
    }
  };
}

const defaultSecurityMiddleware = createSecurityMiddleware();

module.exports = {
  createSecurityMiddleware,
  securityMiddleware: defaultSecurityMiddleware,
  DEFAULT_EXEMPT_PATHS,
};
