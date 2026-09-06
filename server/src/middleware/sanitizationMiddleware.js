/**
 * Input Sanitization & NoSQL Injection Prevention Middleware
 * Proactively neutralizes Mongo operator keys ($where, $gt, etc.),
 * null-byte injection probes, and prototype pollution attacks.
 */

function sanitizeObject(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Block prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    // Strip NoSQL injection prefixes ($ and .)
    let sanitizedKey = key;
    if (sanitizedKey.startsWith('$') || sanitizedKey.includes('.')) {
      sanitizedKey = sanitizedKey.replace(/^\$+/g, '').replace(/\./g, '_');
    }

    // Sanitize string values (strip null bytes)
    if (typeof value === 'string') {
      clean[sanitizedKey] = value.replace(/\0/g, '');
    } else if (typeof value === 'object' && value !== null) {
      clean[sanitizedKey] = sanitizeObject(value, depth + 1);
    } else {
      clean[sanitizedKey] = value;
    }
  }

  return clean;
}

function sanitizationMiddleware(req, res, next) {
  // Exempt sandbox inspect payload from key stripping so analysts can inspect raw attack keys
  if (req.path === '/api/threats/inspect') {
    return next();
  }

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
}

module.exports = {
  sanitizationMiddleware,
  sanitizeObject,
};
