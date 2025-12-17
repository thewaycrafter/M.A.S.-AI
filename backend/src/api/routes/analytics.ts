import express from 'express';
import { ScanHistory } from '../../models/ScanHistory';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = express.Router();

// Get lifetime analytics
router.get('/lifetime', requireAuth, async (req: AuthRequest, res) => {
    try {
        const scans = await ScanHistory.find({ userId: req.user?.id });

        const totalScans = scans.length;
        let vulnerabilitiesFound = 0;
        let costSaved = 0;
        let timeSaved = 0; // in hours

        scans.forEach(scan => {
            if (scan.results) {
                vulnerabilitiesFound += (scan.results.critical || 0) +
                    (scan.results.high || 0) +
                    (scan.results.medium || 0) +
                    (scan.results.low || 0);
            }

            // Estimate cost saved: ₹5000 per scan (avg pestest cost) + ₹1000 per vuln
            costSaved += 5000 + (vulnerabilitiesFound * 100);

            // Estimate time saved: 4 hours per scan
            timeSaved += 4;
        });

        res.json({
            totalScans,
            vulnerabilitiesFound,
            costSaved,
            timeSaved,
            currency: 'INR'
        });
    } catch (error) {
        console.error('Lifetime analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch lifetime analytics' });
    }
});

// Get monthly scan counts
router.get('/monthly', requireAuth, async (req: AuthRequest, res) => {
    try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const scans = await ScanHistory.find({
            userId: req.user?.id,
            createdAt: { $gte: startOfYear }
        });

        const monthlyData = new Array(12).fill(0);

        scans.forEach(scan => {
            if (scan.createdAt) {
                const month = new Date(scan.createdAt).getMonth(); // 0-11
                monthlyData[month]++;
            }
        });

        res.json({ monthlyData });
    } catch (error) {
        console.error('Monthly analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch monthly analytics' });
    }
});

// Get vulnerability breakdown
router.get('/breakdown', requireAuth, async (req: AuthRequest, res) => {
    try {
        const scans = await ScanHistory.find({ userId: req.user?.id });

        const breakdown = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };

        scans.forEach(scan => {
            if (scan.results) {
                breakdown.critical += scan.results.critical || 0;
                breakdown.high += scan.results.high || 0;
                breakdown.medium += scan.results.medium || 0;
                breakdown.low += scan.results.low || 0;
            }
        });

        res.json(breakdown);
    } catch (error) {
        console.error('Breakdown analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch vulnerability breakdown' });
    }
});

export default router;
