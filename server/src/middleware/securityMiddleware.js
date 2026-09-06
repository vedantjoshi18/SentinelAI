const { aiClient: defaultAiClient } = require('../services/aiClient');
const threatService = require('../services/threatService');
const riskEngine = require('../services/riskEngine');
const { recordAndGetFrequency } = require('./rateLimiter');

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
  const exemptPaths = options.exemptPaths || DEFAULT_EXEMPT_PATHS;
  const onSecurityEvent = options.onSecurityEvent || null;

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

      // 5. Gather request context telemetry
      const clientIp =
        req.ip ||
        req.headers['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        '127.0.0.1';

      const requestFrequency = recordAndGetFrequency(clientIp);
      const failedAuthAttempts = req.user?.failedLoginAttempts || 0;
      const historicalViolations = 0; // Populated via user/IP history in future phases
      const anomalyScore = 0.0; // Populated by Behavioral Anomaly Detector in Phase 10

      // 6. Calculate Dynamic Risk Score and Enforcement Action
      const riskResult = risk.calculateRisk({
        threatType: aiResult.threatType,
        aiConfidence: aiResult.confidence,
        ruleSeverity: ruleResult.ruleSeverity,
        anomalyScore,
        requestFrequency,
        failedAuthAttempts,
        historicalViolations,
      });

      // 7. Determine primary threat category
      let primaryThreatType = 'NORMAL';
      if (ruleResult.ruleCategory && ruleResult.ruleCategory !== 'NONE' && ruleResult.ruleCategory !== 'NORMAL') {
        primaryThreatType = ruleResult.ruleCategory;
      } else if (aiResult.threatType && aiResult.threatType !== 'NORMAL') {
        primaryThreatType = aiResult.threatType;
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
        telemetry: {
          clientIp,
          requestFrequency,
          failedAuthAttempts,
          anomalyScore,
        },
        timestamp: new Date().toISOString(),
        method: req.method,
        path: originalUrl || currentPath,
      };

      // 9. Dispatch event hook for audit logging (non-blocking)
      if (typeof onSecurityEvent === 'function') {
        try {
          onSecurityEvent(req.securityContext, req);
        } catch (logErr) {
          // Non-blocking: audit log errors must never impact request flow
        }
      }

      // 10. Automated Policy Enforcement
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
