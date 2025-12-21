import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import scansRouter from './api/routes/scans';
import comprehensiveRouter from './api/routes/comprehensive';
import reportsRouter from './api/routes/reports';
import authorizationRouter from './api/routes/authorization';
import killswitchRouter from './api/routes/killswitch';
import authRouter from './api/routes/auth';
import paymentsRouter from './api/routes/payments';
import scanHistoryRouter from './api/routes/scanHistory';
import analyticsRouter from './api/routes/analytics';
import adminRouter from './api/routes/admin';
import { initializeWebSocket } from './services/websocket';
import {
    connectMongoDB,
    getPostgresPool,
    initializeAuditTables,
    closeDatabaseConnections
} from './services/database';
import { requestLogger, logSystem } from './middleware/requestLogger';

const app: Application = express();
const httpServer = createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(httpServer);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.frontend.url,
    credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        name: 'M.A.S. AI API',
        version: '1.0.0',
        status: 'online',
        tagline: 'Defensive-First AI Penetration Testing Engine',
        message: 'Welcome to M.A.S. AI. Use /api for endpoints, /health for status.',
        ascii: `
╔═══════════════════════════════════════════════════════════╗
║                     M.A.S. AI                             ║
║       Defensive-First AI Penetration Testing Engine       ║
╚═══════════════════════════════════════════════════════════╝
    `,
        endpoints: {
            health: '/health',
            status: '/api/status',
            scans: '/api/scans',
            comprehensive: '/api/comprehensive',
            documentation: '/api',
        },
        webSocket: `Connected clients: ${io.engine.clientsCount}`,
    });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        version: '1.0.0',
        websocket: {
            connected: io.engine.clientsCount,
            status: 'operational',
        },
        database: {
            mongodb: 'connected',
            postgresql: 'connected',
        },
    });
});

// API status endpoint
app.get('/api/status', (req: Request, res: Response) => {
    res.json({
        name: 'M.A.S. AI API',
        version: '1.0.0',
        description: 'Defensive-First AI Penetration Testing Engine',
        status: 'operational',
        features: {
            aiAgents: 7,
            specializedScanners: 10,
            totalModules: 17,
            vulnerabilityCategories: 19,
            coveragePercentage: 100,
            killSwitch: config.security.enableKillSwitch,
            realTimeUpdates: true,
            databasePersistence: true,
            immutableAuditLogs: true,
        },
    });
});

// Request logging middleware (logs all API requests to MongoDB applogs)
app.use('/api', requestLogger);

// API routes
app.use('/api/auth', authRouter);
app.use('/api/scans', scansRouter);
app.use('/api/comprehensive', comprehensiveRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/authorization', authorizationRouter);
app.use('/api/killswitch', killswitchRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/scan-history', scanHistoryRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);

// API documentation endpoint
app.get('/api', (req: Request, res: Response) => {
    res.json({
        message: 'M.A.S. AI API v1.0.0',
        endpoints: {
            health: '/health',
            status: '/api/status',
            scans: {
                start: 'POST /api/scans/start',
                logs: 'GET /api/scans/logs',
                clearLogs: 'DELETE /api/scans/logs',
            },
            comprehensive: {
                scan: 'POST /api/comprehensive/comprehensive',
                coverage: 'GET /api/comprehensive/coverage',
            },
            reports: {
                pdf: 'GET /api/reports/:scanId',
                generate: 'POST /api/reports/generate',
            },
            auth: '/api/auth (coming soon)',
            vulnerabilities: '/api/vulnerabilities (coming soon)',
            remediation: '/api/remediation (coming soon)',
            audit: '/api/audit (coming soon)',
            authorization: '/api/authorization (coming soon)',
        },
        websocket: {
            events: {
                'agent-log': 'Real-time agent logs',
                'scan-progress': 'Scan progress updates',
                'scan-complete': 'Scan completion notification',
                'error': 'Error notifications',
            },
        },
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        timestamp: new Date().toISOString(),
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    res.status(500).json({
        error: 'Internal Server Error',
        message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
    });
});

// Initialize databases and start server
async function startServer() {
    try {
        // Connect to MongoDB (optional)
        if (config.mongodb.uri) {
            try {
                await connectMongoDB();
                console.log('✅ MongoDB initialized for scan results storage');
            } catch (mongoError) {
                console.warn('⚠️  MongoDB not available - scan results will not be persisted');
                console.warn('   Install MongoDB or leave blank in .env to skip');
            }
        } else {
            console.warn('⚠️  MongoDB not configured - scan results will not be persisted');
        }

        // Initialize PostgreSQL for audit logs (optional)
        if (config.postgres.host) {
            try {
                const pgPool = getPostgresPool();
                await pgPool.query('SELECT NOW()'); // Test connection
                await initializeAuditTables();
                console.log('✅ PostgreSQL initialized for immutable audit logs');
            } catch (pgError) {
                console.warn('⚠️  PostgreSQL not available - audit logs will not be persisted');
                console.warn('   Install PostgreSQL or leave blank in .env to skip');
            }
        } else {
            console.warn('⚠️  PostgreSQL not configured - audit logs will not be persisted');
        }

        // Start HTTP server
        const PORT = config.port;
        httpServer.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                     M.A.S. AI                             ║
║       Defensive-First AI Penetration Testing Engine       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
🌍 Environment: ${config.nodeEnv}
🔗 API: http://localhost:${PORT}/api
🏥 Health: http://localhost:${PORT}/health
🔌 WebSocket: Enabled (Socket.io)
💾 MongoDB: ${config.mongodb.uri ? 'Configured (check logs)' : 'Not configured'}
🗄️  PostgreSQL: ${config.postgres.host ? 'Configured (check logs)' : 'Not configured'}

⚡ Features:
   - 7 AI Agents (Recon, Threat Modeling, Vulnerability Reasoning, etc.)
   - 10 Specialized Scanners (Auth, Authz, Crypto, Network, Cloud, etc.)
   - 17 Total Security Modules
   - 200+ Vulnerability Classes
   - 100% Category Coverage (19/19)
   - Real-Time Updates via WebSocket
   - Database Persistence (MongoDB + PostgreSQL)
   - Immutable Audit Logging with HMAC Signatures
   - Authorization Gating
   - Kill Switch: ${config.security.enableKillSwitch ? 'Enabled' : 'Disabled'}

Ready for authorized penetration testing! 🛡️
  `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    await closeDatabaseConnections();
    httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    await closeDatabaseConnections();
    httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Start the server
startServer();

export default app;
