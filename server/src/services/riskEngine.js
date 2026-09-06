/**
 * SentinelAI Dynamic Risk Engine
 * Synthesizes multi-source security telemetry into a normalized risk score (0–100)
 * and determines automated policy enforcement (ALLOW, MONITOR, BLOCK).
 *
 * NOTE: Thresholds and weights are prototype security policy defaults and can be tuned
 * per deployment environment.
 */

const DEFAULT_THRESHOLDS = {
  LOW_MAX: 29,       // 0 - 29: LOW
  MEDIUM_MAX: 59,    // 30 - 59: MEDIUM
  HIGH_MAX: 79,      // 60 - 79: HIGH
  CRITICAL_MIN: 80,  // 80 - 100: CRITICAL
};

const DEFAULT_ACTIONS = {
  LOW: 'ALLOW',
  MEDIUM: 'MONITOR',
  HIGH: 'BLOCK',
  CRITICAL: 'BLOCK',
};

const DEFAULT_WEIGHTS = {
  ai: 0.35,              // AI attack payload prediction
  rule: 0.30,            // Deterministic signature match severity
  anomaly: 0.15,         // Behavioral anomaly detector
  failedAuth: 0.10,      // Repeated authentication failure rate
  requestFrequency: 0.05,// Request velocity burst rate
  historicalViolations: 0.05, // Prior threat history of user/IP
};

const RULE_SEVERITY_SCORES = {
  CRITICAL: 100,
  HIGH: 80,
  MEDIUM: 50,
  LOW: 25,
  NONE: 0,
};

/**
 * Maps a numeric risk score (0–100) to a severity category.
 */
function mapSeverity(score, thresholds = DEFAULT_THRESHOLDS) {
  if (score <= thresholds.LOW_MAX) return 'LOW';
  if (score <= thresholds.MEDIUM_MAX) return 'MEDIUM';
  if (score <= thresholds.HIGH_MAX) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Maps a severity category to an automated policy action.
 */
function mapAction(severity, actions = DEFAULT_ACTIONS) {
  return actions[severity] || 'BLOCK';
}

/**
 * Normalizes individual telemetry signals into sub-scores from 0 to 100.
 */
function normalizeSignals(signals = {}) {
  const {
    threatType = 'NORMAL',
    aiConfidence = 0.0,
    ruleSeverity = 'NONE',
    anomalyScore = 0.0,
    requestFrequency = 1,
    failedAuthAttempts = 0,
    historicalViolations = 0,
  } = signals || {};

  // 1. AI Payload Sub-score
  let aiScore = 0;
  const numConfidence = Number(aiConfidence);
  const safeConfidence = Number.isFinite(numConfidence)
    ? Math.min(1.0, Math.max(0.0, numConfidence))
    : (threatType === 'NORMAL' ? 1.0 : 0.0);

  if (threatType && threatType !== 'NORMAL') {
    // Attack detected: scale directly by confidence (e.g. 0.98 -> 98)
    aiScore = safeConfidence * 100;
  } else {
    // Normal payload: high confidence in normal reduces risk towards 0
    aiScore = (1.0 - safeConfidence) * 20;
  }

  // 2. Deterministic Rule Sub-score
  const normalizedRuleSeverity = typeof ruleSeverity === 'string'
    ? ruleSeverity.toUpperCase()
    : 'NONE';
  const ruleScore = RULE_SEVERITY_SCORES[normalizedRuleSeverity] ?? 0;

  // 3. Behavioral Anomaly Sub-score (0.0 to 1.0 -> 0 to 100)
  const numAnomaly = Number(anomalyScore);
  const anomalyScoreBounded = Number.isFinite(numAnomaly)
    ? Math.min(1.0, Math.max(0.0, numAnomaly))
    : 0.0;
  const anomalyScore100 = anomalyScoreBounded * 100;

  // 4. Failed Authentication Sub-score
  // 1 fail: 20, 2 fails: 40, 3 fails: 60, 4 fails: 80, >=5 fails: 100
  let authScore = 0;
  const parsedFails = parseInt(failedAuthAttempts, 10);
  const fails = Number.isFinite(parsedFails) ? Math.max(0, parsedFails) : 0;
  if (fails >= 5) {
    authScore = 100;
  } else if (fails > 0) {
    authScore = fails * 20;
  }

  // 5. Request Frequency Sub-score (requests per minute)
  // Baseline up to 30 req/min: 0 risk.
  // 31 to 120 req/min: linear ramp to 100.
  const parsedFreq = parseInt(requestFrequency, 10);
  const freq = Number.isFinite(parsedFreq) ? Math.max(0, parsedFreq) : 1;
  let freqScore = 0;
  if (freq > 30) {
    freqScore = Math.min(100, ((freq - 30) / 90) * 100);
  }

  // 6. Historical Violations Sub-score
  const parsedViolations = parseInt(historicalViolations, 10);
  const violations = Number.isFinite(parsedViolations) ? Math.max(0, parsedViolations) : 0;
  const histScore = Math.min(100, violations * 25);

  return {
    aiScore,
    ruleScore,
    anomalyScore100,
    authScore,
    freqScore,
    histScore,
    threatType,
    aiConfidence: safeConfidence,
    ruleSeverity: normalizedRuleSeverity,
    failedAuthAttempts: fails,
  };
}

/**
 * Calculates deterministic risk score (0–100), severity, and policy action.
 *
 * @param {object} signals - Security telemetry inputs.
 * @param {object} customConfig - Optional weight and threshold overrides.
 * @returns {object} Standardized risk assessment output.
 */
function calculateRisk(signals = {}, customConfig = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...customConfig.weights };
  const thresholds = { ...DEFAULT_THRESHOLDS, ...customConfig.thresholds };
  const actions = { ...DEFAULT_ACTIONS, ...customConfig.actions };

  const norm = normalizeSignals(signals);

  // Compute weighted sum
  const totalWeight =
    weights.ai +
    weights.rule +
    weights.anomaly +
    weights.failedAuth +
    weights.requestFrequency +
    weights.historicalViolations;

  const rawWeightedScore =
    (norm.aiScore * weights.ai +
      norm.ruleScore * weights.rule +
      norm.anomalyScore100 * weights.anomaly +
      norm.authScore * weights.failedAuth +
      norm.freqScore * weights.requestFrequency +
      norm.histScore * weights.historicalViolations) /
    (totalWeight || 1.0);

  let finalScore = rawWeightedScore;

  // Defensive Overrides (Floors):
  // High-confidence critical signals enforce baseline risk floors to prevent
  // benign peripheral metrics from diluting an obvious active exploit.
  const factors = [];

  if (norm.ruleSeverity === 'CRITICAL') {
    finalScore = Math.max(finalScore, 85);
    factors.push('CRITICAL_RULE_MATCH_FLOOR');
  } else if (norm.ruleSeverity === 'HIGH') {
    finalScore = Math.max(finalScore, 65);
    factors.push('HIGH_RULE_MATCH_FLOOR');
  }

  if (norm.threatType !== 'NORMAL') {
    if (norm.aiConfidence >= 0.95) {
      finalScore = Math.max(finalScore, 85);
      factors.push('HIGH_CONFIDENCE_AI_EXPLOIT_FLOOR');
    } else if (norm.aiConfidence >= 0.80) {
      finalScore = Math.max(finalScore, 65);
      factors.push('MODERATE_CONFIDENCE_AI_EXPLOIT_FLOOR');
    }
  }

  if (norm.failedAuthAttempts >= 5) {
    finalScore = Math.max(finalScore, 80);
    factors.push('ACCOUNT_LOCKOUT_BURST_FLOOR');
  }

  // Ensure strict bounding between 0 and 100 as an integer
  const boundedScore = Math.min(100, Math.max(0, Math.round(finalScore)));

  const severity = mapSeverity(boundedScore, thresholds);
  const action = mapAction(severity, actions);

  return {
    riskScore: boundedScore,
    severity,
    action,
    factors,
    breakdown: {
      ai: Math.round(norm.aiScore),
      rule: Math.round(norm.ruleScore),
      anomaly: Math.round(norm.anomalyScore100),
      failedAuth: Math.round(norm.authScore),
      frequency: Math.round(norm.freqScore),
      history: Math.round(norm.histScore),
    },
  };
}

module.exports = {
  calculateRisk,
  mapSeverity,
  mapAction,
  normalizeSignals,
  DEFAULT_THRESHOLDS,
  DEFAULT_ACTIONS,
  DEFAULT_WEIGHTS,
};