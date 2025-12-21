import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

// Tier limits configuration
export const TIER_LIMITS = {
    free: {
        scansPerMonth: 3,
        pdfDownloads: 1,
        historicalDataDays: 7,
        maxTargetsPerScan: 1,
        features: ['basic_scan', 'pdf_report'],
    },
    pro: {
        scansPerMonth: Infinity,
        pdfDownloads: Infinity,
        historicalDataDays: 365,
        maxTargetsPerScan: 10,
        features: ['basic_scan', 'pdf_report', 'api_access', 'scheduled_scans', 'advanced_agents'],
    },
    enterprise: {
        scansPerMonth: Infinity,
        pdfDownloads: Infinity,
        historicalDataDays: Infinity,
        maxTargetsPerScan: Infinity,
        features: ['basic_scan', 'pdf_report', 'api_access', 'scheduled_scans', 'advanced_agents', 'white_label', 'dedicated_support', 'custom_integrations'],
    },
};

/**
 * Middleware to verify user is authenticated
 */
export const requireAuth = async (req: any, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                error: 'Account blocked',
                message: 'Your account has been blocked. Contact support for assistance.',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = (req: any, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

/**
 * Middleware to require a minimum subscription tier
 */
export const requireTier = (minTier: 'free' | 'pro' | 'enterprise') => {
    const tierOrder = { free: 0, pro: 1, enterprise: 2 };

    return (req: any, res: Response, next: NextFunction) => {
        const userTier = req.user?.subscription?.tier || 'free';

        // Admins bypass tier restrictions
        if (req.user?.role === 'admin') {
            return next();
        }

        if (tierOrder[userTier as keyof typeof tierOrder] < tierOrder[minTier]) {
            return res.status(403).json({
                error: 'Subscription upgrade required',
                message: `This feature requires ${minTier} tier or higher`,
                currentTier: userTier,
                requiredTier: minTier,
            });
        }

        next();
    };
};

/**
 * Middleware to check if user can perform a scan
 */
export const checkScanLimit = async (req: any, res: Response, next: NextFunction) => {
    try {
        const user = req.user;

        // Admins bypass limits
        if (user.role === 'admin') {
            return next();
        }

        const canScanResult = user.canScan();

        if (!canScanResult.allowed) {
            return res.status(403).json({
                error: 'Scan limit reached',
                message: canScanResult.reason,
                currentUsage: user.usage.scansThisMonth,
                tier: user.subscription?.tier || 'free',
            });
        }

        next();
    } catch (error) {
        console.error('Scan limit check error:', error);
        return res.status(500).json({ error: 'Failed to check scan limits' });
    }
};

/**
 * Middleware to check if user has a specific feature
 */
export const requireFeature = (feature: string) => {
    return (req: any, res: Response, next: NextFunction) => {
        const userTier = req.user?.subscription?.tier || 'free';

        // Admins have all features
        if (req.user?.role === 'admin') {
            return next();
        }

        const tierFeatures = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS]?.features || [];

        if (!tierFeatures.includes(feature)) {
            return res.status(403).json({
                error: 'Feature not available',
                message: `The "${feature}" feature is not available on your current plan`,
                currentTier: userTier,
            });
        }

        next();
    };
};

/**
 * Middleware to check PDF download limits
 */
export const checkPdfDownloadLimit = async (req: any, res: Response, next: NextFunction) => {
    try {
        const user = req.user;

        // Admins and pro/enterprise bypass limits
        if (user.role === 'admin' || ['pro', 'enterprise'].includes(user.subscription?.tier)) {
            return next();
        }

        const limit = TIER_LIMITS.free.pdfDownloads;

        if (user.usage.pdfDownloadsThisMonth >= limit) {
            return res.status(403).json({
                error: 'PDF download limit reached',
                message: `Free tier allows ${limit} PDF download(s) per month. Upgrade to Pro for unlimited downloads.`,
                currentUsage: user.usage.pdfDownloadsThisMonth,
            });
        }

        next();
    } catch (error) {
        console.error('PDF limit check error:', error);
        return res.status(500).json({ error: 'Failed to check download limits' });
    }
};

/**
 * Increment scan count for user
 */
export const incrementScanCount = async (userId: string): Promise<void> => {
    await User.findByIdAndUpdate(userId, {
        $inc: {
            'usage.scansThisMonth': 1,
            'usage.totalScans': 1,
        },
        'usage.lastScanDate': new Date(),
    });
};

/**
 * Increment PDF download count for user
 */
export const incrementPdfDownloadCount = async (userId: string): Promise<void> => {
    await User.findByIdAndUpdate(userId, {
        $inc: { 'usage.pdfDownloadsThisMonth': 1 },
    });
};
