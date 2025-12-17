import express from 'express';
import { ScanHistory } from '../../models/ScanHistory';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = express.Router();

// Get user's scan history
router.get('/history', requireAuth, async (req: AuthRequest, res) => {
    try {
        const scans = await ScanHistory.find({ userId: req.user?.id })
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ scans });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scan history' });
    }
});

export default router;
