import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    // =====================
    // Personal Information
    // =====================
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    firstName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    company: {
        type: String,
        trim: true,
    },
    avatar: {
        type: String, // URL or base64
    },

    // =====================
    // Role & Permissions
    // =====================
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    blockedAt: Date,
    blockedReason: String,

    // =====================
    // Password Reset
    // =====================
    passwordResetToken: String,
    passwordResetExpires: Date,

    // =====================
    // Email Verification
    // =====================
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // =====================
    // Subscription Details
    // =====================
    subscription: {
        tier: {
            type: String,

            enum: ['free', 'pro', 'business', 'enterprise'],
            default: 'free',
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'cancelled', 'trial'],
            default: 'active',
        },
        startDate: Date,
        endDate: Date,
        razorpaySubscriptionId: String,
        razorpayCustomerId: String,
        razorpayPaymentId: String,
    },

    // =====================
    // Usage Tracking
    // =====================
    usage: {
        scansThisMonth: {
            type: Number,
            default: 0,
        },
        totalScans: {
            type: Number,
            default: 0,
        },
        lastScanDate: Date,
        pdfDownloadsThisMonth: {
            type: Number,
            default: 0,
        },
    },

    // =====================
    // Onboarding & Settings
    // =====================
    onboarding: {
        tourCompleted: {
            type: Boolean,
            default: false,
        },
        completedSteps: [String],
    },

    // =====================
    // Activity Tracking
    // =====================
    lastLoginAt: Date,
    lastActivityAt: Date,
    loginCount: {
        type: Number,
        default: 0,
    },

}, {
    timestamps: true,
});

// =====================
// Indexes
// =====================
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'subscription.tier': 1 });
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });

// =====================
// Pre-save Middleware
// =====================
userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

// =====================
// Instance Methods
// =====================
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.resetMonthlyUsage = function () {
    this.usage.scansThisMonth = 0;
    this.usage.pdfDownloadsThisMonth = 0;
    return this.save();
};

userSchema.methods.canScan = function (): { allowed: boolean; reason?: string } {
    if (this.isBlocked) {
        return { allowed: false, reason: 'Your account is blocked. Contact support.' };
    }

    if (this.role === 'admin') {
        return { allowed: true };
    }

    const tierLimits: Record<string, number> = {

        free: 3,
        pro: Infinity,
        business: Infinity,
        enterprise: Infinity,
    };

    const limit = tierLimits[this.subscription?.tier || 'free'];

    if (this.usage.scansThisMonth >= limit) {
        return {
            allowed: false,
            reason: `You have reached your ${this.subscription?.tier || 'free'} plan limit of ${limit} scans/month. Upgrade to continue.`
        };
    }

    return { allowed: true };
};

userSchema.methods.generatePasswordResetToken = function (): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return token;
};

userSchema.methods.clearPasswordResetToken = function () {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
};

// =====================
// Static Methods
// =====================
userSchema.statics.findByResetToken = async function (token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return this.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
};

// Email verification methods
userSchema.methods.generateEmailVerificationToken = function (): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return token;
};

userSchema.methods.verifyEmail = function () {
    this.isEmailVerified = true;
    this.emailVerificationToken = undefined;
    this.emailVerificationExpires = undefined;
};

userSchema.statics.findByVerificationToken = async function (token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return this.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() },
    });
};

export const User = mongoose.model('User', userSchema);
