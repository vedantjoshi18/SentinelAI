const axios = require('axios');
const env = require('../config/env');

/**
 * SentinelAI Client for FastAPI AI Microservice
 * Handles payload classification via POST /predict with automatic fallback
 * to ensure backend resiliency if the AI service is unreachable or restarting.
 */
class AiClient {
  constructor(baseUrl = env.AI_SERVICE_URL, timeout = env.AI_SERVICE_TIMEOUT_MS) {
    this.baseUrl = (baseUrl || 'http://127.0.0.1:8000').replace(/\/+$/, '');
    this.timeout = timeout || 3000;
  }

  /**
   * Evaluates an application input or payload string using the AI model.
   *
   * @param {string} text - Request payload to evaluate.
   * @returns {Promise<object>} Standardized prediction response.
   */
  async predict(text) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return {
        threatType: 'NORMAL',
        confidence: 1.0,
        modelVersion: 'none',
        probabilities: { NORMAL: 1.0 },
        available: true,
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/predict`,
        { text },
        {
          timeout: this.timeout,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = response.data || {};
      return {
        threatType: data.threatType || 'NORMAL',
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.0,
        modelVersion: data.modelVersion || 'attack-classifier-v1',
        probabilities: data.probabilities || {},
        available: true,
      };
    } catch (err) {
      // Graceful degradation: server continues running with deterministic rules
      const isConnectionError =
        err.code === 'ECONNREFUSED' ||
        err.code === 'ENOTFOUND' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ECONNABORTED';

      return {
        threatType: 'NORMAL',
        confidence: 0.0,
        modelVersion: 'fallback',
        probabilities: {},
        available: false,
        error: isConnectionError ? `AI service offline (${err.code || 'timeout'})` : err.message,
      };
    }
  }

  /**
   * Evaluates behavioral telemetry using the Anomaly Detector AI model.
   *
   * @param {object} features - 6-dimensional behavioral telemetry.
   * @returns {Promise<object>} Standardized anomaly detection response.
   */
  async detectAnomaly(features = {}) {
    const payload = {
      request_frequency: Math.max(0.0, Number(features.request_frequency) || 0.0),
      burst_frequency: Math.max(0.0, Number(features.burst_frequency) || 0.0),
      failed_auth_count: Math.max(0, parseInt(features.failed_auth_count, 10) || 0),
      error_4xx_rate: Math.min(1.0, Math.max(0.0, Number(features.error_4xx_rate) || 0.0)),
      path_entropy: Math.max(0.0, Number(features.path_entropy) || 1.0),
      avg_interval_ms: Math.max(0.0, Number(features.avg_interval_ms) || 5000.0),
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/anomaly`,
        payload,
        {
          timeout: this.timeout,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = response.data || {};
      return {
        is_anomaly: Boolean(data.is_anomaly),
        anomaly_score: typeof data.anomaly_score === 'number' ? data.anomaly_score : 0.0,
        raw_score: typeof data.raw_score === 'number' ? data.raw_score : 0.0,
        anomaly_level: data.anomaly_level || (data.is_anomaly ? 'SUSPICIOUS' : 'NORMAL'),
        modelVersion: data.modelVersion || 'behaviour-model-v1',
        features: data.features || payload,
        available: true,
      };
    } catch (err) {
      const isConnectionError =
        err.code === 'ECONNREFUSED' ||
        err.code === 'ENOTFOUND' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ECONNABORTED';

      return {
        is_anomaly: false,
        anomaly_score: 0.0,
        raw_score: 0.0,
        anomaly_level: 'NORMAL',
        modelVersion: 'fallback',
        features: payload,
        available: false,
        error: isConnectionError ? `AI anomaly service offline (${err.code || 'timeout'})` : err.message,
      };
    }
  }

  /**
   * Health probe for the AI microservice.
   *
   * @returns {Promise<object>} Microservice health status.
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: Math.min(this.timeout, 1000),
      });

      return {
        available: true,
        status: response.data?.status || 'ok',
        modelLoaded: Boolean(response.data?.modelLoaded),
        modelVersion: response.data?.modelVersion || 'unknown',
        anomalyModelLoaded: Boolean(response.data?.anomalyModelLoaded),
        anomalyModelVersion: response.data?.anomalyModelVersion || 'unknown',
      };
    } catch (err) {
      return {
        available: false,
        status: 'unreachable',
        modelLoaded: false,
        anomalyModelLoaded: false,
        error: err.code || err.message,
      };
    }
  }
}

const defaultAiClient = new AiClient();

module.exports = {
  AiClient,
  aiClient: defaultAiClient,
};
