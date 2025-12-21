'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        console.log('🔐 Starting login...');

        try {
            console.log('📤 Sending request to backend...');
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            console.log('📥 Response received:', response.status);
            const data = await response.json();
            console.log('📦 Data:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user in localStorage
            console.log('💾 Storing token and user...');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to dashboard
            console.log('🚀 Redirecting to dashboard...');
            router.push('/dashboard');
        } catch (err: any) {
            console.error('❌ Login error:', err);
            setError(err.message);
        } finally {
            console.log('✅ Login complete, setting loading to false');
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <div className={styles.header}>
                    <div className={styles.terminalPrompt}>root@mas-ai:~#</div>
                    <Link href="/">
                        <h1 className={styles.title}>M.A.S. AI</h1>
                    </Link>
                    <p className={styles.subtitle}>Defensive-First AI Penetration Testing</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Username</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="Enter username or email"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="password"
                                className={styles.input}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter password"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'AUTHENTICATING...' : 'ACCESS GRANTED'}
                    </button>
                </form>

                <div className={styles.footer}>
                    <Link href="/" className={styles.link}>
                        ← Back to Home
                    </Link>
                    {' | '}
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className={styles.link}>
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    );
}
