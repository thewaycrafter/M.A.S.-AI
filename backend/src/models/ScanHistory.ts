import mongoose from 'mongoose';

const scanHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    scanId: {
        type: String,
        required: true,
        unique: true,
    },
    target: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending',
    },
    results: {
        vulnerabilities: [{
            title: String,
            severity: String,
            category: String,
            endpoint: String,
            description: String,
        }],
        riskScore: Number,
        critical: Number,
        high: Number,
        medium: Number,
        low: Number,
    },
    metadata: {
        duration: Number, // in seconds
        agentsUsed: [String],
        tokensUsed: Number,
        cost: Number, // in INR
    },
    completedAt: Date,
}, {
    timestamps: true,
});

// Index for faster queries
scanHistorySchema.index({ userId: 1, createdAt: -1 });

export const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);
