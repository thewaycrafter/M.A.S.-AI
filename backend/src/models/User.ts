import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
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
    role: {
        type: String,
        enum: ['free', 'pro', 'admin'],
        default: 'free',
    },
    subscription: {
        tier: {
            type: String,
            enum: ['free', 'pro', 'enterprise'],
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
    },
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
    },
    profile: {
        firstName: String,
        lastName: String,
        company: String,
        phone: String,
    },
    onboarding: {
        tourCompleted: {
            type: Boolean,
            default: false,
        },
        completedSteps: [String],
    },
}, {
    timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Reset monthly usage (call this via cron job)
userSchema.methods.resetMonthlyUsage = function () {
    this.usage.scansThisMonth = 0;
    return this.save();
};

// Check if user can scan
userSchema.methods.canScan = function (): boolean {
    if (this.role === 'admin' || this.role === 'pro') return true;
    if (this.subscription.tier === 'free' && this.usage.scansThisMonth < 3) return true;
    return false;
};

export const User = mongoose.model('User', userSchema);
