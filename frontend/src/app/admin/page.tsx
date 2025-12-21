'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, getUser } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import styles from './admin.module.css';

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/auth/login');
            return;
        }
        const currentUser = getUser();
        if (currentUser?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }
        setUser(currentUser);
    }, [router]);

    if (!user) return null;

    return (
        <div className={styles.adminContainer}>
            <Navigation />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Admin Control Center</h1>
                    <p className={styles.subtitle}>Manage system authorizations, view audit logs, and oversee platform security.</p>
                </div>

                <div className={styles.grid}>
                    {/* User Management Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>👥</span>
                            <h2>User Management</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            Manage user accounts, update subscriptions, and control access permissions. Block or delete users as needed.
                        </p>
                        <Link href="/admin/users" className={styles.btnSecondary}>
                            Manage Users →
                        </Link>
                    </div>

                    {/* Authorization Management Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>🔐</span>
                            <h2>Authorization Requests</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            Review and approve pending scan authorization requests from users. Ensure all scans have proper domain owner consent.
                        </p>
                        <Link href="/admin/authorization" className={styles.btnPrimary}>
                            Manage Authorizations →
                        </Link>
                    </div>

                    {/* Audit Logs Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>📜</span>
                            <h2>Audit Logs</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            View immutable audit logs for compliance and security monitoring. Track all system actions and user activities.
                        </p>
                        <Link href="/admin/audit" className={styles.btnSecondary}>
                            View Audit Logs →
                        </Link>
                    </div>

                    {/* System Health Card (Placeholder) */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>🖥️</span>
                            <h2>System Health</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            Monitor server status, database connections, and AI agent performance metrics.
                        </p>
                        <button className={styles.btnDisabled} disabled>
                            Coming Soon
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
