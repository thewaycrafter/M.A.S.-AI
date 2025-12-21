import express from 'express';
import crypto from 'crypto';
import { Authorization } from '../../models/Authorization';
import { User } from '../../models/User';
import { sendEmail } from '../../services/email';
import { writeAuditLog } from '../../services/database';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = express.Router();

// Helper function to generate approval token
const generateApprovalToken = (): { token: string; hashedToken: string; expires: Date } => {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return { token, hashedToken, expires };
};

// Middleware to verify admin role
const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

/**
 * POST /api/authorization/request
 * Submit a new authorization request
 */
router.post('/request', requireAuth, async (req: any, res) => {
    try {
        const { target, approverEmail, startDate, endDate } = req.body;
        const userId = req.user._id;

        if (!target || !approverEmail || !startDate || !endDate) {
            return res.status(400).json({
                error: 'Missing required fields: target, approverEmail, startDate, endDate'
            });
        }

        // Check existing
        const existing = await Authorization.findOne({
            requesterId: userId,
            target,
            status: { $in: ['user_pending', 'admin_pending', 'approved'] },
        });

        if (existing) {
            return res.status(400).json({
                error: 'Authorization request already exists for this target',
            });
        }

        // Generate token
        const { token, hashedToken, expires } = generateApprovalToken();

        // Create authorization
        const authorization = new Authorization({
            requesterId: userId,
            requesterEmail: req.user.email,
            target,
            approverEmail,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            userApprovalToken: hashedToken,
            userApprovalTokenExpires: expires,
        });

        await authorization.save();

        // Send email
        const approvalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/approve-authorization?token=${token}`;

        await sendEmail({
            to: approverEmail,
            subject: `[Singhal AI] Authorization Request for ${target}`,
            html: `<div style="font-family:Arial,sans-serif;background:#1a1a2e;color:#fff;padding:30px;border-radius:10px;"><h1 style="color:#00ff41;">SINGHAL AI</h1><h2 style="color:#00e5a0;">Authorization Request</h2><p>A user has requested authorization to perform security testing on: <strong>${target}</strong></p><p>Requested by: ${req.user.email}</p><p>Dates: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p><p style="margin:30px 0;"><a href="${approvalUrl}" style="background:#00ff41;color:#000;padding:15px 30px;text-decoration:none;border-radius:5px;font-weight:bold;">REVIEW REQUEST</a></p></div>`,
        });

        await writeAuditLog({
            eventType: 'authorization_request',
            target,
            userId: userId.toString(),
            action: 'Authorization request created',
            metadata: { approverEmail, startDate, endDate },
        });

        res.status(201).json({
            message: 'Authorization request submitted successfully',
            authorizationId: authorization._id,
        });

    } catch (error: any) {
        console.error('Authorization request error:', error);
        res.status(500).json({ error: 'Failed to submit authorization request' });
    }
});

/**
 * GET /api/authorization/my-requests
 * Get current user's authorization requests
 */
router.get('/my-requests', requireAuth, async (req: any, res) => {
    try {
        const authorizations = await Authorization.find({ requesterId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ authorizations });
    } catch (error) {
        console.error('Error fetching authorizations:', error);
        res.status(500).json({ error: 'Failed to fetch authorization requests' });
    }
});

/**
 * GET /api/authorization/check/:target
 * Check if a target is authorized for the current user
 */
router.get('/check/:target', requireAuth, async (req: any, res) => {
    try {
        const { target } = req.params;
        const now = new Date();

        const authorization = await Authorization.findOne({
            requesterId: req.user._id,
            target: { $regex: new RegExp(target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') },
            status: 'approved',
            startDate: { $lte: now },
            endDate: { $gte: now },
        });

        if (authorization) {
            res.json({ authorized: true, authorizationId: authorization._id, expiresAt: (authorization as any).endDate });
        } else {
            res.json({ authorized: false, message: 'No active authorization found for this target' });
        }
    } catch (error) {
        console.error('Error checking authorization:', error);
        res.status(500).json({ error: 'Failed to check authorization' });
    }
});

/**
 * POST /api/authorization/user-approve/:token
 * Handle user (domain owner) approval via email link
 */
router.post('/user-approve/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const authorization = await Authorization.findOne({
            userApprovalToken: hashedToken,
            userApprovalTokenExpires: { $gt: Date.now() },
        });

        if (!authorization) {
            return res.status(400).json({ error: 'Invalid or expired approval token' });
        }

        // Approve - update inline since methods may not be available
        await Authorization.findByIdAndUpdate(authorization._id, {
            userApprovalStatus: 'approved',
            userApprovalToken: undefined,
            userApprovalTokenExpires: undefined,
            status: 'admin_pending',
        });

        await writeAuditLog({
            eventType: 'authorization_user_approved',
            target: (authorization as any).target,
            action: 'Authorization approved by domain owner',
        });

        res.json({ message: 'Authorization approved. Pending admin approval.' });

    } catch (error) {
        console.error('User approval error:', error);
        res.status(500).json({ error: 'Failed to process approval' });
    }
});

/**
 * POST /api/authorization/user-deny/:token
 * Handle user (domain owner) denial via email link
 */
router.post('/user-deny/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { reason } = req.body;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const authorization = await Authorization.findOne({
            userApprovalToken: hashedToken,
            userApprovalTokenExpires: { $gt: Date.now() },
        });

        if (!authorization) {
            return res.status(400).json({ error: 'Invalid or expired approval token' });
        }

        await Authorization.findByIdAndUpdate(authorization._id, {
            userApprovalStatus: 'denied',
            userDenialReason: reason,
            userApprovalToken: undefined,
            userApprovalTokenExpires: undefined,
            status: 'denied',
        });

        await writeAuditLog({
            eventType: 'authorization_user_denied',
            target: (authorization as any).target,
            action: 'Authorization denied by domain owner',
            metadata: { reason },
        });

        res.json({ message: 'Authorization denied' });

    } catch (error) {
        console.error('User denial error:', error);
        res.status(500).json({ error: 'Failed to process denial' });
    }
});

/**
 * POST /api/authorization/admin-approve/:id
 * Admin approves an authorization request
 */
router.post('/admin-approve/:id', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const { id } = req.params;
        const authorization = await Authorization.findById(id);

        if (!authorization) {
            return res.status(404).json({ error: 'Authorization not found' });
        }

        if ((authorization as any).status !== 'admin_pending') {
            return res.status(400).json({ error: 'Authorization is not pending admin approval' });
        }

        await Authorization.findByIdAndUpdate(id, {
            adminApprovalStatus: 'approved',
            adminApprovedBy: req.user._id,
            adminApprovedAt: new Date(),
            status: 'approved',
        });

        // Notify requester
        await sendEmail({
            to: (authorization as any).requesterEmail,
            subject: `[Singhal AI] Authorization Approved: ${(authorization as any).target}`,
            html: `<div style="font-family:Arial,sans-serif;background:#1a1a2e;color:#fff;padding:30px;border-radius:10px;"><h1 style="color:#00ff41;">SINGHAL AI</h1><h2 style="color:#00ff41;">Authorization Approved</h2><p>Your authorization request for <strong>${(authorization as any).target}</strong> has been fully approved!</p><p>You can now perform security scans on this target.</p></div>`,
        });

        await writeAuditLog({
            eventType: 'authorization_admin_approved',
            target: (authorization as any).target,
            userId: req.user._id.toString(),
            action: 'Authorization approved by admin',
        });

        res.json({ message: 'Authorization approved successfully' });

    } catch (error) {
        console.error('Admin approval error:', error);
        res.status(500).json({ error: 'Failed to approve authorization' });
    }
});

/**
 * POST /api/authorization/admin-deny/:id
 * Admin denies an authorization request
 */
router.post('/admin-deny/:id', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const authorization = await Authorization.findById(id);

        if (!authorization) {
            return res.status(404).json({ error: 'Authorization not found' });
        }

        await Authorization.findByIdAndUpdate(id, {
            adminApprovalStatus: 'denied',
            adminDenialReason: reason,
            adminApprovedBy: req.user._id,
            status: 'denied',
        });

        await writeAuditLog({
            eventType: 'authorization_admin_denied',
            target: (authorization as any).target,
            userId: req.user._id.toString(),
            action: 'Authorization denied by admin',
            metadata: { reason },
        });

        res.json({ message: 'Authorization denied' });

    } catch (error) {
        console.error('Admin denial error:', error);
        res.status(500).json({ error: 'Failed to deny authorization' });
    }
});

/**
 * GET /api/authorization/pending (Admin only)
 * Get all pending admin approvals
 */
router.get('/pending', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const authorizations = await Authorization.find({ status: 'admin_pending' })
            .populate('requesterId', 'username email')
            .sort({ createdAt: -1 });
        res.json({ authorizations });
    } catch (error) {
        console.error('Error fetching pending authorizations:', error);
        res.status(500).json({ error: 'Failed to fetch pending authorizations' });
    }
});

export default router;
