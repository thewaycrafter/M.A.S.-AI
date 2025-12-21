/**
 * Input Validation Middleware
 * Validates and sanitizes user inputs before processing
 */

// Blocked domains that should never be scanned
const BLOCKED_DOMAINS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    'internal',
    'intranet',
    'local',
    '.local',
    '.internal',
    '.corp',
    '.lan',
];

// Allowed TLDs (top-level domains) - just a safety check
const COMMON_TLDS = [
    'com', 'org', 'net', 'io', 'co', 'ai', 'dev', 'app', 'tech', 'online',
    'info', 'biz', 'us', 'uk', 'de', 'fr', 'in', 'au', 'ca', 'jp', 'cn',
    'edu', 'gov', 'mil', 'xyz', 'site', 'me', 'tv', 'cc', 'ly', 'to',
];

// Maximum length for target
const MAX_TARGET_LENGTH = 253; // DNS max length

// Regex patterns for validation
const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export interface ValidationResult {
    valid: boolean;
    cleanTarget?: string;
    error?: string;
    warnings?: string[];
}

/**
 * Validates and sanitizes a scan target
 */
export function validateScanTarget(target: string): ValidationResult {
    const warnings: string[] = [];

    // Check if target exists
    if (!target || typeof target !== 'string') {
        return { valid: false, error: 'Target is required' };
    }

    // Trim and lowercase
    let cleanTarget = target.trim().toLowerCase();

    // Check length
    if (cleanTarget.length === 0) {
        return { valid: false, error: 'Target cannot be empty' };
    }

    if (cleanTarget.length > MAX_TARGET_LENGTH) {
        return { valid: false, error: `Target is too long (max ${MAX_TARGET_LENGTH} characters)` };
    }

    // Remove protocol if present
    cleanTarget = cleanTarget.replace(/^https?:\/\//, '');

    // Remove path, query string, port
    cleanTarget = cleanTarget.split('/')[0];
    cleanTarget = cleanTarget.split('?')[0];
    cleanTarget = cleanTarget.split('#')[0];
    cleanTarget = cleanTarget.split(':')[0]; // Remove port

    // Remove www prefix
    cleanTarget = cleanTarget.replace(/^www\./, '');

    // Check for blocked/internal domains
    for (const blocked of BLOCKED_DOMAINS) {
        if (cleanTarget === blocked || cleanTarget.endsWith(blocked)) {
            return {
                valid: false,
                error: 'Cannot scan internal, localhost, or private network addresses'
            };
        }
    }

    // Check for IP addresses in private ranges
    if (IP_REGEX.test(cleanTarget)) {
        const parts = cleanTarget.split('.').map(Number);

        // 127.x.x.x - Loopback
        if (parts[0] === 127) {
            return { valid: false, error: 'Cannot scan localhost addresses' };
        }

        // 10.x.x.x - Private
        if (parts[0] === 10) {
            return { valid: false, error: 'Cannot scan private network addresses (10.x.x.x)' };
        }

        // 172.16.x.x - 172.31.x.x - Private
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
            return { valid: false, error: 'Cannot scan private network addresses (172.16-31.x.x)' };
        }

        // 192.168.x.x - Private
        if (parts[0] === 192 && parts[1] === 168) {
            return { valid: false, error: 'Cannot scan private network addresses (192.168.x.x)' };
        }

        // 0.x.x.x - Reserved
        if (parts[0] === 0) {
            return { valid: false, error: 'Cannot scan reserved addresses' };
        }

        // IP is valid public address
        return { valid: true, cleanTarget, warnings };
    }

    // Validate domain format
    if (!DOMAIN_REGEX.test(cleanTarget)) {
        return { valid: false, error: 'Invalid domain format' };
    }

    // Check for at least one dot (TLD)
    if (!cleanTarget.includes('.')) {
        return { valid: false, error: 'Target must be a valid domain with TLD (e.g., example.com)' };
    }

    // Extract TLD and warn if unusual
    const parts = cleanTarget.split('.');
    const tld = parts[parts.length - 1];

    if (!COMMON_TLDS.includes(tld)) {
        warnings.push(`Unusual TLD: .${tld} - please verify the target is correct`);
    }

    // Check for suspicious patterns
    if (cleanTarget.includes('--')) {
        warnings.push('Domain contains consecutive hyphens');
    }

    if (parts.some(p => p.length > 63)) {
        return { valid: false, error: 'Domain label too long (max 63 characters per part)' };
    }

    return {
        valid: true,
        cleanTarget,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Express middleware for validating scan targets
 */
export function validateTargetMiddleware(req: any, res: any, next: any) {
    const { target } = req.body;

    const validation = validateScanTarget(target);

    if (!validation.valid) {
        return res.status(400).json({
            error: 'Invalid Target',
            message: validation.error,
            code: 'INVALID_TARGET'
        });
    }

    // Attach cleaned target and warnings to request
    req.body.cleanTarget = validation.cleanTarget;
    req.body.targetWarnings = validation.warnings;

    next();
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }

    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }

    // Optional: Add strength checks
    // if (!/[A-Z]/.test(password)) errors.push('Password should contain uppercase letter');
    // if (!/[a-z]/.test(password)) errors.push('Password should contain lowercase letter');
    // if (!/[0-9]/.test(password)) errors.push('Password should contain number');

    return { valid: errors.length === 0, errors };
}
