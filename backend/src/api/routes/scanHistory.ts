import express from 'express';
import { ScanHistory } from '../../models/ScanHistory';
import { User } from '../../models/User';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = express.Router();

// Middleware to verify admin role
const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

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

/**
 * GET /api/scan-history/admin-all
 * Get ALL users' scan history with filtering (Admin only)
 */
router.get('/admin-all', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const {
            userId,
            target,
            status,
            minRiskScore,
            maxRiskScore,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            limit = 100,
            skip = 0
        } = req.query;

        // Build query
        const query: any = {};

        if (userId) {
            query.userId = userId;
        }

        if (target) {
            query.target = { $regex: target, $options: 'i' };
        }

        if (status) {
            query.status = status;
        }

        if (minRiskScore || maxRiskScore) {
            query['results.riskScore'] = {};
            if (minRiskScore) query['results.riskScore'].$gte = parseFloat(minRiskScore);
            if (maxRiskScore) query['results.riskScore'].$lte = parseFloat(maxRiskScore);
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Execute query
        const scans = await ScanHistory.find(query)
            .populate('userId', 'username email')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(parseInt(skip as string))
            .limit(parseInt(limit as string));

        const total = await ScanHistory.countDocuments(query);

        res.json({
            scans,
            total,
            page: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
            totalPages: Math.ceil(total / parseInt(limit as string))
        });
    } catch (error) {
        console.error('Admin scan history error:', error);
        res.status(500).json({ error: 'Failed to fetch scan history' });
    }
});

/**
 * GET /api/scan-history/admin-stats
 * Get aggregate statistics for admin dashboard
 */
router.get('/admin-stats', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);
        const thisMonth = new Date(today);
        thisMonth.setMonth(thisMonth.getMonth() - 1);

        const [
            totalScans,
            todayScans,
            weekScans,
            monthScans,
            severityStats,
            topTargets,
            recentScans
        ] = await Promise.all([
            ScanHistory.countDocuments(),
            ScanHistory.countDocuments({ createdAt: { $gte: today } }),
            ScanHistory.countDocuments({ createdAt: { $gte: thisWeek } }),
            ScanHistory.countDocuments({ createdAt: { $gte: thisMonth } }),
            ScanHistory.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCritical: { $sum: '$results.critical' },
                        totalHigh: { $sum: '$results.high' },
                        totalMedium: { $sum: '$results.medium' },
                        totalLow: { $sum: '$results.low' },
                        avgRiskScore: { $avg: '$results.riskScore' },
                        totalCost: { $sum: '$metadata.cost' },
                        avgDuration: { $avg: '$metadata.duration' }
                    }
                }
            ]),
            ScanHistory.aggregate([
                { $group: { _id: '$target', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            ScanHistory.find()
                .populate('userId', 'username email')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        const stats = severityStats[0] || {
            totalCritical: 0,
            totalHigh: 0,
            totalMedium: 0,
            totalLow: 0,
            avgRiskScore: 0,
            totalCost: 0,
            avgDuration: 0
        };

        res.json({
            overview: {
                totalScans,
                todayScans,
                weekScans,
                monthScans
            },
            vulnerabilities: {
                critical: stats.totalCritical,
                high: stats.totalHigh,
                medium: stats.totalMedium,
                low: stats.totalLow,
                avgRiskScore: stats.avgRiskScore?.toFixed(2) || 0
            },
            financial: {
                totalRevenue: stats.totalCost?.toFixed(2) || 0,
                avgDuration: stats.avgDuration?.toFixed(1) || 0
            },
            topTargets,
            recentScans
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

/**
 * GET /api/scan-history/admin-users
 * Get list of unique users who have performed scans
 */
router.get('/admin-users', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const users = await ScanHistory.aggregate([
            { $group: { _id: '$userId' } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { _id: 1, username: '$user.username', email: '$user.email' } }
        ]);
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * GET /api/scan-history/admin-domains
 * Get list of unique domains/targets scanned
 */
router.get('/admin-domains', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const domains = await ScanHistory.aggregate([
            { $group: { _id: '$target', count: { $sum: 1 }, lastScanned: { $max: '$createdAt' } } },
            { $sort: { count: -1 } }
        ]);
        res.json({ domains });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch domains' });
    }
});

export default router;
