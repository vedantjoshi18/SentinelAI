/**
 * Deterministic Path Traversal & Local File Inclusion (LFI) Rules
 * Strictly pattern-matching based; never executes or evaluates input.
 */

const pathTraversalRules = [
  {
    id: 'TRAVERSAL_DOT_DOT_SLASH',
    category: 'PATH_TRAVERSAL',
    severity: 'HIGH',
    description: 'Directory traversal sequence (../ or ..\\)',
    pattern: /(?:\.\.\/|\.\.\\)/,
  },
  {
    id: 'TRAVERSAL_ENCODED_SLASH',
    category: 'PATH_TRAVERSAL',
    severity: 'HIGH',
    description: 'URL-encoded directory traversal sequence (%2e%2e%2f or ..%2f)',
    pattern: /(?:\.\.%2f|\.\.%5c|%2e%2e%2f|%2e%2e%5c|%2e%2e\/)/i,
  },
  {
    id: 'TRAVERSAL_UNIX_SENSITIVE_FILE',
    category: 'PATH_TRAVERSAL',
    severity: 'CRITICAL',
    description: 'Direct probe for critical Unix/Linux system files',
    pattern: /(?:\/etc\/(?:passwd|shadow|hosts|group|issue|crontab|sudoers)|\/proc\/self\/environ)/i,
  },
  {
    id: 'TRAVERSAL_WINDOWS_SENSITIVE_FILE',
    category: 'PATH_TRAVERSAL',
    severity: 'CRITICAL',
    description: 'Direct probe for critical Windows system configuration files',
    pattern: /(?:(?:win\.ini|boot\.ini|windows[\\\/]system32[\\\/]drivers[\\\/]etc[\\\/]hosts))/i,
  },
  {
    id: 'TRAVERSAL_NULL_BYTE',
    category: 'PATH_TRAVERSAL',
    severity: 'HIGH',
    description: 'Null byte termination attempt (%00 or \\0)',
    pattern: /(?:%00|\x00)/,
  },
  {
    id: 'TRAVERSAL_FILE_PROTOCOL',
    category: 'PATH_TRAVERSAL',
    severity: 'HIGH',
    description: 'Arbitrary local file access via file:// wrapper',
    pattern: /^file:\/\//i,
  },
];

module.exports = pathTraversalRules;