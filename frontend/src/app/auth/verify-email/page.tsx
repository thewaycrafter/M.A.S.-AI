'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/login.module.css';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided. Please check your email link.');
            return;
        }

        // Verify the email
        const verifyEmail = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/auth/verify-email?token=${token}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage(data.message || 'Email verified successfully!');
                    // Redirect to login after 3 seconds
                    setTimeout(() => router.push('/auth/login'), 3000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed. The link may have expired.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Network error. Please try again.');
            }
        };

        verifyEmail();
    }, [token, router]);

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <div className={styles.header}>
                    <div className={styles.terminalPrompt}>M.A.S. AI</div>
                    <h1 className={styles.title}>
                        {status === 'loading' && '⏳ VERIFYING...'}
                        {status === 'success' && '✅ VERIFIED!'}
                        {status === 'error' && '❌ FAILED'}
                    </h1>
                </div>

                <div style={{
                    textAlign: 'center',
                    padding: '30px 0',
                    fontFamily: "'Courier New', monospace"
                }}>
                    {status === 'loading' && (
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '20px',
                            animation: 'pulse 1s infinite'
                        }}>
                            🔄
                        </div>
                    )}
                    {status === 'success' && (
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                            🎉
                        </div>
                    )}
                    {status === 'error' && (
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                            😞
                        </div>
                    )}

                    <p style={{
                        fontSize: '14px',
                        marginBottom: '20px',
                        color: status === 'success' ? '#00ff41' : status === 'error' ? '#ff0040' : 'rgba(0, 255, 65, 0.6)'
                    }}>
                        {status === 'success' && '[SUCCESS] '}
                        {status === 'error' && '[ERROR] '}
                        {message}
                    </p>

                    {status === 'success' && (
                        <p style={{ color: 'rgba(0, 255, 65, 0.5)', fontSize: '12px' }}>
                            Redirecting to login page...
                        </p>
                    )}

                    {status === 'error' && (
                        <div className={styles.footer} style={{ marginTop: '20px' }}>
                            <Link href="/auth/login" className={styles.link}>
                                Go to Login
                            </Link>
                            {' | '}
                            <Link href="/auth/signup" className={styles.link}>
                                Create New Account
                            </Link>
                        </div>
                    )}
                </div>

                <style jsx>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.1); }
                    }
                `}</style>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.formCard}>
                    <div className={styles.header}>
                        <div className={styles.terminalPrompt}>M.A.S. AI</div>
                        <h1 className={styles.title}>⏳ LOADING...</h1>
                    </div>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
