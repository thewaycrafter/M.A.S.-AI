import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface AgentLog {
    timestamp: string;
    level: 'info' | 'success' | 'warning' | 'error' | 'attack';
    agent: string;
    message: string;
}

export interface ScanProgress {
    scanId: string;
    phase: string;
    phaseName: string;
    phaseNumber: number;
    totalPhases: number;
    progress: number;
}

export function useWebSocket() {
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [connected, setConnected] = useState(false);
    const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Connect to WebSocket server
        const socket = io('http://localhost:3001', {
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            setConnected(false);
        });

        // Listen for agent logs
        socket.on('agent-log', (log: AgentLog) => {
            setLogs(prev => [...prev, log]);
        });

        // Listen for scan progress
        socket.on('scan-progress', (progress: ScanProgress) => {
            setScanProgress(progress);
        });

        // Listen for scan completion
        socket.on('scan-complete', (data: any) => {
            console.log('Scan complete:', data);
            setScanProgress(null);
        });

        // Listen for errors
        socket.on('error', (error: any) => {
            console.error('WebSocket error:', error);
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, []);

    const clearLogs = () => {
        setLogs([]);
        setScanProgress(null);
    };

    const requestLogs = () => {
        if (socketRef.current) {
            socketRef.current.emit('request-logs');
        }
    };

    return {
        logs,
        connected,
        scanProgress,
        clearLogs,
        requestLogs,
    };
}
