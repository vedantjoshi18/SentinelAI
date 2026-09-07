const mongoose = require('mongoose');
const threatService = require('../services/threatService');
const { aiClient } = require('../services/aiClient');
const riskEngine = require('../services/riskEngine');
const SecurityEvent = require('../models/SecurityEvent');

/**
 * Controller for Threat Analysis Sandbox & SOC Audit APIs
 */

/**
 * Live sandbox inspection: analyzes a raw payload string without blocking.
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

/**
 * Retrieves paginated security events with optional multi-attribute filtering.
 * Route: GET /api/threats
 */
async function getThreatEvents(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.threatType) {
      filter.threatType = req.query.threatType.toUpperCase();
    }

    if (req.query.severity) {
      filter.severity = req.query.severity.toUpperCase();
    }

    if (req.query.action) {
      filter.action = req.query.action.toUpperCase();
    }

    if (req.query.ip) {
      filter.ip = req.query.ip.trim();
    }

    if (req.query.resolved !== undefined) {
      filter.resolved = req.query.resolved === 'true';
    }

    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    if (req.query.search) {
      const q = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(q, 'i');
      filter.$or = [{ ip: regex }, { path: regex }];
    }

    const ALLOWED_SORTS = ['timestamp', 'riskScore', 'severity', 'threatType'];
    const sortField = ALLOWED_SORTS.includes(req.query.sortBy) ? req.query.sortBy : 'timestamp';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const [total, events] = await Promise.all([
      SecurityEvent.countDocuments(filter),
      SecurityEvent.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve security events',
      details: error.message,
    });
  }
}

/**
 * Aggregates SOC summary statistics for dashboard charts and metrics.
 * Route: GET /api/threats/stats
 */
async function getThreatStats(req, res) {
  try {
    const [totalEvents, blockedCount, monitoredCount, allowedCount, eventSummaries, recentThreats] =
      await Promise.all([
        SecurityEvent.countDocuments({}),
        SecurityEvent.countDocuments({ action: 'BLOCK' }),
        SecurityEvent.countDocuments({ action: 'MONITOR' }),
        SecurityEvent.countDocuments({ action: 'ALLOW' }),
        SecurityEvent.find({}).select('threatType severity riskScore'),
        SecurityEvent.find({
          $or: [{ action: 'BLOCK' }, { severity: { $in: ['HIGH', 'CRITICAL'] } }],
        })
          .sort({ timestamp: -1 })
          .limit(5),
      ]);

    // Build threat type distribution
    const byThreatType = {
      NORMAL: 0,
      SQL_INJECTION: 0,
      XSS: 0,
      PATH_TRAVERSAL: 0,
      COMMAND_INJECTION: 0,
      BEHAVIORAL_ANOMALY: 0,
      MULTIPLE: 0,
    };

    // Build severity distribution
    const bySeverity = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    let totalRiskScore = 0;

    for (const ev of eventSummaries) {
      if (ev.threatType && byThreatType[ev.threatType] !== undefined) {
        byThreatType[ev.threatType] = (byThreatType[ev.threatType] || 0) + 1;
      } else if (ev.threatType) {
        byThreatType[ev.threatType] = 1;
      }

      if (ev.severity && bySeverity[ev.severity] !== undefined) {
        bySeverity[ev.severity] = (bySeverity[ev.severity] || 0) + 1;
      }

      totalRiskScore += (typeof ev.riskScore === 'number' ? ev.riskScore : 0);
    }

    const avgRiskScore =
      eventSummaries.length > 0
        ? Math.round(totalRiskScore / eventSummaries.length)
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalEvents,
        blockedCount,
        monitoredCount,
        allowedCount,
        avgRiskScore,
        byThreatType,
        bySeverity,
        recentThreats,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve threat statistics',
      details: error.message,
    });
  }
}

/**
 * Retrieves single security event details by ID.
 * Route: GET /api/threats/:id
 */
async function getThreatById(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        error: 'Security event not found',
      });
    }

    const event = await SecurityEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Security event not found',
      });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve security event',
      details: error.message,
    });
  }
}

/**
 * Updates incident resolution status and analyst notes.
 * Route: PATCH /api/threats/:id/status
 */
async function updateThreatStatus(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        error: 'Security event not found',
      });
    }

    const updates = {};
    if (req.body.resolved !== undefined) {
      updates.resolved = Boolean(req.body.resolved);
    }
    if (typeof req.body.notes === 'string') {
      updates.notes = req.body.notes;
    }

    const updated = await SecurityEvent.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Security event not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Security event updated successfully',
      event: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update security event status',
      details: error.message,
    });
  }
}

module.exports = {
  inspectPayload,
  getThreatEvents,
  getThreatStats,
  getThreatById,
  updateThreatStatus,
};
