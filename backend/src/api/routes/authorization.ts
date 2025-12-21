import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
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
        const userId = req.user.id;

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
            requesterId: new mongoose.Types.ObjectId(userId),
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
            subject: `[M.A.S. AI] Authorization Request for ${target}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#0a0a0f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0f;">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:linear-gradient(180deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1e1e3f 0%,#2a2a4a 100%);padding:40px 40px 30px;text-align:center;border-bottom:1px solid rgba(0,255,65,0.2);">
                            <h1 style="margin:0;font-size:32px;font-weight:700;letter-spacing:3px;">
                                <span style="color:#00ff41;">M.A.S.</span>
                                <span style="color:#ffffff;"> AI</span>
                            </h1>
                            <p style="margin:8px 0 0;color:#6b7280;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                                Multi-agent Adaptive Security
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding:40px;">
                            <h2 style="margin:0 0 20px;color:#00e5a0;font-size:24px;font-weight:600;">
                                🔐 Authorization Request
                            </h2>
                            
                            <p style="color:#e5e7eb;font-size:15px;line-height:1.7;">
                                A security professional has requested authorization to perform comprehensive penetration testing on your domain.
                            </p>
                            
                            <!-- Target Info Box -->
                            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin:25px 0;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="padding:8px 0;color:#9ca3af;width:120px;">Target:</td>
                                        <td style="padding:8px 0;color:#00ff41;font-weight:600;font-size:16px;">${target}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;color:#9ca3af;">Requested by:</td>
                                        <td style="padding:8px 0;color:#00e5a0;">${req.user.email}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;color:#9ca3af;">Start Date:</td>
                                        <td style="padding:8px 0;color:#ffffff;">${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;color:#9ca3af;">End Date:</td>
                                        <td style="padding:8px 0;color:#ffffff;">${new Date(endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Tests Description -->
                            <div style="background:rgba(0,255,65,0.1);border-left:4px solid #00ff41;padding:15px 20px;margin:25px 0;border-radius:0 8px 8px 0;">
                                <p style="margin:0 0 10px;color:#00e5a0;font-weight:600;">🛡️ Security Tests to be Performed:</p>
                                <ul style="margin:10px 0 0;padding-left:20px;color:#d1d5db;line-height:1.8;">
                                    <li>Web Application Vulnerability Scanning (OWASP Top 10)</li>
                                    <li>Authentication & Authorization Testing</li>
                                    <li>Cryptographic Security Analysis</li>
                                    <li>Business Logic Vulnerability Detection</li>
                                    <li>API Security Assessment</li>
                                    <li>Network & Infrastructure Scanning</li>
                                    <li>Cloud Configuration Analysis</li>
                                    <li>Supply Chain Security Review</li>
                                </ul>
                            </div>
                            
                            <!-- Warning -->
                            <div style="background:rgba(245,158,11,0.1);border-left:4px solid #f59e0b;padding:15px 20px;margin:25px 0;border-radius:0 8px 8px 0;">
                                <p style="margin:0;color:#f59e0b;">
                                    <strong>⚠️ Important:</strong> Only approve this request if you own or have authority over the target domain and consent to security testing.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <div style="text-align:center;margin:35px 0;">
                                <a href="${approvalUrl}" 
                                   style="background:linear-gradient(135deg,#00ff41 0%,#00e5a0 100%);color:#000000;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.5px;display:inline-block;text-transform:uppercase;box-shadow:0 4px 15px rgba(0,255,65,0.3);">
                                    REVIEW REQUEST
                                </a>
                            </div>
                            
                            <p style="color:#9ca3af;font-size:13px;margin-top:30px;">
                                This link will expire in 7 days. If you did not expect this request, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background:#0d0d12;padding:30px 40px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;">
                            <p style="margin:0 0 10px;color:#00ff41;font-weight:600;font-size:14px;">M.A.S. AI</p>
                            <p style="margin:0 0 15px;color:#6b7280;font-size:12px;">Multi-agent Adaptive Security</p>
                            <p style="margin:0;color:#4b5563;font-size:11px;">© ${new Date().getFullYear()} M.A.S. AI. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
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
        const authorizations = await Authorization.find({
            requesterId: new mongoose.Types.ObjectId(req.user.id)
        })
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
            subject: `[M.A.S. AI] Authorization Approved: ${(authorization as any).target}`,
            html: `<div style="font-family:Arial,sans-serif;background:#1a1a2e;color:#fff;padding:30px;border-radius:10px;"><h1 style="color:#00ff41;">M.A.S. AI</h1><h2 style="color:#00ff41;">Authorization Approved</h2><p>Your authorization request for <strong>${(authorization as any).target}</strong> has been fully approved!</p><p>You can now perform security scans on this target.</p></div>`,
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

/**
 * GET /api/authorization/all (Admin only)
 * Get ALL authorization requests for admin view
 */
router.get('/all', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const authorizations = await Authorization.find({})
            .populate('requesterId', 'username email')
            .sort({ createdAt: -1 });
        res.json({ authorizations });
    } catch (error) {
        console.error('Error fetching all authorizations:', error);
        res.status(500).json({ error: 'Failed to fetch authorizations' });
    }
});

/**
 * POST /api/authorization/admin-bypass/:id
 * Admin bypasses user approval and directly approves
 */
router.post('/admin-bypass/:id', requireAuth, requireAdmin, async (req: any, res) => {
    try {
        const { id } = req.params;
        const authorization = await Authorization.findById(id);

        if (!authorization) {
            return res.status(404).json({ error: 'Authorization not found' });
        }

        // Bypass user approval and directly approve as admin
        await Authorization.findByIdAndUpdate(id, {
            userApprovalStatus: 'approved',
            userApprovalToken: undefined,
            userApprovalTokenExpires: undefined,
            adminApprovalStatus: 'approved',
            adminApprovedBy: new mongoose.Types.ObjectId(req.user.id),
            adminApprovedAt: new Date(),
            status: 'approved',
        });

        // Notify requester
        await sendEmail({
            to: (authorization as any).requesterEmail,
            subject: `[M.A.S. AI] Authorization Approved: ${(authorization as any).target}`,
            html: `<div style="font-family:Arial,sans-serif;background:#1a1a2e;color:#fff;padding:30px;border-radius:10px;"><h1 style="color:#00ff41;">M.A.S. AI</h1><h2 style="color:#00ff41;">Authorization Approved (Admin Bypass)</h2><p>Your authorization request for <strong>${(authorization as any).target}</strong> has been approved by an administrator!</p><p>You can now perform security scans on this target.</p></div>`,
        });

        await writeAuditLog({
            eventType: 'authorization_admin_approved',
            target: (authorization as any).target,
            userId: req.user.id.toString(),
            action: 'Authorization approved by admin (user approval bypassed)',
        });

        res.json({ message: 'Authorization approved (user approval bypassed)' });

    } catch (error) {
        console.error('Admin bypass error:', error);
        res.status(500).json({ error: 'Failed to bypass approval' });
    }
});

/**
 * POST /api/authorization/remind/:id
 * Send reminder email to approver or admin
 */
router.post('/remind/:id', requireAuth, async (req: any, res) => {
    try {
        const { id } = req.params;
        const authorization: any = await Authorization.findById(id);

        if (!authorization) {
            return res.status(404).json({ error: 'Authorization not found' });
        }

        // Only requester can send reminders for their own requests
        if (authorization.requesterId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only send reminders for your own requests' });
        }

        // Determine who to remind based on status
        if (authorization.status === 'user_pending') {
            // Remind domain owner - regenerate token
            const token = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await Authorization.findByIdAndUpdate(id, {
                userApprovalToken: hashedToken,
                userApprovalTokenExpires: expires,
                remindersSent: (authorization.remindersSent || 0) + 1,
                lastReminderAt: new Date(),
                lastReminderType: 'user',
            });

            const approvalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/approve-authorization?token=${token}`;

            await sendEmail({
                to: authorization.approverEmail,
                subject: `[REMINDER] [M.A.S. AI] Authorization Request for ${authorization.target}`,
                html: `<div style="font-family:Arial,sans-serif;background:#1a1a2e;color:#fff;padding:30px;border-radius:10px;"><h1 style="color:#00ff41;">M.A.S. AI</h1><h2 style="color:#f59e0b;">⏰ Reminder: Authorization Request Pending</h2><p>A security professional is waiting for your authorization to perform testing on: <strong>${authorization.target}</strong></p><p>Requested by: ${authorization.requesterEmail}</p><p style="margin:30px 0;"><a href="${approvalUrl}" style="background:#00ff41;color:#000;padding:15px 30px;text-decoration:none;border-radius:5px;font-weight:bold;">REVIEW REQUEST</a></p></div>`,
            });

            res.json({ message: 'Reminder sent to domain owner' });

        } else if (authorization.status === 'admin_pending') {
            // Notify admin via email or internal mechanism
            await Authorization.findByIdAndUpdate(id, {
                remindersSent: (authorization.remindersSent || 0) + 1,
                lastReminderAt: new Date(),
                lastReminderType: 'admin',
            });

            res.json({ message: 'Reminder sent to admin for review' });

        } else {
            res.status(400).json({ error: 'No reminder needed - request is not pending' });
        }

    } catch (error) {
        console.error('Reminder error:', error);
        res.status(500).json({ error: 'Failed to send reminder' });
    }
});

export default router;

