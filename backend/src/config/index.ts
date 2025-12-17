import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

interface Config {
    port: number;
    nodeEnv: string;
    openai: {
        apiKey: string;
    };
    mongodb: {
        uri: string;
        database: string;
    };
    postgres: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
    };
    jwt: {
        secret: string;
        expiry: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    frontend: {
        url: string;
    };
    security: {
        auditSecret: string;
        enableKillSwitch: boolean;
    };
    redis: {
        url: string;
    };
}

const config: Config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
    },
    mongodb: {
        uri: process.env.MONGODB_URI || '',
        database: process.env.MONGODB_DATABASE || 'aegis-ai',
    },
    postgres: {
        host: process.env.POSTGRES_HOST || '',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        database: process.env.POSTGRES_DATABASE || 'aegis_audit',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'change-this-secret',
        expiry: process.env.JWT_EXPIRY || '24h',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
    },
    security: {
        auditSecret: process.env.AUDIT_SECRET || 'change-this-audit-secret',
        enableKillSwitch: process.env.ENABLE_KILL_SWITCH === 'true',
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
};

// Validate required configuration
if (!config.openai.apiKey) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY is not set. AI features will not work.');
}

export default config;
