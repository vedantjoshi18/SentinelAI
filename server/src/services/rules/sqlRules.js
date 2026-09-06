/**
 * Deterministic SQL Injection Detection Rules
 * Strictly pattern-matching based; never executes or evaluates input.
 */

const sqlRules = [
  {
    id: 'SQLI_TAUTOLOGY',
    category: 'SQL_INJECTION',
    severity: 'HIGH',
    description: 'Tautology boolean bypass expression (e.g. OR 1=1)',
    pattern: /(?:\b(?:or|and)\b\s*\(?\s*['"]?[a-zA-Z0-9_]+['"]?\s*=\s*['"]?[a-zA-Z0-9_]+)/i,
  },
  {
    id: 'SQLI_UNION_SELECT',
    category: 'SQL_INJECTION',
    severity: 'CRITICAL',
    description: 'UNION-based SQL injection querying secondary tables',
    pattern: /\bunion\b\s+(?:all\s+)?\bselect\b/i,
  },
  {
    id: 'SQLI_COMMENT_SEQUENCE',
    category: 'SQL_INJECTION',
    severity: 'MEDIUM',
    description: 'SQL inline or line comment sequence (-- or /* */ or #)',
    pattern: /(?:--|\/\*[\s\S]*?\*\/|#(?:[\r\n]|$))/,
  },
  {
    id: 'SQLI_ADMIN_AUTH_BYPASS',
    category: 'SQL_INJECTION',
    severity: 'HIGH',
    description: 'Administrative credential bypass with comment terminating string',
    pattern: /admin['"]?\s*(?:--|#|\/\*)/i,
  },
  {
    id: 'SQLI_METADATA_PROBE',
    category: 'SQL_INJECTION',
    severity: 'HIGH',
    description: 'Database metadata/schema enumeration signature',
    pattern: /\b(?:information_schema|sys\.tables|sys\.columns|pg_catalog|sqlite_master|rdb\$fields|all_tables)\b/i,
  },
  {
    id: 'SQLI_TIME_DELAY',
    category: 'SQL_INJECTION',
    severity: 'HIGH',
    description: 'Blind time-delay execution probe (sleep, benchmark, waitfor delay)',
    pattern: /\b(?:sleep\s*\(|benchmark\s*\(|waitfor\s+delay\s+['"])/i,
  },
  {
    id: 'SQLI_DESTRUCTIVE_STACK',
    category: 'SQL_INJECTION',
    severity: 'CRITICAL',
    description: 'Stacked destructive statement (drop, truncate, delete, alter table)',
    pattern: /;\s*(?:drop\s+table|truncate\s+table|delete\s+from|alter\s+table)\b/i,
  },
];

module.exports = sqlRules;