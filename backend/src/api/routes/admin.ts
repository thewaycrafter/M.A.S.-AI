import express from 'express';
import crypto from 'crypto';
import { User } from '../../models/User';
import { ScanHistory } from '../../models/ScanHistory';
import { ScanResult } from '../../models/ScanResult';
import { Authorization } from '../../models/Authorization';
import { Report } from '../../models/Report';
import { AppLog } from '../../models/AppLog';
import { requireAuth, requireAdmin } from '../../middleware/accessControl';
import { sendEmail } from '../../services/email';
import { getPostgresPool, writeAuditLog } from '../../services/database';

const router = express.Router();

// =====================
// USER MANAGEMENT
// =====================

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
router.get('/users', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const role = req.query.role as string;
        const tier = req.query.tier as string;

        let query: any = {};

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } },
            ];
        }

        if (role) query.role = role;
        if (tier) query['subscription.tier'] = tier;

        const total = await User.countDocuments(query);
        const users = await User.find(query, '-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * GET /api/admin/users/:id
 * Get single user details
 */
router.get('/users/:id', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const user = await User.findById(req.params.id, '-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's stats
        const scanCount = await ScanHistory.countDocuments({ userId: user._id });
        const recentScans = await ScanHistory.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({ user, stats: { scanCount }, recentScans });
    } catch (error) {
        console.error('Fetch user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

/**
 * POST /api/admin/users
 * Create a new user
 */
router.post('/users', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const { username, email, password, role, subscriptionTier, firstName, lastName } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Check if user already exists
        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({ error: 'User with this email or username already exists' });
        }

        const user = new User({
            username,
            email,
            password,
            role: role || 'user',
            firstName,
            lastName,
            subscription: {
                tier: subscriptionTier || 'free',
                status: 'active',
                startDate: new Date(),
            },
        });

        await user.save();

        await writeAuditLog({
            eventType: 'admin_create_user',
            target: 'admin',
            userId: req.user._id.toString(),
            action: `Admin created user: ${username}`,
            metadata: { newUserId: user._id },
        });

        res.status(201).json({
            message: 'User created successfully',
            user: { ...user.toObject(), password: undefined },
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * PATCH /api/admin/users/:id
 * Update user details
 */
router.patch('/users/:id', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const { role, subscriptionTier, firstName, lastName, company, phone } = req.body;

        const updateData: any = {};
        if (role) updateData.role = role;
        if (subscriptionTier) updateData['subscription.tier'] = subscriptionTier;
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (company) updateData.company = company;
        if (phone) updateData.phone = phone;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated', user });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete('/users/:id', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const userId = req.params.id;

        // Prevent self-deletion
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user and their data
        await ScanHistory.deleteMany({ userId });
        await ScanResult.deleteMany({ userId });
        await Authorization.deleteMany({ requesterId: userId });
        await Report.deleteMany({ userId });
        await User.findByIdAndDelete(userId);

        await writeAuditLog({
            eventType: 'admin_delete_user',
            target: 'admin',
            userId: req.user._id.toString(),
            action: `Admin deleted user: ${user.email}`,
        });

        res.json({ message: 'User and all associated data deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

/**
 * POST /api/admin/users/:id/block
 * Block a user
 */
router.post('/users/:id/block', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const { reason } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                isBlocked: true,
                blockedAt: new Date(),
                blockedReason: reason,
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await writeAuditLog({
            eventType: 'admin_block_user',
            target: 'admin',
            userId: req.user._id.toString(),
            action: `Admin blocked user: ${user.email}`,
            metadata: { reason },
        });

        res.json({ message: 'User blocked', user });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ error: 'Failed to block user' });
    }
});

/**
 * POST /api/admin/users/:id/unblock
 * Unblock a user
 */
router.post('/users/:id/unblock', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                isBlocked: false,
                blockedAt: undefined,
                blockedReason: undefined,
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await writeAuditLog({
            eventType: 'admin_unblock_user',
            target: 'admin',
            userId: req.user._id.toString(),
            action: `Admin unblocked user: ${user.email}`,
        });

        res.json({ message: 'User unblocked', user });
    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({ error: 'Failed to unblock user' });
    }
});

// =====================
// PASSWORD MANAGEMENT
// =====================

/**
 * POST /api/admin/users/:id/reset-password
 * Manually reset a user's password
 */
router.post('/users/:id/reset-password', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.password = newPassword;
        (user as any).passwordResetToken = undefined;
        (user as any).passwordResetExpires = undefined;
        await user.save();

        await writeAuditLog({
            eventType: 'admin_reset_password',
            target: 'admin',
            userId: req.user._id.toString(),
            action: `Admin reset password for user: ${user.email}`,
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

/**
 * POST /api/admin/users/:id/send-reset-link
 * Send password reset link to user
 */
router.post('/users/:id/send-reset-link', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate reset token inline
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        (user as any).passwordResetToken = hashedToken;
        (user as any).passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

        await sendEmail({
            to: user.email,
            subject: '[M.A.S. AI] Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #ffffff; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #00ff41; text-align: center;">SINGHAL AI</h1>
                    <h2 style="color: #00e5a0;">Password Reset</h2>
                    <p>An administrator has initiated a password reset for your account.</p>
                    <p>Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background: #00ff41; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p style="color: #888; font-size: 12px;">This link will expire in 1 hour. If you did not request this, please contact support.</p>
                </div>
            `,
        });

        await writeAuditLog({
            eventType: 'admin_send_reset_link',
            target: 'admin',
            userId: req.user._id.toString(),
            action: `Admin sent password reset link to: ${user.email}`,
        });

        res.json({ message: 'Password reset link sent to user' });
    } catch (error) {
        console.error('Send reset link error:', error);
        res.status(500).json({ error: 'Failed to send reset link' });
    }
});

// =====================
// SCAN & REPORT ACCESS
// =====================

/**
 * GET /api/admin/scans
 * Get all scans across all users
 */
router.get('/scans', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const userId = req.query.userId;
        const status = req.query.status;

        let query: any = {};
        if (userId) query.userId = userId;
        if (status) query.status = status;

        const total = await ScanHistory.countDocuments(query);
        const scans = await ScanHistory.find(query)
            .populate('userId', 'username email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            scans,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Fetch scans error:', error);
        res.status(500).json({ error: 'Failed to fetch scans' });
    }
});

/**
 * GET /api/admin/reports/:scanHistoryId/download
 * Download PDF report for any scan
 */
router.get('/reports/:scanHistoryId/download', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const report = await Report.findOne({ scanHistoryId: req.params.scanHistoryId });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Update download tracking inline
        await Report.findByIdAndUpdate(report._id, {
            $inc: { downloadCount: 1 },
            lastDownloadedAt: new Date(),
            lastDownloadedBy: req.user._id,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${(report as any).filename}"`);

        // Convert base64 to buffer
        const pdfBuffer = Buffer.from((report as any).pdfData, 'base64');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Download report error:', error);
        res.status(500).json({ error: 'Failed to download report' });
    }
});

// =====================
// AUTHORIZATION MANAGEMENT
// =====================

/**
 * GET /api/admin/authorizations
 * Get all authorization requests
 */
router.get('/authorizations', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const status = req.query.status;
        let query: any = {};
        if (status) query.status = status;

        const authorizations = await Authorization.find(query)
            .populate('requesterId', 'username email')
            .populate('adminApprovedBy', 'username email')
            .sort({ createdAt: -1 });

        res.json({ authorizations });
    } catch (error) {
        console.error('Fetch authorizations error:', error);
        res.status(500).json({ error: 'Failed to fetch authorizations' });
    }
});

// =====================
// APP LOGS
// =====================

/**
 * GET /api/admin/logs
 * Get application logs
 */
router.get('/logs', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const level = req.query.level;
        const source = req.query.source;
        const limit = parseInt(req.query.limit as string) || 100;

        let query: any = {};
        if (level) query.level = level;
        if (source) query.source = source;

        const logs = await AppLog.find(query)
            .sort({ timestamp: -1 })
            .limit(limit);

        res.json({ logs });
    } catch (error) {
        console.error('Fetch logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// =====================
// AUDIT LOGS (PostgreSQL)
// =====================

/**
 * GET /api/admin/audit-logs
 * Get audit logs from PostgreSQL
 */
router.get('/audit-logs', requireAuth, requireAdmin, async (req: any, res) => {
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

// =====================
// DASHBOARD STATS
// =====================

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ lastActivityAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
        const blockedUsers = await User.countDocuments({ isBlocked: true });
        const totalScans = await ScanHistory.countDocuments();
        const completedScans = await ScanHistory.countDocuments({ status: 'completed' });
        const pendingAuthorizations = await Authorization.countDocuments({ status: 'admin_pending' });

        // Subscription breakdown
        const freeTier = await User.countDocuments({ 'subscription.tier': 'free' });
        const proTier = await User.countDocuments({ 'subscription.tier': 'pro' });
        const enterpriseTier = await User.countDocuments({ 'subscription.tier': 'enterprise' });

        res.json({
            users: { total: totalUsers, active: activeUsers, blocked: blockedUsers },
            scans: { total: totalScans, completed: completedScans },
            authorizations: { pending: pendingAuthorizations },
            subscriptions: { free: freeTier, pro: proTier, enterprise: enterpriseTier },
        });
    } catch (error) {
        console.error('Fetch stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;
