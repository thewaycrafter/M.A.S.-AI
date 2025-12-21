'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { getToken, isAuthenticated } from '@/utils/auth';
import styles from './authorizations.module.css';

interface Authorization {
    _id: string;
    target: string;
    approverEmail: string;
    status: string; // 'user_pending', 'admin_pending', 'approved', 'denied', 'expired'
    startDate: string;
    endDate: string;
    createdAt: string;
    remindersSent?: number;
}

export default function AuthorizationsPage() {
    const router = useRouter();
    const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved', 'denied'
    const [remindLoading, setRemindLoading] = useState<string | null>(null);

    // Modal state for new request
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authTarget, setAuthTarget] = useState('');
    const [authApproverEmail, setAuthApproverEmail] = useState('');
    const [authStartDate, setAuthStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [authEndDate, setAuthEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [authSubmitting, setAuthSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/auth/login');
            return;
        }
        fetchAuthorizations();
    }, [router]);

    const fetchAuthorizations = async () => {
        setLoading(true);
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

    const sendReminder = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
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
                fetchAuthorizations(); // Refresh to update reminder count if applicable
            } else {
                alert(data.error || 'Failed to send reminder');
            }
        } catch (error) {
            alert('Failed to send reminder');
        } finally {
            setRemindLoading(null);
        }
    };

    const handleNewRequest = async () => {
        if (!authTarget || !authApproverEmail || !authStartDate || !authEndDate) {
            alert('Please fill in all fields');
            return;
        }

        setAuthSubmitting(true);
        try {
            const response = await fetch('http://localhost:3001/api/authorization/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    target: authTarget,
                    approverEmail: authApproverEmail,
                    startDate: authStartDate,
                    endDate: authEndDate
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ Authorization request submitted! The domain owner will receive an email for approval.');
                setShowAuthModal(false);
                setAuthTarget('');
                setAuthApproverEmail('');
                fetchAuthorizations(); // Refresh list
            } else {
                throw new Error(data.error || 'Failed to submit request');
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setAuthSubmitting(false);
        }
    };

    // Filter Logic
    const filteredAuths = authorizations.filter(auth => {
        // Search Filter
        const matchesSearch = auth.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
            auth.approverEmail.toLowerCase().includes(searchTerm.toLowerCase());

        // Status Filter
        let matchesStatus = true;
        if (filterStatus === 'pending') {
            matchesStatus = ['user_pending', 'admin_pending'].includes(auth.status);
        } else if (filterStatus === 'approved') {
            matchesStatus = auth.status === 'approved';
        } else if (filterStatus === 'denied') {
            matchesStatus = auth.status === 'denied' || auth.status === 'expired'; // Treat expired as denied/inactive
        }

        return matchesSearch && matchesStatus;
    });

    const getStatusLabel = (status: string) => {
        if (status === 'user_pending') return '⏳ Wait: Domain Owner';
        if (status === 'admin_pending') return '🔵 Wait: Admin';
        if (status === 'approved') return '✅ Approved';
        if (status === 'denied') return '❌ Denied';
        if (status === 'expired') return '⌛ Expired';
        return status;
    };

    const getStatusClass = (status: string) => {
        if (status === 'approved') return styles.status_approved;
        if (status === 'denied' || status === 'expired') return styles.status_denied;
        return styles.status_pending;
    };

    return (
        <div className={styles.container}>
            <Navigation />

            <div className={styles.mainContent}>
                <Link href="/dashboard" className={styles.backLink}>← Back to Dashboard</Link>

                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>MY AUTHORIZATIONS</h1>
                        <p className={styles.subtitle}>Manage permissions for security scans on external domains</p>
                    </div>
                    <button className={styles.newRequestBtn} onClick={() => setShowAuthModal(true)}>
                        <span>+</span> NEW REQUEST
                    </button>
                </div>

                <div className={styles.controls}>
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search domains or emails..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={styles.filters}>
                        <button
                            className={`${styles.filterBtn} ${filterStatus === 'all' ? styles.active : ''}`}
                            onClick={() => setFilterStatus('all')}
                        >
                            All
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filterStatus === 'pending' ? styles.active : ''}`}
                            onClick={() => setFilterStatus('pending')}
                        >
                            Pending
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filterStatus === 'approved' ? styles.active : ''}`}
                            onClick={() => setFilterStatus('approved')}
                        >
                            Approved
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filterStatus === 'denied' ? styles.active : ''}`}
                            onClick={() => setFilterStatus('denied')}
                        >
                            Denied/Expired
                        </button>
                    </div>
                </div>

                <div className={styles.grid}>
                    {loading ? (
                        <div className={styles.emptyState}>Loading authorizations...</div>
                    ) : filteredAuths.length === 0 ? (
                        <div className={styles.emptyState}>No authorization requests found matching your filters.</div>
                    ) : (
                        filteredAuths.map(auth => (
                            <div key={auth._id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.target}>{auth.target}</div>
                                    <div className={`${styles.status} ${getStatusClass(auth.status)}`}>
                                        {getStatusLabel(auth.status)}
                                    </div>
                                </div>
                                <div className={styles.details}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.icon}>📧</span>
                                        <span>{auth.approverEmail}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.icon}>📅</span>
                                        <span>{new Date(auth.startDate).toLocaleDateString()} — {new Date(auth.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.icon}>🕒</span>
                                        <span>Requested on {new Date(auth.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {['user_pending', 'admin_pending'].includes(auth.status) && (
                                    <div className={styles.actions}>
                                        <button
                                            className={styles.btnAction}
                                            onClick={(e) => sendReminder(auth._id, e)}
                                            disabled={remindLoading === auth._id}
                                        >
                                            {remindLoading === auth._id ? 'Sending...' : '🔔 Send Reminder'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Reuse Modal Logic (Inline styles for simplicity or reuse dashboard styles if imported) */}
            {showAuthModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#111', border: '1px solid #333',
                        padding: '30px', borderRadius: '8px',
                        width: '90%', maxWidth: '500px',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowAuthModal(false)}
                            style={{
                                position: 'absolute', top: '15px', right: '20px',
                                background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer'
                            }}
                        >✕</button>

                        <h2 style={{ color: '#00ff41', fontFamily: 'Courier New', marginTop: 0 }}>REQUEST AUTHORIZATION</h2>

                        <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>
                            Submit a request to the domain owner for approval.
                        </p>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>Target Domain</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: '#fff' }}
                                placeholder="example.com"
                                value={authTarget}
                                onChange={(e) => setAuthTarget(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>Approver Email</label>
                            <input
                                type="email"
                                style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: '#fff' }}
                                placeholder="admin@example.com"
                                value={authApproverEmail}
                                onChange={(e) => setAuthApproverEmail(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>Start Date</label>
                                <input
                                    type="date"
                                    style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: '#fff' }}
                                    value={authStartDate}
                                    onChange={(e) => setAuthStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>End Date</label>
                                <input
                                    type="date"
                                    style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: '#fff' }}
                                    value={authEndDate}
                                    onChange={(e) => setAuthEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => setShowAuthModal(false)}
                                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #666', color: '#fff', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNewRequest}
                                disabled={authSubmitting}
                                style={{ padding: '10px 20px', background: '#00ff41', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                {authSubmitting ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
