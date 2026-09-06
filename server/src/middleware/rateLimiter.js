const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// In-memory sliding window history to track IP request frequency for telemetry
const ipRequestHistory = new Map();

/**
 * Records an IP hit and returns the number of requests made in the last 60 seconds.
 * Automatically purges timestamps older than 60 seconds.
 */
function recordAndGetFrequency(ip) {
  if (!ip) return 1;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const history = ipRequestHistory.get(ip) || [];

  // Filter out entries older than 60s
  const recent = history.filter((ts) => now - ts <= windowMs);
  recent.push(now);
  ipRequestHistory.set(ip, recent);

  // Periodically clean stale IPs if map gets large
  if (ipRequestHistory.size > 5000) {
    for (const [key, timestamps] of ipRequestHistory.entries()) {
      if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > windowMs) {
        ipRequestHistory.delete(key);
      }
    }
  }

  return recent.length;
}

/**
 * Resets IP request history (useful for test isolation).
 */
function resetFrequencyHistory() {
  ipRequestHistory.clear();
}

const isTest =
  env.NODE_ENV === 'test' ||
  process.env.NODE_ENV === 'test' ||
  process.execArgv.some((arg) => arg.includes('test')) ||
  process.argv.some((arg) => arg.includes('test'));

/**
 * General API rate limiter (120 requests per minute in production; lenient in test).
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this client, please try again later.',
  },
});

/**
 * Authentication rate limiter to deter brute-force credential stuffing.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this client, please try again after 15 minutes.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  recordAndGetFrequency,
  resetFrequencyHistory,
};
