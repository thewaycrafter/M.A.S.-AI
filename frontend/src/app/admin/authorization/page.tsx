'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser, getToken } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import styles from '../admin.module.css';

export default function AuthorizationPage() {
    const router = useRouter();
    const [allRequests, setAllRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'user_pending' | 'admin_pending' | 'approved' | 'denied'>('all');

    useEffect(() => {
        // Check admin access
        const user = getUser();
        if (!isAuthenticated() || user?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchAllRequests();
    }, [router]);

    const fetchAllRequests = async () => {
        try {
            const token = getToken();
            const response = await fetch('http://localhost:3001/api/authorization/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setAllRequests(data.authorizations || []);
            } else {
                setError('Failed to fetch requests');
            }
        } catch (err) {
            console.error('Failed to fetch requests:', err);
            setError('Failed to load authorization requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'deny' | 'bypass') => {
        setActionLoading(id);

        try {
            const token = getToken();
            let endpoint = '';

            if (action === 'approve') {
                endpoint = `http://localhost:3001/api/authorization/admin-approve/${id}`;
            } else if (action === 'deny') {
                endpoint = `http://localhost:3001/api/authorization/admin-deny/${id}`;
            } else if (action === 'bypass') {
                endpoint = `http://localhost:3001/api/authorization/admin-bypass/${id}`;
            }

            const body = action === 'deny' ? { reason: 'Denied by admin' } : {};

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                fetchAllRequests(); // Refresh list
                alert(`Action completed successfully`);
            } else {
                const data = await response.json();
                alert(data.error || `Failed to perform action`);
            }
        } catch (error) {
            console.error(`Error performing action:`, error);
            alert(`An error occurred`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { class: string; label: string }> = {
            user_pending: { class: styles.badgeWarning || 'badge-warning', label: '⏳ User Pending' },
            admin_pending: { class: styles.badgeInfo || 'badge-info', label: '🔵 Admin Pending' },
            approved: { class: styles.badgeSuccess || 'badge-success', label: '✅ Approved' },
            denied: { class: styles.badgeDanger || 'badge-danger', label: '❌ Denied' },
            expired: { class: styles.badgeDanger || 'badge-danger', label: '⌛ Expired' },
        };
        const badge = badges[status] || { class: '', label: status };
        return <span className={`${styles.badge} ${badge.class}`}>{badge.label}</span>;
    };

    const filteredRequests = filter === 'all'
        ? allRequests
        : allRequests.filter(r => r.status === filter);

    if (loading) return <div className={styles.loading}>Loading authorization requests...</div>;

    return (
        <div>
            <Navigation />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Authorization Management</h1>
                    <p className={styles.subtitle}>Review and manage all authorization requests</p>
                </div>

                {/* Filter Tabs */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {(['all', 'user_pending', 'admin_pending', 'approved', 'denied'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 16px',
                                background: filter === f ? '#00ff41' : 'rgba(255,255,255,0.1)',
                                color: filter === f ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                            }}
                        >
                            {f === 'all' ? 'All' : f.replace('_', ' ').toUpperCase()}
                            {' '}({f === 'all' ? allRequests.length : allRequests.filter(r => r.status === f).length})
                        </button>
                    ))}
                </div>

                <div className={styles.card}>
                    <h2>Authorization Requests</h2>

                    {error && <div className={styles.error}>{error}</div>}

                    {filteredRequests.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No authorization requests found.</p>
                        </div>
                    ) : (
                        <div className={styles.tableResponsive}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Target</th>
                                        <th>Requester</th>
                                        <th>Approver</th>
                                        <th>Dates</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map((req) => (
                                        <tr key={req._id}>
                                            <td className={styles.targetCell}>
                                                <strong>{req.target}</strong>
                                            </td>
                                            <td>
                                                <div>{req.requesterId?.username || 'Unknown'}</div>
                                                <div className={styles.email}>{req.requesterId?.email}</div>
                                            </td>
                                            <td>
                                                <div className={styles.email}>{req.approverEmail}</div>
                                            </td>
                                            <td>
                                                <div>From: {new Date(req.startDate).toLocaleDateString()}</div>
                                                <div>To: {new Date(req.endDate).toLocaleDateString()}</div>
                                            </td>
                                            <td>
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className={styles.actionsCell}>
                                                {req.status === 'user_pending' && (
                                                    <button
                                                        className={`${styles.btn} ${styles.btnApprove}`}
                                                        onClick={() => handleAction(req._id, 'bypass')}
                                                        disabled={actionLoading === req._id}
                                                        title="Bypass user approval and approve directly"
                                                    >
                                                        {actionLoading === req._id ? '...' : '⚡ Bypass & Approve'}
                                                    </button>
                                                )}
                                                {req.status === 'admin_pending' && (
                                                    <>
                                                        <button
                                                            className={`${styles.btn} ${styles.btnApprove}`}
                                                            onClick={() => handleAction(req._id, 'approve')}
                                                            disabled={actionLoading === req._id}
                                                        >
                                                            {actionLoading === req._id ? '...' : '✓ Approve'}
                                                        </button>
                                                        <button
                                                            className={`${styles.btn} ${styles.btnDeny}`}
                                                            onClick={() => handleAction(req._id, 'deny')}
                                                            disabled={actionLoading === req._id}
                                                        >
                                                            {actionLoading === req._id ? '...' : '✕ Deny'}
                                                        </button>
                                                    </>
                                                )}
                                                {(req.status === 'approved' || req.status === 'denied') && (
                                                    <span style={{ color: '#666', fontStyle: 'italic' }}>
                                                        No actions available
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
