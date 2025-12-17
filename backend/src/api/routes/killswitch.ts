import express from 'express';
import { writeAuditLog } from '../../services/database';

const router = express.Router();

// Kill switch state
let killSwitchActive = false;
let killSwitchActivatedAt: Date | null = null;
let killSwitchReason: string | null = null;

/**
 * POST /api/killswitch/activate
 * Activate the kill switch to terminate all scans
 */
router.post('/activate', async (req, res) => {
    try {
        const { reason } = req.body;

        killSwitchActive = true;
        killSwitchActivatedAt = new Date();
        killSwitchReason = reason || 'Manual activation';

        // Log kill switch activation
        await writeAuditLog({
            eventType: 'killswitch_activated',
            target: 'SYSTEM',
            action: 'Kill switch activated - all scans terminated',
            metadata: {
                reason: killSwitchReason,
                timestamp: killSwitchActivatedAt.toISOString(),
            },
        });

        console.log('🔴 KILL SWITCH ACTIVATED:', killSwitchReason);

        res.json({
            success: true,
            message: 'Kill switch activated - all scans terminated',
            activatedAt: killSwitchActivatedAt,
            reason: killSwitchReason,
        });
    } catch (error) {
        console.error('Kill switch activation error:', error);
        res.status(500).json({ error: 'Failed to activate kill switch' });
    }
});

/**
 * POST /api/killswitch/deactivate
 * Deactivate the kill switch
 */
router.post('/deactivate', async (req, res) => {
    try {
        const previousState = {
            active: killSwitchActive,
            activatedAt: killSwitchActivatedAt,
            reason: killSwitchReason,
        };

        killSwitchActive = false;
        killSwitchActivatedAt = null;
        killSwitchReason = null;

        // Log kill switch deactivation
        await writeAuditLog({
            eventType: 'killswitch_deactivated',
            target: 'SYSTEM',
            action: 'Kill switch deactivated - scans resumed',
            metadata: {
                previousState,
                deactivatedAt: new Date().toISOString(),
            },
        });

        console.log('✅ Kill switch deactivated - system operational');

        res.json({
            success: true,
            message: 'Kill switch deactivated',
            previousState,
        });
    } catch (error) {
        console.error('Kill switch deactivation error:', error);
        res.status(500).json({ error: 'Failed to deactivate kill switch' });
    }
});

/**
 * GET /api/killswitch/status
 * Get current kill switch status
 */
router.get('/status', (req, res) => {
    res.json({
        active: killSwitchActive,
        activatedAt: killSwitchActivatedAt,
        reason: killSwitchReason,
    });
});

/**
 * Check if kill switch is active (exported for use in other routes)
 */
export function isKillSwitchActive(): boolean {
    return killSwitchActive;
}

/**
 * Middleware to check kill switch before scan operations
 */
export function checkKillSwitch(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (killSwitchActive) {
        return res.status(503).json({
            error: 'Service unavailable - kill switch activated',
            reason: killSwitchReason,
            activatedAt: killSwitchActivatedAt,
        });
    }
    next();
}

export default router;
