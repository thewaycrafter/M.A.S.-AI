import express from 'express';
import { writeAuditLog } from '../../services/database';

const router = express.Router();

// Authorized target whitelist (configure via environment or database)
const AUTHORIZED_TARGETS = (process.env.AUTHORIZED_TARGETS || '').split(',').filter(Boolean);
const REQUIRE_AUTHORIZATION = process.env.REQUIRE_AUTHORIZATION === 'true';

/**
 * Validate if a target is authorized for scanning
 */
export function validateTarget(target: string): { authorized: boolean; reason?: string } {
    // Skip validation if authorization not required
    if (!REQUIRE_AUTHORIZATION) {
        return { authorized: true };
    }

    // Check if target is in whitelist
    const normalizedTarget = target.toLowerCase().trim();

    // Check exact match
    if (AUTHORIZED_TARGETS.some(t => t.toLowerCase() === normalizedTarget)) {
        return { authorized: true };
    }

    // Check domain match (e.g., *.example.com)
    const targetDomain = normalizedTarget.replace(/^https?:\/\//, '').split('/')[0];
    const isAuthorized = AUTHORIZED_TARGETS.some(t => {
        const authorizedDomain = t.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

        // Wildcard matching
        if (authorizedDomain.startsWith('*.')) {
            const baseDomain = authorizedDomain.substring(2);
            return targetDomain.endsWith(baseDomain);
        }

        return authorizedDomain === targetDomain;
    });

    if (isAuthorized) {
        return { authorized: true };
    }

    return {
        authorized: false,
        reason: 'Target not in authorized list. Please add to AUTHORIZED_TARGETS or disable REQUIRE_AUTHORIZATION.',
    };
}

/**
 * POST /api/authorization/validate
 * Validate if a target is authorized
 */
router.post('/validate', async (req, res) => {
    try {
        const { target } = req.body;

        if (!target) {
            return res.status(400).json({ error: 'Target is required' });
        }

        const validation = validateTarget(target);

        // Log authorization attempt
        await writeAuditLog({
            eventType: 'authorization_check',
            target,
            action: validation.authorized ? 'Target authorized' : 'Target rejected',
            metadata: { reason: validation.reason },
        });

        res.json(validation);
    } catch (error) {
        console.error('Authorization validation error:', error);
        res.status(500).json({ error: 'Authorization validation failed' });
    }
});

/**
 * GET /api/authorization/targets
 * Get list of authorized targets (admin only)
 */
router.get('/targets', async (req, res) => {
    try {
        // In production, add authentication check here
        res.json({
            targets: AUTHORIZED_TARGETS,
            requireAuthorization: REQUIRE_AUTHORIZATION,
        });
    } catch (error) {
        console.error('Error fetching authorized targets:', error);
        res.status(500).json({ error: 'Failed to fetch authorized targets' });
    }
});

export default router;
