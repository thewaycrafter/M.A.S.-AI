import mongoose from 'mongoose';
import { Pool } from 'pg';
import config from '../config';
import crypto from 'crypto';

/**
 * MongoDB Connection for Scan Results
 */
let mongoConnection: typeof mongoose | null = null;

export async function connectMongoDB(): Promise<typeof mongoose> {
    if (mongoConnection) {
        return mongoConnection;
    }

    try {
        console.log('🔌 Connecting to MongoDB...');
        mongoConnection = await mongoose.connect(config.mongodb.uri, {
            dbName: config.mongodb.database,
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            connectTimeoutMS: 5000,
        });
        console.log('✅ MongoDB connected successfully');
        return mongoConnection;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}

/**
 * PostgreSQL Connection Pool for Audit Logs
 */
let pgPool: Pool | null = null;

export function getPostgresPool(): Pool {
    if (!pgPool) {
        console.log('🔌 Creating PostgreSQL connection pool...');
        pgPool = new Pool({
            host: config.postgres.host,
            port: config.postgres.port,
            database: config.postgres.database,
            user: config.postgres.user,
            password: config.postgres.password,
            max: 20, // Maximum number of clients
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        pgPool.on('connect', () => {
            console.log('✅ PostgreSQL pool client connected');
        });

        pgPool.on('error', (err) => {
            console.error('❌ PostgreSQL pool error:', err);
        });
    }

    return pgPool;
}

/**
 * Initialize Database Tables for Audit Logs
 */
export async function initializeAuditTables(): Promise<void> {
    const pool = getPostgresPool();

    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            event_type VARCHAR(50) NOT NULL,
            user_id VARCHAR(255),
            target VARCHAR(255) NOT NULL,
            action TEXT NOT NULL,
            metadata JSONB,
            signature TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    `;

    try {
        await pool.query(createTableSQL);
        console.log('✅ Audit tables initialized');
    } catch (error) {
        console.error('❌ Failed to initialize audit tables:', error);
        throw error;
    }
}

/**
 * MongoDB Schema for Scan Results
 */
const scanResultSchema = new mongoose.Schema({
    scanId: { type: String, required: true, unique: true, index: true },
    target: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number }, // milliseconds
    status: {
        type: String,
        enum: ['running', 'completed', 'failed', 'aborted'],
        default: 'running',
        index: true
    },

    // Coverage Data
    coverage: {
        totalCategories: Number,
        categoriesTested: [String],
        coveragePercentage: Number,
    },

    // Vulnerability Findings
    findings: {
        total: Number,
        critical: Number,
        high: Number,
        medium: Number,
        low: Number,
    },

    // Detailed Results
    webVulnerabilities: [mongoose.Schema.Types.Mixed],
    authenticationFindings: [mongoose.Schema.Types.Mixed],
    authorizationFindings: [mongoose.Schema.Types.Mixed],
    cryptographyFindings: [mongoose.Schema.Types.Mixed],
    businessLogicFindings: [mongoose.Schema.Types.Mixed],
    networkFindings: [mongoose.Schema.Types.Mixed],
    cloudFindings: [mongoose.Schema.Types.Mixed],
    supplyChainFindings: [mongoose.Schema.Types.Mixed],
    clientSideFindings: [mongoose.Schema.Types.Mixed],
    mobileFindings: [mongoose.Schema.Types.Mixed],
    socialEngineeringFindings: [mongoose.Schema.Types.Mixed],
    loggingFindings: [mongoose.Schema.Types.Mixed],

    // AI Analysis
    threats: mongoose.Schema.Types.Mixed,
    exploits: [mongoose.Schema.Types.Mixed],
    remediations: [mongoose.Schema.Types.Mixed],
    assets: mongoose.Schema.Types.Mixed,

    // Metadata
    metadata: {
        userId: String,
        scanType: String,
        userAgent: String,
        ipAddress: String,
    },

    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
});

// Check if model already exists (prevents OverwriteModelError)
export const ScanResult = mongoose.models.ScanResult || mongoose.model('ScanResult', scanResultSchema);

/**
 * Audit Log Interface
 */
export interface AuditLog {
    eventType:
    | 'scan_start'
    | 'scan_complete'
    | 'scan_abort'
    | 'kill_switch'
    | 'export'
    | 'access'
    | 'authorization_check'
    | 'killswitch_activated'
    | 'killswitch_deactivated'
    // Authorization events
    | 'authorization_request'
    | 'authorization_user_approved'
    | 'authorization_user_denied'
    | 'authorization_admin_approved'
    | 'authorization_admin_denied'
    // Admin events
    | 'admin_create_user'
    | 'admin_delete_user'
    | 'admin_block_user'
    | 'admin_unblock_user'
    | 'admin_reset_password'
    | 'admin_send_reset_link';
    userId?: string;
    target: string;
    action: string;
    metadata?: Record<string, any>;
}

/**
 * Create HMAC Signature for Audit Log
 */
function createSignature(log: AuditLog, timestamp: Date): string {
    const secret = config.security.auditSecret || 'default-secret-change-in-production';
    const data = JSON.stringify({
        ...log,
        timestamp: timestamp.toISOString(),
    });

    return crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');
}

/**
 * Write Immutable Audit Log to PostgreSQL
 */
export async function writeAuditLog(log: AuditLog): Promise<void> {
    const pool = getPostgresPool(); // This might return null/undefined if we change getPostgresPool to verify or we check config here

    // Check if Postgres is actually configured/connected
    if (!config.postgres.host) {
        console.warn(`⚠️  PostgreSQL not configured - skipping audit log: ${log.eventType}`);
        return;
    }

    const timestamp = new Date();
    const signature = createSignature(log, timestamp);

    const query = `
        INSERT INTO audit_logs (timestamp, event_type, user_id, target, action, metadata, signature)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const values = [
        timestamp,
        log.eventType,
        log.userId || null,
        log.target,
        log.action,
        JSON.stringify(log.metadata || {}),
        signature,
    ];

    try {
        await pool.query(query, values);
        console.log(`📝 Audit log written: ${log.eventType} on ${log.target}`);
    } catch (error) {
        console.error('❌ Failed to write audit log:', error);
        // We catch here so the main request doesn't fail just because logging failed
    }
}

/**
 * Verify Audit Log Signature
 */
export function verifyAuditSignature(
    log: AuditLog,
    timestamp: Date,
    signature: string
): boolean {
    const expectedSignature = createSignature(log, timestamp);
    return signature === expectedSignature;
}

/**
 * Save Scan Result to MongoDB
 */
export async function saveScanResult(scanData: any): Promise<void> {
    try {
        const scanResult = new ScanResult(scanData);
        await scanResult.save();
        console.log(`💾 Scan result saved: ${scanData.scanId}`);
    } catch (error) {
        console.error('❌ Failed to save scan result:', error);
        throw error;
    }
}

/**
 * Get Scan Results by Target
 */
export async function getScansByTarget(target: string, limit: number = 10) {
    try {
        return await ScanResult
            .find({ target })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    } catch (error) {
        console.error('❌ Failed to retrieve scans:', error);
        throw error;
    }
}

/**
 * Get Scan Result by ID
 */
export async function getScanById(scanId: string) {
    try {
        return await ScanResult.findOne({ scanId }).lean();
    } catch (error) {
        console.error('❌ Failed to retrieve scan:', error);
        throw error;
    }
}

/**
 * Close Database Connections
 */
export async function closeDatabaseConnections(): Promise<void> {
    if (mongoConnection) {
        await mongoConnection.connection.close();
        console.log('🔌 MongoDB connection closed');
    }

    if (pgPool) {
        await pgPool.end();
        console.log('🔌 PostgreSQL pool closed');
    }
}
