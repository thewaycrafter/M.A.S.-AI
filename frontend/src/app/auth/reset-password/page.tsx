'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/login.module.css';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [stage, setStage] = useState<'request' | 'reset'>(token ? 'reset' : 'request');

    // Request password reset
    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('If an account exists with this email, you will receive a password reset link.');
            } else {
                setError(data.error || 'Failed to request password reset');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Reset password with token
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Password reset successful! Redirecting to login...');
                setTimeout(() => router.push('/auth/login'), 2000);
            } else {
                setError(data.error || 'Failed to reset password. The link may have expired.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <div className={styles.header}>
                    <div className={styles.terminalPrompt}>M.A.S. AI</div>
                    <h1 className={styles.title}>
                        {stage === 'request' ? '🔐 FORGOT PASSWORD' : '🔑 RESET PASSWORD'}
                    </h1>
                    <p className={styles.subtitle}>
                        {stage === 'request'
                            ? 'Enter your email to receive a password reset link'
                            : 'Enter your new password'
                        }
                    </p>
                </div>

                {message && (
                    <div style={{
                        background: 'rgba(0, 255, 65, 0.1)',
                        border: '1px solid #00ff41',
                        color: '#00ff41',
                        padding: '12px',
                        marginBottom: '20px',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '12px'
                    }}>
                        [SUCCESS] {message}
                    </div>
                )}

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                {stage === 'request' ? (
                    <form onSubmit={handleRequestReset} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                placeholder="your@email.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? '⏳ SENDING...' : '📧 SEND RESET LINK'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                disabled={loading}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={styles.input}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? '⏳ RESETTING...' : '🔑 RESET PASSWORD'}
                        </button>
                    </form>
                )}

                <div className={styles.footer}>
                    <p>
                        Remember your password?{' '}
                        <Link href="/auth/login" className={styles.link}>
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
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
            <ResetPasswordContent />
        </Suspense>
    );
}
