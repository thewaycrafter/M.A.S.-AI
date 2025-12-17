'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser, getToken } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import styles from '../admin.module.css';

export default function AuthorizationPage() {
    const router = useRouter();
    const [targets, setTargets] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [validating, setValidating] = useState(false);
    const [testTarget, setTestTarget] = useState('');
    const [validationResult, setValidationResult] = useState<any>(null);

    useEffect(() => {
        // Check admin access
        const user = getUser();
        if (!isAuthenticated() || user?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchTargets();
    }, [router]);

    const fetchTargets = async () => {
        try {
            const token = getToken();
            const response = await fetch('http://localhost:3001/api/authorization/targets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setTargets(data.targets || []);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch targets:', err);
            setError('Failed to load authorized targets');
            setLoading(false);
        }
    };

    const handleValidate = async (e: FormEvent) => {
        e.preventDefault();
        setValidating(true);
        setValidationResult(null);

        try {
            const token = getToken();
            const response = await fetch('http://localhost:3001/api/authorization/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ target: testTarget })
            });
            const data = await response.json();
            setValidationResult(data);
        } catch (err) {
            console.error('Validation error:', err);
        } finally {
            setValidating(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading authorization configuration...</div>;

    return (
        <div>
            <Navigation />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Authorization Management</h1>
                    <p className={styles.subtitle}>Manage authorized scanning targets and rules</p>
                </div>

                <div className={styles.card}>
                    <h2>Authorized Targets (Whitelist)</h2>
                    <p className={styles.subtitle} style={{ marginBottom: '1rem' }}>
                        Targets configured in environment variables (AUTHORIZED_TARGETS)
                    </p>

                    {targets.length > 0 ? (
                        <div className={styles.codeBlock}>
                            {targets.map((target, index) => (
                                <div key={index}>{target}</div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.codeBlock} style={{ color: '#888' }}>
                            No specific targets whitelisted (Open Authorization or Env Var missing)
                        </div>
                    )}
                </div>

                <div className={styles.card}>
                    <h2>Test Authorization Rules</h2>
                    <form onSubmit={handleValidate} style={{ marginTop: '1rem' }}>
                        <input
                            type="text"
                            value={testTarget}
                            onChange={(e) => setTestTarget(e.target.value)}
                            className={styles.search}
                            placeholder="Enter domain to test (e.g. example.com)"
                            style={{ width: '400px', marginRight: '1rem' }}
                        />
                        <button type="submit" className={styles.actionBtn} disabled={validating}>
                            {validating ? 'Validating...' : 'Check Permission'}
                        </button>
                    </form>

                    {validationResult && (
                        <div style={{
                            marginTop: '1rem', padding: '1rem',
                            background: validationResult.authorized ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                            border: `1px solid ${validationResult.authorized ? '#00ff41' : '#ff0000'}`,
                            borderRadius: '4px'
                        }}>
                            <strong>Status: </strong>
                            {validationResult.authorized ? '✅ AUTHORIZED' : '❌ BLOCKED'}
                            {!validationResult.authorized && validationResult.reason && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                    Reason: {validationResult.reason}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
