import mongoose from 'mongoose';
import crypto from 'crypto';

const authorizationSchema = new mongoose.Schema({
    // Requester info
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    requesterEmail: {
        type: String,
        required: true,
    },

    // Target details
    target: {
        type: String,
        required: true,
        index: true,
    },

    // Approver info (domain owner's email)
    approverEmail: {
        type: String,
        required: true,
    },

    // Authorization period
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },

    // =====================
    // User Approval Stage
    // =====================
    userApprovalToken: String,
    userApprovalTokenExpires: Date,
    userApprovalStatus: {
        type: String,
        enum: ['pending', 'approved', 'denied'],
        default: 'pending',
    },
    userApprovedAt: Date,
    userDeniedAt: Date,
    userDeniedReason: String,

    // =====================
    // Admin Approval Stage
    // =====================
    adminApprovalStatus: {
        type: String,
        enum: ['pending', 'approved', 'denied', 'not_required'],
        default: 'pending',
    },
    adminApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    adminApprovedAt: Date,
    adminDeniedAt: Date,
    adminDeniedReason: String,

    // =====================
    // Overall Status
    // =====================
    status: {
        type: String,
        enum: ['user_pending', 'admin_pending', 'approved', 'denied', 'expired', 'revoked'],
        default: 'user_pending',
        index: true,
    },

    // =====================
    // Reminders
    // =====================
    remindersSent: {
        type: Number,
        default: 0,
    },
    lastReminderAt: Date,
    lastReminderType: {
        type: String,
        enum: ['user', 'admin'],
    },

    // =====================
    // Usage tracking
    // =====================
    scansPerformed: {
        type: Number,
        default: 0,
    },
    lastScanAt: Date,

}, {
    timestamps: true,
});

// Indexes
authorizationSchema.index({ requesterId: 1, status: 1 });
authorizationSchema.index({ target: 1, status: 1 });
authorizationSchema.index({ userApprovalToken: 1 });
authorizationSchema.index({ startDate: 1, endDate: 1 });

// =====================
// Instance Methods
// =====================
authorizationSchema.methods.generateUserApprovalToken = function (): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.userApprovalToken = crypto.createHash('sha256').update(token).digest('hex');
    this.userApprovalTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return token;
};

authorizationSchema.methods.isTokenValid = function (): boolean {
    return this.userApprovalTokenExpires && this.userApprovalTokenExpires > new Date();
};

authorizationSchema.methods.isActive = function (): boolean {
    const now = new Date();
    return (
        this.status === 'approved' &&
        this.startDate <= now &&
        this.endDate >= now
    );
};

authorizationSchema.methods.isExpired = function (): boolean {
    return this.endDate < new Date();
};

authorizationSchema.methods.approveByUser = function () {
    this.userApprovalStatus = 'approved';
    this.userApprovedAt = new Date();
    this.status = 'admin_pending';
    this.userApprovalToken = undefined;
    this.userApprovalTokenExpires = undefined;
};

authorizationSchema.methods.denyByUser = function (reason?: string) {
    this.userApprovalStatus = 'denied';
    this.userDeniedAt = new Date();
    this.userDeniedReason = reason;
    this.status = 'denied';
    this.userApprovalToken = undefined;
    this.userApprovalTokenExpires = undefined;
};

authorizationSchema.methods.approveByAdmin = function (adminId: mongoose.Types.ObjectId) {
    this.adminApprovalStatus = 'approved';
    this.adminApprovedBy = adminId;
    this.adminApprovedAt = new Date();
    this.status = 'approved';
};

authorizationSchema.methods.denyByAdmin = function (adminId: mongoose.Types.ObjectId, reason?: string) {
    this.adminApprovalStatus = 'denied';
    this.adminApprovedBy = adminId;
    this.adminDeniedAt = new Date();
    this.adminDeniedReason = reason;
    this.status = 'denied';
};

// =====================
// Static Methods
// =====================
authorizationSchema.statics.findByToken = async function (token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return this.findOne({
        userApprovalToken: hashedToken,
        userApprovalTokenExpires: { $gt: Date.now() },
    });
};

authorizationSchema.statics.findActiveForTarget = async function (userId: mongoose.Types.ObjectId, target: string) {
    const now = new Date();
    return this.findOne({
        requesterId: userId,
        target: target,
        status: 'approved',
        startDate: { $lte: now },
        endDate: { $gte: now },
    });
};

authorizationSchema.statics.isTargetAuthorized = async function (userId: mongoose.Types.ObjectId, target: string): Promise<boolean> {
    const now = new Date();
    const authorization = await this.findOne({
        requesterId: userId,
        target: target,
        status: 'approved',
        startDate: { $lte: now },
        endDate: { $gte: now },
    });
    return !!authorization;
};

export const Authorization = mongoose.model('Authorization', authorizationSchema);
