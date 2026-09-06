/**
 * Security Environment & Configuration Validator
 * Enforces production secrets hygiene, prevents weak fallback keys,
 * and asserts that essential cryptographic seeds meet entropy standards.
 */

function validateSecurityConfig(envConfig = {}) {
  const issues = [];

  const isProduction = envConfig.NODE_ENV === 'production';
  const jwtSecret = envConfig.JWT_SECRET || '';

  // 1. Secret Entropy & Fallback Detection
  if (isProduction) {
    if (!jwtSecret || jwtSecret.includes('fallback') || jwtSecret.includes('dev_')) {
      issues.push('CRITICAL: Default/fallback JWT_SECRET detected in production environment.');
    }
    if (jwtSecret.length < 32) {
      issues.push('CRITICAL: JWT_SECRET must be at least 32 characters long for production cryptographic strength.');
    }
  }

  // 2. Client Origin Configuration
  if (isProduction && (!envConfig.CLIENT_URL || envConfig.CLIENT_URL.includes('localhost'))) {
    issues.push('WARNING: CLIENT_URL points to localhost in production.');
  }

  return {
    valid: issues.filter((i) => i.startsWith('CRITICAL')).length === 0,
    issues,
  };
}

module.exports = {
  validateSecurityConfig,
};
