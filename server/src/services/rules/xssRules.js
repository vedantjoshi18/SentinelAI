/**
 * Deterministic Cross-Site Scripting (XSS) Detection Rules
 * Strictly pattern-matching based; never executes or evaluates input.
 */

const xssRules = [
  {
    id: 'XSS_SCRIPT_TAG',
    category: 'XSS',
    severity: 'CRITICAL',
    description: 'Explicit HTML <script> tag injection',
    pattern: /<\s*script\b[^>]*>[\s\S]*?(?:<\/\s*script\s*>|$)/i,
  },
  {
    id: 'XSS_EVENT_HANDLER',
    category: 'XSS',
    severity: 'HIGH',
    description: 'HTML inline event handler attribute injection (e.g. onerror=, onload=)',
    pattern: /\bon(?:error|load|click|mouseover|mouseenter|focus|blur|change|submit|input)\s*=\s*['"]?[^'"]+/i,
  },
  {
    id: 'XSS_JAVASCRIPT_URI',
    category: 'XSS',
    severity: 'HIGH',
    description: 'Pseudo-protocol execution scheme (javascript:, vbscript:, data:text/html)',
    pattern: /(?:javascript|vbscript|data\s*:\s*text\/html)[\s\S]*/i,
  },
  {
    id: 'XSS_DANGEROUS_TAG',
    category: 'XSS',
    severity: 'HIGH',
    description: 'Potentially malicious executable HTML elements (iframe, object, embed, svg)',
    pattern: /<\s*(?:iframe|object|embed|applet|svg|base)\b[^>]*>/i,
  },
  {
    id: 'XSS_DOM_EXFILTRATION',
    category: 'XSS',
    severity: 'HIGH',
    description: 'DOM credential or storage access attempts (document.cookie, window.location)',
    pattern: /\b(?:document\.cookie|document\.domain|window\.location|localStorage|sessionStorage)\b/i,
  },
  {
    id: 'XSS_DYNAMIC_EVAL',
    category: 'XSS',
    severity: 'CRITICAL',
    description: 'Dynamic JavaScript evaluation primitives (eval, Function, setTimeout string)',
    pattern: /\b(?:eval|Function|setTimeout|setInterval)\s*\(\s*['"][^'"]*['"]\s*\)/i,
  },
];

module.exports = xssRules;