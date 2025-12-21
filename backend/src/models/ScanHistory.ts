import mongoose from 'mongoose';

const scanHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        // Index handled by compound index below
    },
    scanId: {
        type: String,
        required: true,
        unique: true,
        // unique: true already creates an index
    },
    target: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
        default: 'pending',
    },

    // Timing Information
    startedAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: Date,
    duration: {
        type: Number, // milliseconds
        default: 0,
    },

    // Link to detailed results
    scanResultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScanResult',
    },

    // Quick summary (for list views)
    summary: {
        totalVulnerabilities: { type: Number, default: 0 },
        critical: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        low: { type: Number, default: 0 },
        riskScore: { type: Number, default: 0 },
    },

    // Execution metadata
    metadata: {
        agentsUsed: [String],
        phasesCompleted: [String],
        tokensUsed: Number,
        cost: Number, // in INR
    },

    // Authorization reference
    authorizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Authorization',
    },

    // Error info if failed
    errorMessage: String,

}, {
    timestamps: true,
});

// Indexes for faster queries
scanHistorySchema.index({ userId: 1, createdAt: -1 });
scanHistorySchema.index({ target: 1 });
scanHistorySchema.index({ status: 1 });
scanHistorySchema.index({ 'summary.riskScore': -1 });

export const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);
