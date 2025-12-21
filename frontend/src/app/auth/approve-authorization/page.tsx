'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/login.module.css';

function ApproveAuthorizationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [authData, setAuthData] = useState<any>(null);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing authorization token');
            setLoading(false);
            return;
        }
        // For now, just show the approval options
        // In production, you might want to fetch the authorization details
        setLoading(false);
    }, [token]);

    const handleApprove = async () => {
        setProcessing(true);
        setError('');
        try {
            const response = await fetch(`http://localhost:3001/api/authorization/user-approve/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to approve');
            setSuccess('✅ Authorization approved successfully! The security test request is now pending admin review.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleDeny = async () => {
        const reason = prompt('Please provide a reason for denial (optional):');
        setProcessing(true);
        setError('');
        try {
            const response = await fetch(`http://localhost:3001/api/authorization/user-deny/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason || 'No reason provided' }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to deny');
            setSuccess('❌ Authorization request has been denied.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.formCard}>
                    <div className={styles.header}>
                        <div className={styles.terminalPrompt}>loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.formCard} style={{ maxWidth: '600px' }}>
                <div className={styles.header}>
                    <div className={styles.terminalPrompt}>root@mas-ai:~# authorize</div>
                    <Link href="/">
                        <h1 className={styles.title}>M.A.S. AI</h1>
                    </Link>
                    <p style={{ color: '#00ff41', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '5px', textTransform: 'uppercase' }}>Multi-agent Adaptive Security</p>
                    <p className={styles.subtitle}>Security Testing Authorization</p>
                </div>

                {error && !success && (
                    <div className={styles.error} style={{ marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                {success ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>
                            {success.includes('approved') ? '✅' : '❌'}
                        </div>
                        <p style={{ color: '#00e5a0', fontSize: '1.1rem', lineHeight: '1.6' }}>
                            {success}
                        </p>
                        <Link href="/" style={{ color: '#00ff41', marginTop: '20px', display: 'inline-block' }}>
                            ← Return to Home
                        </Link>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={{ color: '#00e5a0', fontSize: '1.3rem', marginBottom: '15px' }}>
                                🔐 Authorization Request Review
                            </h2>
                            <p style={{ color: '#aaa', lineHeight: '1.6' }}>
                                A security professional has requested permission to perform penetration testing on your domain.
                            </p>
                        </div>

                        <div style={{
                            background: 'rgba(0, 255, 65, 0.1)',
                            border: '1px solid rgba(0, 255, 65, 0.3)',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '25px'
                        }}>
                            <h3 style={{ color: '#00ff41', marginBottom: '15px', fontSize: '1rem' }}>
                                🛡️ Security Tests to be Performed:
                            </h3>
                            <ul style={{ color: '#ccc', paddingLeft: '20px', lineHeight: '1.8' }}>
                                <li>Web Application Vulnerability Scanning</li>
                                <li>Authentication & Authorization Testing</li>
                                <li>Cryptographic Security Analysis</li>
                                <li>Business Logic Vulnerability Detection</li>
                                <li>API Security Assessment</li>
                                <li>Network & Infrastructure Scanning</li>
                            </ul>
                        </div>

                        <div style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderLeft: '4px solid #f59e0b',
                            padding: '15px',
                            borderRadius: '0 8px 8px 0',
                            marginBottom: '25px'
                        }}>
                            <p style={{ color: '#f59e0b', margin: 0 }}>
                                <strong>⚠️ Important:</strong> Only approve if you own or have authority over the target domain.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                style={{
                                    background: 'linear-gradient(135deg, #00ff41, #00e5a0)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '15px 40px',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    opacity: processing ? 0.6 : 1,
                                }}
                            >
                                {processing ? 'Processing...' : '✓ APPROVE'}
                            </button>
                            <button
                                onClick={handleDeny}
                                disabled={processing}
                                style={{
                                    background: 'transparent',
                                    color: '#f43f5e',
                                    border: '2px solid #f43f5e',
                                    padding: '15px 40px',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    opacity: processing ? 0.6 : 1,
                                }}
                            >
                                {processing ? 'Processing...' : '✕ DENY'}
                            </button>
                        </div>
                    </>
                )}

                <div className={styles.footer} style={{ marginTop: '30px' }}>
                    <Link href="/" className={styles.link}>
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ApproveAuthorizationPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0f' }}>
                <p style={{ color: '#00ff41' }}>Loading...</p>
            </div>
        }>
            <ApproveAuthorizationContent />
        </Suspense>
    );
}
