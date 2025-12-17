import express from 'express';
import { User } from '../../models/User';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { getPostgresPool } from '../../services/database';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Stats are for admins only' });
    }
    next();
};

// Get all users
router.get('/users', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        res.json({ users });
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update user role
router.patch('/users/:id/role', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { role } = req.body;
        if (!['free', 'pro', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Get audit logs
router.get('/audit-logs', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const pool = getPostgresPool();
        if (!pool) {
            return res.status(503).json({ error: 'Audit database not available' });
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await pool.query(
            'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({ logs: result.rows });
    } catch (error) {
        console.error('Fetch audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

export default router;
