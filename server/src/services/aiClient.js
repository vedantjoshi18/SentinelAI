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
      };
    } catch (err) {
      return {
        available: false,
        status: 'unreachable',
        modelLoaded: false,
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
