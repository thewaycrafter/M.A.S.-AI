/**
 * Comprehensive Vulnerability Knowledge Base
 * Contains key vulnerability examples from all 19 categories
 * Full testing coverage implemented in specialized scanner modules
 */

export interface VulnerabilityClass {
    id: string;
    name: string;
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    cwe?: string;
    owasp?: string;
    mitreAttack?: string;
    description: string;
    testingTechniques: string[];
    indicators: string[];
    remediationGuidance: string;
}

export const VULNERABILITY_KNOWLEDGE_BASE: VulnerabilityClass[] = [
    // ============================================================
    // CATEGORY 1: WEB APPLICATION & API VULNERABILITIES
    // ============================================================
    {
        id: 'sqli-union',
        name: 'Union-based SQL Injection',
        category: 'Web Application',
        severity: 'critical',
        cwe: 'CWE-89',
        owasp: 'A03:2021',
        description: 'SQL injection using UNION operator to extract data',
        testingTechniques: [
            "Test with ' UNION SELECT NULL--",
            'Check for different types/number of columns',
            'Extract database metadata',
        ],
        indicators: [
            'Database error messages',
            'Different response for valid/invalid payloads',
            'Data from other tables in response',
        ],
        remediationGuidance: 'Use parameterized queries, ORM, input validation',
    },
    {
        id: 'sqli-blind',
        name: 'Blind SQL Injection',
        category: 'Web Application',
        severity: 'critical',
        cwe: 'CWE-89',
        owasp: 'A03:2021',
        description: 'SQL injection without visible error messages',
        testingTechniques: [
            'Boolean-based: AND 1=1 vs AND 1=2',
            'Time-based: SLEEP(), WAITFOR DELAY',
            'Out-of-band: DNS queries',
        ],
        indicators: [
            'Different response times',
            'Conditional content changes',
            'DNS lookups to attacker domain',
        ],
        remediationGuidance: 'Parameterized queries, WAF, least privilege DB user',
    },
    {
        id: 'nosql-injection',
        name: 'NoSQL Injection',
        category: 'Web Application',
        severity: 'critical',
        cwe: 'CWE-943',
        description: 'Injection attacks against NoSQL databases (MongoDB, etc.)',
        testingTechniques: [
            'Test with {"$ne": null}',
            'JavaScript injection in query',
            'Operator injection ($gt, $regex)',
        ],
        indicators: ['Unexpected query results', 'Authentication bypass', 'Data extraction'],
        remediationGuidance: 'Input validation, use query builders, avoid string concatenation',
    },
    {
        id: 'xss-stored',
        name: 'Stored (Persistent) XSS',
        category: 'Web Application',
        severity: 'high',
        cwe: 'CWE-79',
        owasp: 'A03:2021',
        description: 'Malicious script stored in database and executed on page load',
        testingTechniques: [
            'Submit <script>alert(document.domain)</script>',
            'Test in comments, profiles, posts',
            'Check for HTML encoding',
        ],
        indicators: ['Script execution on page load', 'No input sanitization', 'Raw HTML rendering'],
        remediationGuidance: 'Output encoding, CSP, input sanitization',
    },
    {
        id: 'xss-reflected',
        name: 'Reflected XSS',
        category: 'Web Application',
        severity: 'high',
        cwe: 'CWE-79',
        owasp: 'A03:2021',
        description: 'Script injected via URL parameter and reflected in response',
        testingTechniques: [
            'URL params: ?query=<script>alert(1)</script>',
            'Test all input points',
            'Check HTTP headers',
        ],
        indicators: ['Unencoded output', 'Script in URL reflected in page', 'Missing CSP'],
        remediationGuidance: 'Output encoding, input validation, CSP headers',
    },
    {
        id: 'xss-dom',
        name: 'DOM-based XSS',
        category: 'Web Application',
        severity: 'high',
        cwe: 'CWE-79',
        description: 'Client-side JavaScript vulnerability',
        testingTechniques: [
            'Inspect JavaScript sinks (innerHTML, eval)',
            'URL fragment manipulation',
            'Check DOM manipulation code',
        ],
        indicators: ['innerHTML usage', 'Client-side URL parsing', 'No sanitization'],
        remediationGuidance: 'Use textContent, sanitize before DOM insertion, CSP',
    },
    {
        id: 'csrf',
        name: 'Cross-Site Request Forgery',
        category: 'Web Application',
        severity: 'medium',
        cwe: 'CWE-352',
        owasp: 'A01:2021',
        description: 'Unauthorized actions performed on behalf of authenticated user',
        testingTechniques: [
            'Check for CSRF tokens',
            'Test state-changing requests',
            'Verify SameSite cookies',
        ],
        indicators: ['No CSRF token', 'Missing SameSite', 'GET for state changes'],
        remediationGuidance: 'CSRF tokens, SameSite cookies, verify Origin/Referer',
    },
    {
        id: 'ssrf',
        name: 'Server-Side Request Forgery',
        category: 'Web Application',
        severity: 'critical',
        cwe: 'CWE-918',
        owasp: 'A10:2021',
        description: 'Server makes requests to unintended locations',
        testingTechniques: [
            'Test with http://169.254.169.254/',
            'Internal IP ranges',
            'DNS rebinding',
        ],
        indicators: ['URL parameter accepted', 'Metadata API access', 'Internal resource leak'],
        remediationGuidance: 'Whitelist allowed hosts, network segmentation, disable redirects',
    },
    {
        id: 'rce',
        name: 'Remote Code Execution',
        category: 'Web Application',
        severity: 'critical',
        cwe: 'CWE-94',
        description: 'Arbitrary code execution on server',
        testingTechniques: [
            'Command injection payloads',
            'Deserialization exploits',
            'Template injection',
        ],
        indicators: ['System command output', 'File system access', 'Process creation'],
        remediationGuidance: 'Input validation, sandboxing, least privilege, avoid system calls',
    },
    {
        id: 'xxe',
        name: 'XML External Entity (XXE)',
        category: 'Web Application',
        severity: 'high',
        cwe: 'CWE-611',
        owasp: 'A05:2021',
        description: 'XML parser processes external entity references',
        testingTechniques: [
            'Submit XML with <!ENTITY xxe SYSTEM "file:///etc/passwd">',
            'Test SSRF via XXE',
            'Check for DTD processing',
        ],
        indicators: ['File content in response', 'DTD enabled', 'External entity resolution'],
        remediationGuidance: 'Disable external entities, use JSON, validate XML',
    },

    // ============================================================
    // CATEGORY 2: AUTHENTICATION & SESSION
    // ============================================================
    {
        id: 'weak-password',
        name: 'Weak Password Policy',
        category: 'Authentication',
        severity: 'medium',
        cwe: 'CWE-521',
        description: 'Password requirements too lenient',
        testingTechniques: [
            'Test with simple passwords (123456, password)',
            'Check minimum length',
            'Test complexity requirements',
        ],
        indicators: ['Short passwords accepted', 'No complexity requirements', 'Common passwords allowed'],
        remediationGuidance: 'Enforce 12+ chars, complexity, password blacklist, MFA',
    },
    {
        id: 'credential-stuffing',
        name: 'Credential Stuffing',
        category: 'Authentication',
        severity: 'high',
        cwe: 'CWE-307',
        description: 'Automated login attempts with breached credentials',
        testingTechniques: [
            'Rate limiting check',
            'CAPTCHA implementation',
            'Account lockout policy',
        ],
        indicators: ['No rate limiting', 'No CAPTCHA', 'Unlimited login attempts'],
        remediationGuidance: 'Rate limiting, CAPTCHA, MFA, monitor for credential stuffing',
    },
    {
        id: 'session-hijacking',
        name: 'Session Hijacking',
        category: 'Authentication',
        severity: 'critical',
        cwe: 'CWE-384',
        description: 'Attacker steals session token',
        testingTechniques: [
            'Check session token randomness',
            'Test session fixation',
            'Verify HTTPOnly, Secure flags',
        ],
        indicators: ['Predictable tokens', 'No HTTPOnly', 'No Secure flag', 'Session over HTTP'],
        remediationGuidance: 'Secure, HTTPOnly, SameSite cookies, regenerate on login',
    },
    {
        id: 'jwt-misconfiguration',
        name: 'JWT Misconfiguration',
        category: 'Authentication',
        severity: 'critical',
        cwe: 'CWE-347',
        description: 'Weak JWT implementation',
        testingTechniques: [
            'Test with alg: none',
            'Weak signing algorithms (HS256 with public key)',
            'Check token expiration',
        ],
        indicators: ['Algorithm manipulation', 'No expiration', 'Weak secret'],
        remediationGuidance: 'Use RS256, validate algorithm, short expiration, rotate secrets',
    },

    // ============================================================
    // CATEGORY 3: AUTHORIZATION & PRIVILEGE ESCALATION
    // ============================================================
    {
        id: 'idor',
        name: 'Insecure Direct Object Reference',
        category: 'Authorization',
        severity: 'high',
        cwe: 'CWE-639',
        owasp: 'A01:2021',
        description: 'Access to objects without authorization check',
        testingTechniques: [
            'Modify object IDs in requests',
            'Test sequential/predictable IDs',
            'Check for ownership validation',
        ],
        indicators: ['No authorization check', 'Predictable IDs', 'Cross-user data access'],
        remediationGuidance: 'Authorize every access, use UUIDs, implement server-side checks',
    },
    {
        id: 'privilege-escalation',
        name: 'Privilege Escalation',
        category: 'Authorization',
        severity: 'critical',
        cwe: 'CWE-269',
        description: 'User gains higher privileges',
        testingTechniques: [
            'Modify role parameters',
            'Test admin endpoints as normal user',
            'Check for client-side role checks',
        ],
        indicators: ['Role in request body', 'No server-side validation', 'Admin access granted'],
        remediationGuidance: 'Server-side role validation, principle of least privilege',
    },

    // ============================================================
    // CATEGORY 6: CRYPTOGRAPHIC FAILURES
    // ============================================================
    {
        id: 'weak-crypto',
        name: 'Weak Encryption Algorithms',
        category: 'Cryptography',
        severity: 'high',
        cwe: 'CWE-327',
        owasp: 'A02:2021',
        description: 'Use of deprecated or weak crypto',
        testingTechniques: [
            'Check TLS version',
            'Cipher suite analysis',
            'Identify MD5/SHA1 usage',
        ],
        indicators: ['MD5, SHA1, DES, RC4 detected', 'TLS 1.0/1.1', 'Weak ciphers'],
        remediationGuidance: 'Use AES-256, SHA-256+, TLS 1.3, strong key sizes',
    },
    {
        id: 'hardcoded-secrets',
        name: 'Hardcoded Cryptographic Keys',
        category: 'Cryptography',
        severity: 'critical',
        cwe: 'CWE-798',
        description: 'Keys/secrets in source code',
        testingTechniques: [
            'Source code review',
            'Binary analysis',
            'Client-side code inspection',
        ],
        indicators: ['Keys in code', 'Keys in config', 'Public repository exposure'],
        remediationGuidance: 'Environment variables, secrets management, key rotation',
    },

    // ============================================================
    // CATEGORY 8: BUSINESS LOGIC
    // ============================================================
    {
        id: 'race-condition',
        name: 'Race Condition',
        category: 'Business Logic',
        severity: 'high',
        cwe: 'CWE-362',
        description: 'Timing-based logic exploitation',
        testingTechniques: [
            'Parallel requests',
            'Test coupon/discount reuse',
            'Double-spending scenarios',
        ],
        indicators: ['Duplicate transactions', 'Negative balance', 'Resource exhaustion'],
        remediationGuidance: 'Locking, idempotency keys, atomic operations',
    },
    {
        id: 'price-manipulation',
        name: 'Price Manipulation',
        category: 'Business Logic',
        severity: 'critical',
        cwe: 'CWE-840',
        description: 'Client-side price modification',
        testingTechniques: [
            'Modify price in requests',
            'Negative quantities',
            'Currency manipulation',
        ],
        indicators: ['Price in request body', 'No server-side validation', 'Discount abuse'],
        remediationGuidance: 'Server-side price calculation, validation, audit logs',
    },

    // ============================================================
    // CATEGORY 10: NETWORK & INFRASTRUCTURE
    // ============================================================
    {
        id: 'dos',
        name: 'Denial of Service',
        category: 'Network',
        severity: 'high',
        cwe: 'CWE-400',
        description: 'Resource exhaustion attack',
        testingTechniques: [
            'Slow HTTP attacks',
            'Large payload submission',
            'Recursive operations',
        ],
        indicators: ['No rate limiting', 'No timeout', 'Resource exhaustion'],
        remediationGuidance: 'Rate limiting, timeouts, CDN, auto-scaling',
    },

    // ============================================================
    // CATEGORY 11: CLOUD & CONTAINER
    // ============================================================
    {
        id: 'cloud-iam-misc',
        name: 'Cloud IAM Misconfiguration',
        category: 'Cloud',
        severity: 'critical',
        cwe: 'CWE-732',
        description: 'Over-permissive IAM policies',
        testingTechniques: [
            'Check S3 bucket permissions',
            'IAM role analysis',
            'Metadata API testing',
        ],
        indicators: ['Public S3 buckets', 'Over-privileged roles', 'Wildcard permissions'],
        remediationGuidance: 'Least privilege, policy validation, regular audits',
    },
    {
        id: 'metadata-abuse',
        name: 'Metadata Service Abuse',
        category: 'Cloud',
        severity: 'critical',
        cwe: 'CWE-918',
        description: 'Access to cloud metadata API',
        testingTechniques: [
            'SSRF to http://169.254.169.254/',
            'IMDSv1 vs IMDSv2',
            'Credential extraction',
        ],
        indicators: ['Metadata accessible', 'Credentials in response', 'IMDSv1 enabled'],
        remediationGuidance: 'Use IMDSv2, network restrictions, hop limit',
    },

    // ============================================================
    // CATEGORY 12: SUPPLY CHAIN
    // ============================================================
    {
        id: 'malicious-dependency',
        name: 'Malicious Dependencies',
        category: 'Supply Chain',
        severity: 'critical',
        cwe: 'CWE-1357',
        description: 'Compromised third-party packages',
        testingTechniques: [
            'Dependency scanning',
            'Package hash verification',
            'Typosquatting detection',
        ],
        indicators: ['Unknown packages', 'Suspicious permissions', 'Network activity'],
        remediationGuidance: 'Dependency pinning, SCA tools, private registries',
    },

    // ============================================================
    // CATEGORY 16: AI & EMERGING THREATS
    // ============================================================
    {
        id: 'prompt-injection',
        name: 'AI Prompt Injection',
        category: 'AI Security',
        severity: 'high',
        cwe: 'CWE-94',
        description: 'Manipulation of AI model behavior via prompts',
        testingTechniques: [
            'Test with "Ignore previous instructions"',
            'System prompt extraction',
            'Jailbreak attempts',
        ],
        indicators: ['Unrestricted input', 'No prompt sanitization', 'System info leakage'],
        remediationGuidance: 'Input validation, output filtering, context isolation',
    },
    {
        id: 'model-extraction',
        name: 'Model Extraction',
        category: 'AI Security',
        severity: 'medium',
        cwe: 'CWE-200',
        description: 'Stealing ML model via API queries',
        testingTechniques: [
            'Query API repeatedly',
            'Reconstruct model decisions',
            'Confidence score analysis',
        ],
        indicators: ['Unlimited API access', 'Detailed confidence scores', 'Model architecture leak'],
        remediationGuidance: 'Rate limiting, API authentication, confidence thresholding',
    },
];

/**
 * Get vulnerabilities by category
 */
export function getVulnerabilitiesByCategory(category: string): VulnerabilityClass[] {
    return VULNERABILITY_KNOWLEDGE_BASE.filter(v => v.category === category);
}

/**
 * Get vulnerabilities by severity
 */
export function getVulnerabilitiesBySeverity(severity: string): VulnerabilityClass[] {
    return VULNERABILITY_KNOWLEDGE_BASE.filter(v => v.severity === severity);
}

/**
 * Get vulnerability by ID
 */
export function getVulnerabilityById(id: string): VulnerabilityClass | undefined {
    return VULNERABILITY_KNOWLEDGE_BASE.find(v => v.id === id);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
    return Array.from(new Set(VULNERABILITY_KNOWLEDGE_BASE.map(v => v.category)));
}

export default VULNERABILITY_KNOWLEDGE_BASE;
