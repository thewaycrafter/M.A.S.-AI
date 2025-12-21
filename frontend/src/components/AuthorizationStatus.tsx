'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/utils/auth';
import styles from '../dashboard/dashboard.module.css';

interface Authorization {
    _id: string;
    target: string;
    approverEmail: string;
    status: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    remindersSent?: number;
}

export default function AuthorizationStatus() {
    const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
    const [loading, setLoading] = useState(true);
    const [remindLoading, setRemindLoading] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        fetchAuthorizations();
    }, []);

    const fetchAuthorizations = async () => {
        try {
            const token = getToken();
            const response = await fetch('http://localhost:3001/api/authorization/my-requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setAuthorizations(data.authorizations || []);
            }
        } catch (error) {
            console.error('Failed to fetch authorizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendReminder = async (id: string) => {
        setRemindLoading(id);
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:3001/api/authorization/remind/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message || 'Reminder sent!');
                fetchAuthorizations(); // Refresh
            } else {
                alert(data.error || 'Failed to send reminder');
            }
        } catch (error) {
            alert('Failed to send reminder');
        } finally {
            setRemindLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            user_pending: '#f59e0b',
            admin_pending: '#3b82f6',
            approved: '#00ff41',
            denied: '#f43f5e',
            expired: '#6b7280',
        };
        const labels: Record<string, string> = {
            user_pending: '⏳ Awaiting Domain Owner',
            admin_pending: '🔵 Awaiting Admin',
            approved: '✅ Approved',
            denied: '❌ Denied',
            expired: '⌛ Expired',
        };
        return (
            <span style={{
                color: colors[status] || '#fff',
                fontWeight: 'bold',
                fontSize: '0.85rem'
            }}>
                {labels[status] || status}
            </span>
        );
    };

    const approvedCount = authorizations.filter(a => a.status === 'approved').length;
    const pendingCount = authorizations.filter(a => ['user_pending', 'admin_pending'].includes(a.status)).length;
    const deniedCount = authorizations.filter(a => a.status === 'denied').length;

    if (loading) {
        return <div style={{ padding: '20px', color: '#666' }}>Loading authorization status...</div>;
    }

    if (authorizations.length === 0) {
        return null; // Don't show if no authorizations
    }

    return (
        <div style={{
            background: 'rgba(0, 255, 65, 0.05)',
            border: '1px solid rgba(0, 255, 65, 0.2)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
        }}>
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                }}
            >
                <h3 style={{ color: '#00e5a0', margin: 0, fontSize: '1rem' }}>
                    🔐 My Authorization Requests
                </h3>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span style={{ color: '#00ff41' }}>✅ {approvedCount}</span>
                    <span style={{ color: '#f59e0b' }}>⏳ {pendingCount}</span>
                    <span style={{ color: '#f43f5e' }}>❌ {deniedCount}</span>
                    <span style={{ color: '#666' }}>{expanded ? '▼' : '▶'}</span>
                </div>
            </div>

            {expanded && (
                <div style={{ marginTop: '15px' }}>
                    {authorizations.length === 0 ? (
                        <p style={{ color: '#666' }}>No authorization requests yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {authorizations.map((auth) => (
                                <div
                                    key={auth._id}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '8px',
                                        padding: '12px 15px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>
                                            {auth.target}
                                        </div>
                                        <div style={{ color: '#888', fontSize: '0.85rem' }}>
                                            {new Date(auth.startDate).toLocaleDateString()} - {new Date(auth.endDate).toLocaleDateString()}
                                        </div>
                                        <div style={{ color: '#666', fontSize: '0.8rem' }}>
                                            Approver: {auth.approverEmail}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        {getStatusBadge(auth.status)}

                                        {(auth.status === 'user_pending' || auth.status === 'admin_pending') && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    sendReminder(auth._id);
                                                }}
                                                disabled={remindLoading === auth._id}
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid #f59e0b',
                                                    color: '#f59e0b',
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {remindLoading === auth._id ? '...' : `🔔 Remind${auth.remindersSent ? ` (${auth.remindersSent})` : ''}`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
