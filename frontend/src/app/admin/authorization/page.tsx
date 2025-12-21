'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser, getToken } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import styles from '../admin.module.css';

export default function AuthorizationPage() {
    const router = useRouter();
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        // Check admin access
        const user = getUser();
        if (!isAuthenticated() || user?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchPendingRequests();
    }, [router]);

    const fetchPendingRequests = async () => {
        try {
            const token = getToken();
            const response = await fetch('http://localhost:3001/api/authorization/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setPendingRequests(data.authorizations || []);
            } else {
                setError('Failed to fetch pending requests');
            }
        } catch (err) {
            console.error('Failed to fetch requests:', err);
            setError('Failed to load authorization requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'deny') => {
        setActionLoading(id);

        try {
            const token = getToken();
            const endpoint = action === 'approve'
                ? `http://localhost:3001/api/authorization/admin-approve/${id}`
                : `http://localhost:3001/api/authorization/admin-deny/${id}`;

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
                // Remove from list
                setPendingRequests(prev => prev.filter(req => req._id !== id));
                alert(`Authorization ${action}d successfully`);
            } else {
                alert(`Failed to ${action} authorization`);
            }
        } catch (error) {
            console.error(`Error ${action}ing request:`, error);
            alert(`An error occurred`);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className={styles.loading}>Loading authorization requests...</div>;

    return (
        <div>
            <Navigation />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Authorization Management</h1>
                    <p className={styles.subtitle}>Review and approve pending authorization requests</p>
                </div>

                <div className={styles.card}>
                    <h2>Pending Approvals</h2>

                    {error && <div className={styles.error}>{error}</div>}

                    {pendingRequests.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No pending authorization requests.</p>
                        </div>
                    ) : (
                        <div className={styles.tableResponsive}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Target</th>
                                        <th>Requester</th>
                                        <th>Dates</th>
                                        <th>User Approval</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingRequests.map((req) => (
                                        <tr key={req._id}>
                                            <td className={styles.targetCell}>
                                                <strong>{req.target}</strong>
                                            </td>
                                            <td>
                                                <div>{req.requesterId?.username || 'Unknown'}</div>
                                                <div className={styles.email}>{req.requesterId?.email}</div>
                                            </td>
                                            <td>
                                                <div>From: {new Date(req.startDate).toLocaleDateString()}</div>
                                                <div>To: {new Date(req.endDate).toLocaleDateString()}</div>
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                                                    Verified
                                                </span>
                                                <div className={styles.emailSmall}>{req.approverEmail}</div>
                                            </td>
                                            <td className={styles.actionsCell}>
                                                <button
                                                    className={`${styles.btn} ${styles.btnApprove}`}
                                                    onClick={() => handleAction(req._id, 'approve')}
                                                    disabled={actionLoading === req._id}
                                                >
                                                    {actionLoading === req._id ? '...' : 'Approve'}
                                                </button>
                                                <button
                                                    className={`${styles.btn} ${styles.btnDeny}`}
                                                    onClick={() => handleAction(req._id, 'deny')}
                                                    disabled={actionLoading === req._id}
                                                >
                                                    {actionLoading === req._id ? '...' : 'Deny'}
                                                </button>
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
