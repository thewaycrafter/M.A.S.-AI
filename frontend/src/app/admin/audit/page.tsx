'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser, getToken } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import styles from '../admin.module.css';

export default function AuditPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const user = getUser();
        if (!isAuthenticated() || user?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchLogs();
    }, [router]);

    const fetchLogs = async () => {
        try {
            const token = getToken();
            const response = await fetch('http://localhost:3001/api/admin/audit-logs?limit=100', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setLogs(data.logs || []);
            } else {
                setError(data.error || 'Failed to fetch logs');
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
            setError('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading secure audit logs...</div>;

    return (
        <div>
            <Navigation />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Immutable Audit Logs</h1>
                    <p className={styles.subtitle}>Cryptographically verified system events</p>
                </div>

                <div className={styles.card}>
                    <div className={styles.tableHeader}>
                        <h3>Recent Events</h3>
                        <div className={styles.badges}>
                            <span className={styles.badge} style={{ background: '#333' }}>
                                {logs.length} Entries
                            </span>
                        </div>
                    </div>

                    <div className={styles.codeBlock} style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {logs.length > 0 ? (
                            logs.map((log) => (
                                <div key={log.id} className={styles.logEntry}>
                                    <div className={styles.logMeta}>
                                        <span style={{ color: '#00ff41' }}>{new Date(log.created_at).toLocaleString()}</span>
                                        <span>|</span>
                                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{log.event_type.toUpperCase()}</span>
                                        <span>|</span>
                                        <span>User: {log.user_id || 'System'}</span>
                                        <span>|</span>
                                        <span>IP: {log.ip_address}</span>
                                    </div>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        Action: <span style={{ color: '#ccc' }}>{log.action}</span>
                                    </div>
                                    {log.metadata && (
                                        <pre style={{ color: '#888', margin: 0, fontSize: '0.8rem' }}>
                                            {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                    )}
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#444' }}>
                                        HMAC: {log.details_hmac?.substring(0, 20)}...
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                                No audit logs found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
