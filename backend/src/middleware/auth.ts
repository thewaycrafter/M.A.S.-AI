import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'singhal-ai-secret-key-change-in-production';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
        role: string;
    };
}

// Generate JWT token
export const generateToken = (user: any): string => {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Verify JWT token middleware
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Require specific roles
export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// Check subscription status
export const requireActiveSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { User } = await import('../models/User');
        const user = await User.findById(req.user?.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Admin always has access
        if (user.role === 'admin') {
            return next();
        }

        // Check subscription status with null checks
        if (!user.subscription || user.subscription.status !== 'active') {
            return res.status(402).json({ error: 'Subscription expired or inactive' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ error: 'Failed to verify subscription' });
    }
};

// Check usage limits
export const checkUsageLimit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { User } = await import('../models/User');
        const user: any = await User.findById(req.user?.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Admin and pro bypass limits
        if (user.role === 'admin' || user.role === 'pro') {
            return next();
        }

        // Check free tier limits
        const scansThisMonth = user.usage?.scansThisMonth || 0;
        if (scansThisMonth >= 3) {
            return res.status(429).json({
                error: 'Scan limit reached',
                message: 'Free tier limited to 3 scans per month. Upgrade to Pro for unlimited scans.',
                usage: {
                    current: scansThisMonth,
                    limit: 3,
                },
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ error: 'Failed to check usage limits' });
    }
};
