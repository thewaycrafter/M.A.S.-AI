'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import styles from './LiveConsole.module.css';

export default function LiveConsole() {
    const { logs, connected, scanProgress, clearLogs: clearWebSocketLogs } = useWebSocket();
    const [isLive, setIsLive] = useState(true);
    const consoleRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (consoleRef.current && isLive) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [logs, isLive]);

    const handleClearLogs = () => {
        clearWebSocketLogs();
    };

    return (
        <div className={styles.consoleWrapper}>
            <div className={styles.consoleHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.terminalIcon}>❯_</span>
                    <span className={styles.headerTitle}>ATTACK CONSOLE</span>
                    <span className={`${styles.statusBadge} ${connected ? styles.statusLive : styles.statusPaused}`}>
                        {connected ? '● LIVE' : '○ OFFLINE'}
                    </span>
                    {scanProgress && (
                        <span className={styles.progressBadge}>
                            Phase {scanProgress.phaseNumber}/{scanProgress.totalPhases}: {scanProgress.phaseName}
                        </span>
                    )}
                </div>
                <div className={styles.headerRight}>
                    <button
                        className={styles.controlBtn}
                        onClick={() => setIsLive(!isLive)}
                        title={isLive ? 'Pause auto-scroll' : 'Resume auto-scroll'}
                    >
                        {isLive ? '⏸' : '▶'}
                    </button>
                    <button
                        className={styles.controlBtn}
                        onClick={handleClearLogs}
                        title="Clear logs"
                    >
                        🗑
                    </button>
                </div>
            </div>

            <div className={styles.consoleBody} ref={consoleRef}>
                {logs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.cursor}></div>
                        <span>
                            {connected
                                ? 'Connected to Singhal AI. Waiting for scan to start...'
                                : 'Connecting to backend...'}
                        </span>
                    </div>
                ) : (
                    logs.map((log, index) => (
                        <div
                            key={`${log.timestamp}-${index}`}
                            className={`${styles.logEntry} ${styles[`log${log.level.charAt(0).toUpperCase() + log.level.slice(1)}`]}`}
                        >
                            <span className={styles.logTimestamp}>[{log.timestamp}]</span>
                            <span className={styles.logAgent}>[{log.agent}]</span>
                            <span className={styles.logMessage}>{log.message}</span>
                        </div>
                    ))
                )}
                {isLive && logs.length > 0 && (
                    <div className={styles.liveCursor}>
                        <span className={styles.cursor}></span>
                    </div>
                )}
            </div>

            <div className={styles.consoleFooter}>
                <span className={styles.footerText}>
                    {logs.length} events logged | {connected ? 'Connected' : 'Disconnected'}
                </span>
                <span className={styles.footerText}>
                    Singhal AI v1.0 | Session: {new Date().toLocaleTimeString()}
                </span>
            </div>
        </div>
    );
}
