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
            <div className={styles.loginBox}>
                <div className={styles.header}>
                    <Link href="/" className={styles.logo}>M.A.S. AI</Link>
                    <h1 className={styles.title}>
                        {status === 'loading' && '⏳ Verifying...'}
                        {status === 'success' && '✅ Email Verified!'}
                        {status === 'error' && '❌ Verification Failed'}
                    </h1>
                </div>

                <div style={{
                    textAlign: 'center',
                    padding: '30px 0',
                    color: status === 'success' ? '#00ff41' : status === 'error' ? '#ff4444' : '#888'
                }}>
                    {status === 'loading' && (
                        <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'spin 1s linear infinite' }}>
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

                    <p style={{ fontSize: '16px', marginBottom: '20px' }}>
                        {message}
                    </p>

                    {status === 'success' && (
                        <p style={{ color: '#888', fontSize: '14px' }}>
                            Redirecting to login page...
                        </p>
                    )}

                    {status === 'error' && (
                        <div style={{ marginTop: '20px' }}>
                            <Link
                                href="/auth/login"
                                className={styles.link}
                                style={{ marginRight: '20px' }}
                            >
                                Go to Login
                            </Link>
                            <Link href="/auth/signup" className={styles.link}>
                                Create New Account
                            </Link>
                        </div>
                    )}
                </div>

                <style jsx>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
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
                <div className={styles.loginBox}>
                    <div className={styles.header}>
                        <div className={styles.logo}>M.A.S. AI</div>
                        <h1 className={styles.title}>⏳ Loading...</h1>
                    </div>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
