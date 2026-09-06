const UserBehaviour = require('../models/UserBehaviour');

/**
 * SentinelAI Behaviour Service
 * In-memory high-throughput sliding window telemetry engine and database bridge.
 * Tracks user/IP request rate, burst velocity, auth failures, 4xx error rate,
 * endpoint entropy, and inter-request timing for the AI Anomaly Detector.
 */

const WINDOW_MS = 60 * 1000; // 60 seconds sliding window
const BURST_MS = 10 * 1000;  // 10 seconds peak burst window

class BehaviourService {
  constructor() {
    this.store = new Map();
  }

  /**
   * Retrieves or initializes an in-memory tracking record for an entity.
   */
  _getEntity(entityId, entityType = 'IP', meta = {}) {
    if (!this.store.has(entityId)) {
      this.store.set(entityId, {
        entityId,
        entityType,
        userId: meta.userId || null,
        ip: meta.ip || (entityType === 'IP' ? entityId : ''),
        requests: [],
        failedAuthCount: 0,
        historicalViolations: 0,
        lastAnomalyScore: 0.0,
        lastAnomalyLevel: 'NORMAL',
        isAnomaly: false,
        totalRequests: 0,
        lastActive: Date.now(),
      });
    }
    const entity = this.store.get(entityId);
    if (meta.userId) entity.userId = meta.userId;
    if (meta.ip) entity.ip = meta.ip;
    return entity;
  }

  /**
   * Records an incoming HTTP request and computes 6-dimensional telemetry.
   *
   * @param {string} entityId - IP address or User ID string.
   * @param {object} options - Request metadata.
   * @returns {object} Calculated 6-feature telemetry.
   */
  recordRequest(entityId, options = {}) {
    if (!entityId) return this.getDefaultTelemetry();

    const entityType = options.entityType || 'IP';
    const entity = this._getEntity(entityId, entityType, options);
    const now = typeof options.timestamp === 'number' ? options.timestamp : Date.now();

    // 1. Prune timestamps outside the 60s sliding window
    entity.requests = entity.requests.filter((r) => r.timestamp >= now - WINDOW_MS);

    // 2. Add current request record
    const path = options.path || '/';
    const isError4xx = Boolean(options.isError4xx);
    entity.requests.push({ timestamp: now, path, isError4xx });
    entity.totalRequests += 1;
    entity.lastActive = now;

    // 3. Compute telemetry features
    return this.calculateTelemetry(entity, now);
  }

  /**
   * Marks the most recent request for an entity as a 4xx client error.
   */
  recordError4xx(entityId) {
    if (!entityId || !this.store.has(entityId)) return;
    const entity = this.store.get(entityId);
    if (entity.requests.length > 0) {
      entity.requests[entity.requests.length - 1].isError4xx = true;
    }
  }

  /**
   * Records a failed authentication attempt.
   */
  recordAuthFailure(entityId, entityType = 'IP') {
    if (!entityId) return;
    const entity = this._getEntity(entityId, entityType);
    entity.failedAuthCount = (entity.failedAuthCount || 0) + 1;
    entity.lastActive = Date.now();
  }

  /**
   * Resets the failed authentication counter upon successful login.
   */
  recordAuthSuccess(entityId) {
    if (!entityId || !this.store.has(entityId)) return;
    const entity = this.store.get(entityId);
    entity.failedAuthCount = 0;
  }

  /**
   * Records a security violation (BLOCK action) for the entity.
   */
  recordViolation(entityId, entityType = 'IP') {
    if (!entityId) return;
    const entity = this._getEntity(entityId, entityType);
    entity.historicalViolations = (entity.historicalViolations || 0) + 1;
  }

  /**
   * Retrieves current historical violation count for an entity.
   */
  getHistoricalViolations(entityId) {
    if (!entityId || !this.store.has(entityId)) return 0;
    return this.store.get(entityId).historicalViolations || 0;
  }

  /**
   * Updates anomaly classification state from the AI microservice.
   */
  updateAnomalyResult(entityId, anomalyResult = {}) {
    if (!entityId || !this.store.has(entityId)) return;
    const entity = this.store.get(entityId);
    entity.lastAnomalyScore = anomalyResult.anomaly_score || 0.0;
    entity.lastAnomalyLevel = anomalyResult.anomaly_level || 'NORMAL';
    entity.isAnomaly = Boolean(anomalyResult.is_anomaly);
  }

  /**
   * Computes 6-dimensional telemetry vector from an entity's sliding window.
   */
  calculateTelemetry(entity, now = Date.now()) {
    const validRequests = entity.requests.filter((r) => r.timestamp >= now - WINDOW_MS);
    entity.requests = validRequests;

    // 1. Request frequency: count in last 60 seconds
    const request_frequency = Math.max(1.0, validRequests.length);

    // 2. Burst frequency: count in last 10 seconds
    const burstRequests = validRequests.filter((r) => r.timestamp >= now - BURST_MS);
    const burst_frequency = Math.max(1.0, burstRequests.length);

    // 3. Failed auth count
    const failed_auth_count = Math.max(0, entity.failedAuthCount || 0);

    // 4. Error 4xx rate: proportion of 4xx responses in current window
    const errorCount = validRequests.filter((r) => r.isError4xx).length;
    const error_4xx_rate = validRequests.length > 0
      ? Math.min(1.0, Math.max(0.0, Number((errorCount / validRequests.length).toFixed(4))))
      : 0.0;

    // 5. Path entropy: number of distinct endpoints visited
    const uniquePaths = new Set(validRequests.map((r) => r.path));
    const path_entropy = Math.max(1.0, uniquePaths.size);

    // 6. Average inter-request arrival interval in milliseconds
    let avg_interval_ms = 5000.0;
    if (validRequests.length >= 2) {
      const intervals = [];
      for (let i = 1; i < validRequests.length; i++) {
        intervals.push(validRequests[i].timestamp - validRequests[i - 1].timestamp);
      }
      const sum = intervals.reduce((acc, val) => acc + val, 0);
      avg_interval_ms = Math.max(0.0, Number((sum / intervals.length).toFixed(2)));
    }

    return {
      request_frequency,
      burst_frequency,
      failed_auth_count,
      error_4xx_rate,
      path_entropy,
      avg_interval_ms,
    };
  }

  /**
   * Returns current telemetry features for an entity.
   */
  getTelemetry(entityId, now = Date.now()) {
    if (!entityId || !this.store.has(entityId)) {
      return this.getDefaultTelemetry();
    }
    const entity = this.store.get(entityId);
    return this.calculateTelemetry(entity, now);
  }

  /**
   * Safe default telemetry for new/unknown entities.
   */
  getDefaultTelemetry() {
    return {
      request_frequency: 1.0,
      burst_frequency: 1.0,
      failed_auth_count: 0,
      error_4xx_rate: 0.0,
      path_entropy: 1.0,
      avg_interval_ms: 5000.0,
    };
  }

  /**
   * Asynchronously persists behavioral profile to MongoDB UserBehaviour.
   * Fire-and-forget: guaranteed never to throw or block request processing.
   */
  async persistToDb(entityId, entityType = 'IP', telemetry = {}, anomalyResult = {}) {
    if (!entityId) return null;

    try {
      const entity = this.store.get(entityId);
      const uniquePaths = entity ? Array.from(new Set(entity.requests.map((r) => r.path))) : [];

      const updateData = {
        entityId,
        entityType,
        ip: entity?.ip || (entityType === 'IP' ? entityId : ''),
        userId: entity?.userId || null,
        requestCount: telemetry.request_frequency || 1,
        burstCount: telemetry.burst_frequency || 1,
        failedAuthCount: telemetry.failed_auth_count || 0,
        error4xxCount: entity?.requests?.filter((r) => r.isError4xx).length || 0,
        totalRequests: entity?.totalRequests || 1,
        distinctPaths: uniquePaths.slice(0, 50),
        lastAnomalyScore: anomalyResult.anomaly_score ?? (entity?.lastAnomalyScore || 0.0),
        lastAnomalyLevel: anomalyResult.anomaly_level || entity?.lastAnomalyLevel || 'NORMAL',
        isAnomaly: Boolean(anomalyResult.is_anomaly ?? entity?.isAnomaly),
        historicalViolations: entity?.historicalViolations || 0,
        lastActive: new Date(),
        telemetryFeatures: telemetry,
      };

      return await UserBehaviour.findOneAndUpdate(
        { entityId, entityType },
        { $set: updateData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[BehaviourService] Failed to persist behavior:', err.message);
      }
      return null;
    }
  }

  /**
   * Cleans up stale entries older than maxAgeMs (default: 15 minutes).
   */
  cleanup(maxAgeMs = 15 * 60 * 1000) {
    const threshold = Date.now() - maxAgeMs;
    for (const [key, entity] of this.store.entries()) {
      if (entity.lastActive < threshold) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Resets all in-memory tracking (primarily for test isolation).
   */
  reset() {
    this.store.clear();
  }
}

const defaultBehaviourService = new BehaviourService();

module.exports = {
  BehaviourService,
  behaviourService: defaultBehaviourService,
  WINDOW_MS,
  BURST_MS,
};
