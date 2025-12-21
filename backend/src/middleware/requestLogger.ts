import { Request, Response, NextFunction } from 'express';
import { AppLog } from '../models/AppLog';

// Middleware to log all API requests to MongoDB
export const requestLogger = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Get user ID if authenticated
    const userId = (req as any).user?.id;

    // Override end to capture response
    const originalEnd = res.end.bind(res);

    res.end = function (chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) {
        const responseTime = Date.now() - startTime;

        // Log the request asynchronously (don't block response)
        AppLog.create({
            level: res.statusCode >= 400 ? 'error' : 'info',
            logtype: res.statusCode >= 400 ? 'error' : 'info',
            loglevel: 'Technical',
            source: 'api',
            message: `${req.method} ${req.path} - ${res.statusCode} (${responseTime}ms)`,
            userId: userId || 'system',
            request: {
                method: req.method,
                path: req.path,
                ip: req.ip || req.socket.remoteAddress,
                userAgent: req.get('user-agent'),
            },
            metadata: {
                statusCode: res.statusCode,
                responseTime,
                query: Object.keys(req.query).length > 0 ? req.query : undefined,
            }
        }).catch(err => console.error('Failed to log request:', err));

        // Call original end with proper arguments
        if (typeof encoding === 'function') {
            return originalEnd(chunk, encoding);
        }
        return originalEnd(chunk, encoding as BufferEncoding, cb);
    } as typeof res.end;

    next();
};

// Helper function to log system events
export const logSystem = async (level: 'info' | 'warn' | 'error', message: string, metadata?: any) => {
    try {
        await AppLog.create({
            level,
            logtype: level,
            loglevel: 'Technical',
            source: 'system',
            message,
            userId: 'system',
            metadata
        });
    } catch (err) {
        console.error('Failed to log system event:', err);
    }
};

// Helper function to log auth events
export const logAuth = async (message: string, userId?: string, metadata?: any) => {
    try {
        await AppLog.create({
            level: 'info',
            logtype: 'info',
            loglevel: 'Functional', // Auth events are functional usually
            source: 'auth',
            message,
            userId: userId || 'system',
            metadata
        });
    } catch (err) {
        console.error('Failed to log auth event:', err);
    }
};

// Helper function to log errors
export const logError = async (source: string, message: string, error?: Error, userId?: string) => {
    try {
        await AppLog.create({
            level: 'error',
            logtype: 'error',
            loglevel: 'Technical',
            source,
            message,
            userId: userId || 'system',
            error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined
        });
    } catch (err) {
        console.error('Failed to log error:', err);
    }
};
