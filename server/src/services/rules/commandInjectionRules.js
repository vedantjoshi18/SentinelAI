/**
 * Deterministic Command & Shell Injection Rules
 * Strictly pattern-matching based; never executes or evaluates input.
 */

const commandInjectionRules = [
  {
    id: 'CMDI_OPERATOR_WITH_COMMAND',
    category: 'COMMAND_INJECTION',
    severity: 'CRITICAL',
    description: 'Shell operator chaining to system command execution',
    pattern: /(?:\||\&{1,2}|;|\$)\s*(?:cat\b|dir\b|whoami\b|id\b|uname\b|curl\b|wget\b|powershell\b|cmd\.exe\b|sh\b|bash\b)/i,
  },
  {
    id: 'CMDI_SUB_SHELL_EXECUTION',
    category: 'COMMAND_INJECTION',
    severity: 'CRITICAL',
    description: 'Subshell command substitution syntax ($(...) or backticks)',
    pattern: /(?:\$\([^\n\r)]+\)|`[^\n\r`]+`)/,
  },
  {
    id: 'CMDI_DIRECTORY_ENUMERATION',
    category: 'COMMAND_INJECTION',
    severity: 'HIGH',
    description: 'Windows command injection targeting directory drives',
    pattern: /(?:\+|&&|\|)+\s*dir\s+[a-zA-Z]:[\\\/]?/i,
  },
  {
    id: 'CMDI_DOWNLOAD_AND_EXECUTE',
    category: 'COMMAND_INJECTION',
    severity: 'CRITICAL',
    description: 'Remote payload download and execution pipeline',
    pattern: /(?:curl|wget)\s+https?:\/\/[\S]+\s*\|\s*(?:sh|bash|powershell|cmd)/i,
  },
  {
    id: 'CMDI_RECONNAISSANCE_COMMAND',
    category: 'COMMAND_INJECTION',
    severity: 'HIGH',
    description: 'Direct execution of system discovery utility',
    pattern: /(?:^|[;&|`$]\s*)(?:whoami|net\s+user|ipconfig|ifconfig|netstat|id\s+-u)\b/i,
  },
];

module.exports = commandInjectionRules;