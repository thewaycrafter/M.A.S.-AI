import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import config from '../config';
import { AgentLog } from '../agents/index';

let io: SocketIOServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(server: HTTPServer): SocketIOServer {
    io = new SocketIOServer(server, {
        cors: {
            origin: config.frontend.url,
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`✅ WebSocket client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`❌ WebSocket client disconnected: ${socket.id}`);
        });

        // Handle client requests
        socket.on('request-logs', () => {
            socket.emit('logs-update', { message: 'Logs requested' });
        });
    });

    console.log('🔌 WebSocket server initialized');
    return io;
}

/**
 * Emit agent log to all connected clients
 */
export function emitAgentLog(log: AgentLog) {
    if (io) {
        io.emit('agent-log', log);
    }
}

/**
 * Emit scan progress update
 */
export function emitScanProgress(data: {
    scanId: string;
    phase: string;
    phaseName: string;
    phaseNumber: number;
    totalPhases: number;
    progress: number;
}) {
    if (io) {
        io.emit('scan-progress', data);
    }
}

/**
 * Emit scan completion
 */
export function emitScanComplete(data: {
    scanId: string;
    results: any;
    duration: number;
}) {
    if (io) {
        io.emit('scan-complete', data);
    }
}

/**
 * Emit error
 */
export function emitError(error: { message: string; code?: string }) {
    if (io) {
        io.emit('error', error);
    }
}

export function getIO(): SocketIOServer | null {
    return io;
}

export default {
    initializeWebSocket,
    emitAgentLog,
    emitScanProgress,
    emitScanComplete,
    emitError,
    getIO,
};
