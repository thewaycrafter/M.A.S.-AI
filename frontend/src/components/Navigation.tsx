'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, isAuthenticated, logout } from '@/utils/auth';
import ThemeToggle from './ThemeToggle';
import styles from './Navigation.module.css';

export default function Navigation() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated()) {
            setUser(getUser());
        }
    }, []);

    const handleLogout = () => {
        logout();
    };

    // Visitor menu (not logged in)
    if (!user) {
        return (
            <nav className={styles.nav}>
                <div className={styles.container}>
                    <Link href="/" className={styles.logo} title="Multi-agent Adaptive Security">
                        <span className={styles.glitch}>M.A.S. AI</span>
                    </Link>
                    <div className={styles.menu}>
                        <Link href="/pricing" className={styles.navLink}>Pricing</Link>
                        <Link href="/scans" className={styles.navLink}>Scan Info</Link>
                        <Link href="/auth/login" className={styles.navLink}>Login</Link>
                        <Link href="/auth/signup" className={`${styles.navLink} ${styles.signupBtn}`}>
                            Sign Up
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
            </nav>
        );
    }

    // Logged-in user menu
    return (
        <nav className={styles.nav}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo} title="Multi-agent Adaptive Security">
                    <span className={styles.glitch}>M.A.S. AI</span>
                </Link>

                <div className={styles.menu}>
                    <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
                    <Link href="/scans" className={styles.navLink}>Scan Info</Link>
                    <Link href="/history" className={styles.navLink}>History</Link>
                    <Link href="/profile" className={styles.navLink}>Profile</Link>

                    {/* Admin-only links */}
                    {user.role === 'admin' && (
                        <div className={styles.dropdown}>
                            <button className={styles.navLink}>Admin ▼</button>
                            <div className={styles.dropdownContent}>
                                <Link href="/admin/scan-history">Scan History</Link>
                                <Link href="/admin/authorization">Authorization</Link>
                                <Link href="/admin/audit">Audit Logs</Link>
                            </div>
                        </div>
                    )}

                    {/* Free users see upgrade option */}
                    {user.subscription?.tier === 'free' && (
                        <Link href="/pricing" className={`${styles.navLink} ${styles.upgradeBtn}`}>
                            Upgrade to Pro
                        </Link>
                    )}

                    {/* User menu */}
                    <div className={styles.dropdown}>
                        <button className={styles.navLink}>
                            {user.username} ({user.role}) ▼
                        </button>
                        <div className={styles.dropdownContent}>
                            <div className={styles.userInfo}>
                                <p><strong>{user.subscription?.tier || 'free'}</strong> plan</p>
                                <p>Scans: {user.usage?.scansThisMonth || 0}/{user.role === 'free' ? '3' : '∞'}</p>
                            </div>
                            <Link href="/pricing">Billing</Link>
                            <button onClick={handleLogout} className={styles.logoutBtn}>
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Theme Toggle */}
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}
