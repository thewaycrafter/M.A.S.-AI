import mongoose from 'mongoose';

// Remediation step schema for detailed fix guides
const remediationSchema = new mongoose.Schema({
    summary: {
        type: String,
        required: true,
    },
    steps: [{
        stepNumber: Number,
        title: String,
        description: String,
        codeExample: String, // Code snippet for fixing
    }],
    references: [String], // URLs to documentation
    estimatedTime: String, // e.g., "30 minutes"
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
    },
}, { _id: false });

// Individual vulnerability schema
const vulnerabilitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low', 'info'],
        required: true,
    },
    category: String, // e.g., 'Authentication', 'Input Validation'
    subcategory: String,

    // Location
    endpoint: String,
    method: String, // GET, POST, etc.
    parameter: String,

    // Details
    description: String,
    reasoning: String, // AI's reasoning for identifying this

    // Standards
    cwe: String, // CWE-89
    cvss: Number, // 0-10
    owasp: String, // e.g., A03:2021

    // Testing methodology
    testMethodology: {
        approach: String, // How the vulnerability was tested
        payload: String, // What was sent
        response: String, // What was received
        evidence: String, // Proof of vulnerability
    },

    // Fix guidance
    remediation: remediationSchema,

    // Exploitability
    exploitability: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
    },
    impactScore: Number,

    // Metadata
    detectedAt: {
        type: Date,
        default: Date.now,
    },
    detectedBy: String, // Which agent found it
    confirmed: {
        type: Boolean,
        default: false,
    },
}, { _id: true });

const scanResultSchema = new mongoose.Schema({
    scanHistoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScanHistory',
        required: true,
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    target: {
        type: String,
        required: true,
    },

    // All vulnerabilities found
    vulnerabilities: [vulnerabilitySchema],

    // Overall metrics
    riskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 10,
    },
    summary: {
        total: { type: Number, default: 0 },
        critical: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        low: { type: Number, default: 0 },
        info: { type: Number, default: 0 },
    },

    // Coverage information
    coverage: {
        totalCategories: { type: Number, default: 19 },
        categoriesTested: [String],
        coveragePercentage: { type: Number, default: 0 },
    },

    // Execution details
    executionDetails: {
        duration: Number, // milliseconds
        startTime: Date,
        endTime: Date,
        agentsUsed: [String],
        phasesCompleted: [String],
        tokensUsed: Number,
    },

    // Who performed the scan
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // Raw responses (for debugging)
    rawResponses: {
        type: mongoose.Schema.Types.Mixed,
    },

}, {
    timestamps: true,
});

// Indexes
scanResultSchema.index({ scanHistoryId: 1 });
scanResultSchema.index({ userId: 1, createdAt: -1 });
scanResultSchema.index({ target: 1 });
scanResultSchema.index({ riskScore: -1 });
scanResultSchema.index({ 'vulnerabilities.severity': 1 });

// Virtual to calculate risk score
scanResultSchema.methods.calculateRiskScore = function (): number {
    const { critical, high, medium, low } = this.summary;
    const score = (critical * 10 + high * 7 + medium * 4 + low * 1) / 100;
    return Math.min(score * 10, 10);
};

export const ScanResult = mongoose.models.ScanResult || mongoose.model('ScanResult', scanResultSchema);
