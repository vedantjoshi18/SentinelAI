/**
 * SentinelAI Security Threat Service & Deterministic Rule Engine
 * Identifies attack signatures across SQLi, XSS, Path Traversal, and Command Injection.
 *
 * CRITICAL DEFENSE GUARANTEE:
 * This engine operates solely via static pattern inspection and sub-word indicators.
 * It NEVER executes, compiles, evaluates, or runs attacker-controlled input.
 */

const { allRules } = require('./rules');

const SEVERITY_LEVELS = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NONE: 0,
};

/**
 * Safely decodes URL-encoded strings to detect evasion attempts (%27 -> ', %3C -> <)
 */
function safeDecode(str) {
  if (typeof str !== 'string') return '';
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch (e) {
    // If malformed URI, return original string
    return str;
  }
}

/**
 * Recursively extracts all string values from an arbitrary object or array.
 */
function extractStrings(input, depth = 0, maxDepth = 5) {
  if (depth > maxDepth || input === null || input === undefined) {
    return [];
  }

  if (typeof input === 'string') {
    return [input];
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return [];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => extractStrings(item, depth + 1, maxDepth));
  }

  if (typeof input === 'object') {
    return Object.entries(input).flatMap(([key, value]) => {
      // Exclude sensitive password keys from unnecessary rule inspection
      if (['password', 'passwordHash', 'token', 'secret'].includes(key.toLowerCase())) {
        return [];
      }
      return extractStrings(value, depth + 1, maxDepth);
    });
  }

  return [];
}

/**
 * Evaluates a single string against the deterministic security rules.
 */
function evaluateString(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Bound text length to prevent regex Denial of Service (ReDoS) on massive payloads
  const boundedText = text.length > 50000 ? text.substring(0, 50000) : text;
  const decodedText = safeDecode(boundedText);

  const matchedRules = [];

  for (const rule of allRules) {
    // Test raw string
    const matchRaw = rule.pattern.test(boundedText);
    // Test decoded string (if different)
    const matchDecoded = decodedText !== boundedText && rule.pattern.test(decodedText);

    if (matchRaw || matchDecoded) {
      matchedRules.push({
        id: rule.id,
        category: rule.category,
        severity: rule.severity,
        description: rule.description,
      });
    }
  }

  return matchedRules;
}

/**
 * Analyzes request payload, query, or string input against the rule engine.
 *
 * @param {string|object} input - Text string or structured request body/query to inspect.
 * @returns {object} Standardized deterministic detection output.
 */
function analyzeInput(input) {
  const stringsToScan = extractStrings(input);

  const allMatchesMap = new Map();

  for (const str of stringsToScan) {
    const matches = evaluateString(str);
    for (const match of matches) {
      if (!allMatchesMap.has(match.id)) {
        allMatchesMap.set(match.id, match);
      }
    }
  }

  const details = Array.from(allMatchesMap.values());
  const hasMatches = details.length > 0;
  const ruleMatches = details.map((d) => d.id);

  // Compute maximum severity
  let maxSeverity = 'NONE';
  let maxWeight = 0;

  for (const d of details) {
    const weight = SEVERITY_LEVELS[d.severity] || 0;
    if (weight > maxWeight) {
      maxWeight = weight;
      maxSeverity = d.severity;
    }
  }

  // Compute unique categories
  const categories = Array.from(new Set(details.map((d) => d.category)));

  let ruleCategory = 'NONE';
  if (categories.length === 1) {
    ruleCategory = categories[0];
  } else if (categories.length > 1) {
    ruleCategory = 'MULTIPLE';
  }

  return {
    hasMatches,
    ruleMatches,
    ruleSeverity: maxSeverity,
    ruleCategory,
    categories,
    details,
  };
}

module.exports = {
  analyzeInput,
  evaluateString,
  extractStrings,
  allRules,
  SEVERITY_LEVELS,
};