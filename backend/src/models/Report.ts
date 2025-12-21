import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    // References
    scanHistoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScanHistory',
        required: true,
        index: true,
    },
    scanResultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScanResult',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    // File info
    filename: {
        type: String,
        required: true,
    },
    mimeType: {
        type: String,
        default: 'application/pdf',
    },
    sizeBytes: {
        type: Number,
        required: true,
    },

    // PDF content stored as base64
    pdfData: {
        type: String, // Base64 encoded PDF
        required: true,
    },

    // Scan summary for quick access
    scanSummary: {
        target: String,
        scanId: String,
        riskScore: Number,
        totalVulnerabilities: Number,
        critical: Number,
        high: Number,
        medium: Number,
        low: Number,
    },

    // Generation metadata
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // Download tracking
    downloadCount: {
        type: Number,
        default: 0,
    },
    lastDownloadedAt: Date,
    lastDownloadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // Expiry (optional - reports can expire after certain time)
    expiresAt: Date,

}, {
    timestamps: true,
});

// Indexes
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ scanHistoryId: 1 });
reportSchema.index({ 'scanSummary.target': 1 });
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// =====================
// Instance Methods
// =====================
reportSchema.methods.recordDownload = function (downloadedBy?: mongoose.Types.ObjectId) {
    this.downloadCount += 1;
    this.lastDownloadedAt = new Date();
    if (downloadedBy) {
        this.lastDownloadedBy = downloadedBy;
    }
    return this.save();
};

reportSchema.methods.getBuffer = function (): Buffer {
    return Buffer.from(this.pdfData, 'base64');
};

// =====================
// Static Methods
// =====================
reportSchema.statics.createFromBuffer = async function (
    buffer: Buffer,
    userId: mongoose.Types.ObjectId,
    scanHistoryId: mongoose.Types.ObjectId,
    scanResultId: mongoose.Types.ObjectId,
    scanSummary: any,
    generatedBy?: mongoose.Types.ObjectId
) {
    const filename = `mas-ai-report-${scanSummary.scanId || Date.now()}.pdf`;

    return this.create({
        userId,
        scanHistoryId,
        scanResultId,
        filename,
        sizeBytes: buffer.length,
        pdfData: buffer.toString('base64'),
        scanSummary,
        generatedBy: generatedBy || userId,
    });
};

reportSchema.statics.findByUserAndScan = async function (
    userId: mongoose.Types.ObjectId,
    scanHistoryId: mongoose.Types.ObjectId
) {
    return this.findOne({ userId, scanHistoryId }).sort({ createdAt: -1 });
};

export const Report = mongoose.model('Report', reportSchema);
