import mongoose from 'mongoose';

const appLogSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: ['debug', 'info', 'warn', 'error', 'critical'],
        required: true,
        // Index handled by compound index below
    },
    message: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        enum: ['api', 'scan', 'auth', 'admin', 'payment', 'email', 'websocket', 'system'],
        required: true,
        // Index handled by compound index below
    },

    // Log Type (error, warn, info)
    logtype: {
        type: String,
        enum: ['error', 'warn', 'info'],
        required: true,
    },

    // Log Level (Technical, Functional)
    loglevel: {
        type: String,
        enum: ['Technical', 'Functional'],
        required: true,
    },

    // Optional user context (String to support 'system' or user IDs)
    userId: {
        type: String,
        // Index handled by compound index below
    },

    // Optional scan context
    scanId: String,

    // Additional metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },

    // Request info (for API logs)
    request: {
        method: String,
        path: String,
        ip: String,
        userAgent: String,
    },

    // Error details (for error logs)
    error: {
        name: String,
        message: String,
        stack: String,
    },

    // Timestamp
    timestamp: {
        type: Date,
        default: Date.now,
        // Index handled by TTL and compound indexes below
    },

}, {
    timestamps: false, // We use our own timestamp field
    capped: {
        size: 104857600, // 100MB cap
        max: 100000, // Max 100k documents
    },
});

// TTL index - logs expire after 90 days
appLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Compound indexes for common queries
appLogSchema.index({ level: 1, timestamp: -1 });
appLogSchema.index({ source: 1, timestamp: -1 });
appLogSchema.index({ userId: 1, timestamp: -1 });

// Static helper methods
appLogSchema.statics.logInfo = function (source: string, message: string, userId: string = 'system', metadata?: any) {
    return this.create({
        level: 'info',
        logtype: 'info',
        loglevel: 'Functional', // Default to Functional for general info? Or Technical? Let's say Technical for now unless specified. Actually, 'Info' is usually functional description.
        source,
        message,
        userId,
        metadata
    });
};

appLogSchema.statics.logError = function (source: string, message: string, error?: Error, userId: string = 'system', metadata?: any) {
    return this.create({
        level: 'error',
        logtype: 'error',
        loglevel: 'Technical', // Errors are usually technical
        source,
        message,
        userId,
        metadata,
        error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
    });
};

appLogSchema.statics.logWarning = function (source: string, message: string, userId: string = 'system', metadata?: any) {
    return this.create({
        level: 'warn',
        logtype: 'warn',
        loglevel: 'Technical',
        source,
        message,
        userId,
        metadata
    });
};

appLogSchema.statics.logApiRequest = function (method: string, path: string, ip: string, userAgent: string, userId: string = 'system', statusCode: number = 200) {
    const isError = statusCode >= 400;
    return this.create({
        level: isError ? 'error' : 'info',
        logtype: isError ? 'error' : 'info',
        loglevel: 'Technical', // API requests are technical logs
        source: 'api',
        message: `${method} ${path}`,
        userId,
        request: { method, path, ip, userAgent },
    });
};

export const AppLog = mongoose.model('AppLog', appLogSchema);
