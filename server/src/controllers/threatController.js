const threatService = require('../services/threatService');
const { aiClient } = require('../services/aiClient');
const riskEngine = require('../services/riskEngine');

/**
 * Controller for Threat Analysis Sandbox & Diagnostic APIs
 */
async function inspectPayload(req, res) {
  try {
    const payload = req.body?.payload || req.body?.text || req.body?.input || '';
    const requestFrequency = parseInt(req.body?.requestFrequency, 10) || 1;
    const failedAuthAttempts = parseInt(req.body?.failedAuthAttempts, 10) || 0;
    const anomalyScore = parseFloat(req.body?.anomalyScore) || 0.0;

    if (!payload || typeof payload !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Payload string is required for security inspection',
      });
    }

    // 1. Run Deterministic Rule Engine
    const ruleResult = threatService.analyzeInput(payload);

    // 2. Run AI Payload Classifier
    const aiResult = await aiClient.predict(payload);

    // 3. Compute Risk Engine Assessment
    const riskResult = riskEngine.calculateRisk({
      threatType: aiResult.threatType,
      aiConfidence: aiResult.confidence,
      ruleSeverity: ruleResult.ruleSeverity,
      anomalyScore,
      requestFrequency,
      failedAuthAttempts,
    });

    // 4. Determine primary classification
    let threatType = 'NORMAL';
    if (ruleResult.ruleCategory && ruleResult.ruleCategory !== 'NONE' && ruleResult.ruleCategory !== 'NORMAL') {
      threatType = ruleResult.ruleCategory;
    } else if (aiResult.threatType && aiResult.threatType !== 'NORMAL') {
      threatType = aiResult.threatType;
    }

    return res.status(200).json({
      success: true,
      analysis: {
        payload,
        threatType,
        riskScore: riskResult.riskScore,
        severity: riskResult.severity,
        action: riskResult.action,
        factors: riskResult.factors,
        breakdown: riskResult.breakdown,
        rules: {
          hasMatches: ruleResult.hasMatches,
          matches: ruleResult.ruleMatches,
          severity: ruleResult.ruleSeverity,
          details: ruleResult.details,
        },
        ai: {
          threatType: aiResult.threatType,
          confidence: aiResult.confidence,
          modelVersion: aiResult.modelVersion,
          probabilities: aiResult.probabilities,
          available: aiResult.available,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error evaluating threat payload',
      details: error.message,
    });
  }
}

module.exports = {
  inspectPayload,
};
