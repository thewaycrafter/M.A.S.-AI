'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser, getToken, logout } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import styles from './profile.module.css';

interface UserStats {
    totalScans: number;
    scansThisMonth: number;
    totalVulnerabilitiesFound: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    totalCostSaved: number;
    recentScans: Array<{
        _id: string;
        target: string;
        createdAt: string;
        results?: { riskScore?: number; critical?: number };
    }>;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/auth/login');
            return;
        }

        const currentUser = getUser();
        setUser(currentUser);
        loadUserStats();
    }, [router]);

    const loadUserStats = async () => {
        try {
            const token = getToken();
            const headers = { 'Authorization': `Bearer ${token}` };

            const [lifetimeRes, breakdownRes, monthlyRes] = await Promise.all([
                fetch('http://localhost:3001/api/analytics/lifetime', { headers }),
                fetch('http://localhost:3001/api/analytics/breakdown', { headers }),
                fetch('http://localhost:3001/api/analytics/monthly', { headers })
            ]);

            if (lifetimeRes.ok && breakdownRes.ok && monthlyRes.ok) {
                const lifetime = await lifetimeRes.json();
                const breakdown = await breakdownRes.json();
                const monthly = await monthlyRes.json();

                // Get current month's scan count
                const currentMonthIndex = new Date().getMonth();
                const scansThisMonth = monthly.monthlyData[currentMonthIndex] || 0;

                setStats({
                    totalScans: lifetime.totalScans,
                    scansThisMonth,
                    totalVulnerabilitiesFound: lifetime.vulnerabilitiesFound,
                    criticalFindings: breakdown.critical,
                    highFindings: breakdown.high,
                    mediumFindings: breakdown.medium,
                    lowFindings: breakdown.low,
                    totalCostSaved: lifetime.costSaved,
                    recentScans: [],
                });

                // Fetch recent scans for activity
                const historyRes = await fetch('http://localhost:3001/api/scan-history/history', { headers });
                if (historyRes.ok) {
                    const historyData = await historyRes.json();
                    setStats(prev => prev ? { ...prev, recentScans: historyData.scans?.slice(0, 5) || [] } : null);
                }
            } else {
                throw new Error('Failed to fetch analytics');
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
            // Fallback to zeros
            setStats({
                totalScans: 0,
                scansThisMonth: 0,
                totalVulnerabilitiesFound: 0,
                criticalFindings: 0,
                highFindings: 0,
                mediumFindings: 0,
                lowFindings: 0,
                totalCostSaved: 0,
                recentScans: [],
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading || !user) {
        return (
            <div>
                <Navigation />
                <div className={styles.loading}>Loading your dashboard...</div>
            </div>
        );
    }

    const subscriptionTier = user.subscription?.tier || 'free';
    const scanLimitInfo = subscriptionTier === 'free'
        ? `${stats?.scansThisMonth || 0}/3 scans used this month`
        : 'Unlimited scans';

    return (
        <div>
            <Navigation />
            <div className={styles.container}>
                {/* Header Section */}
                <div className={styles.header}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userDetails}>
                            <h1 className={styles.username}>{user.username}</h1>
                            <p className={styles.email}>{user.email}</p>
                            <div className={styles.badges}>
                                <span className={`${styles.badge} ${styles[user.role]}`}>
                                    {user.role.toUpperCase()}
                                </span>
                                <span className={styles.badge}>
                                    {user.subscription?.tier?.toUpperCase() || 'FREE'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.quickActions}>
                        <button onClick={() => router.push('/dashboard')} className={styles.actionBtn}>
                            New Scan
                        </button>
                        <button onClick={() => router.push('/pricing')} className={styles.actionBtn}>
                            {user.role === 'free' ? 'Upgrade' : 'Billing'}
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>🔍</div>
                        <div className={styles.statValue}>{stats?.totalScans}</div>
                        <div className={styles.statLabel}>Total Scans</div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>⚡</div>
                        <div className={styles.statValue}>{stats?.scansThisMonth}</div>
                        <div className={styles.statLabel}>This Month</div>
                        <div className={styles.statNote}>{scanLimitInfo}</div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>🐛</div>
                        <div className={styles.statValue}>{stats?.totalVulnerabilitiesFound}</div>
                        <div className={styles.statLabel}>Vulnerabilities Found</div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>💰</div>
                        <div className={styles.statValue}>₹{stats?.totalCostSaved.toLocaleString()}</div>
                        <div className={styles.statLabel}>Cost Saved</div>
                        <div className={styles.statNote}>vs manual testing</div>
                    </div>
                </div>

                {/* Vulnerability Breakdown */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.glitch}>VULNERABILITY BREAKDOWN</span>
                    </h2>
                    <div className={styles.vulnGrid}>
                        <div className={`${styles.vulnCard} ${styles.critical}`}>
                            <div className={styles.vulnCount}>{stats?.criticalFindings}</div>
                            <div className={styles.vulnLabel}>Critical</div>
                        </div>
                        <div className={`${styles.vulnCard} ${styles.high}`}>
                            <div className={styles.vulnCount}>{stats?.highFindings}</div>
                            <div className={styles.vulnLabel}>High</div>
                        </div>
                        <div className={`${styles.vulnCard} ${styles.medium}`}>
                            <div className={styles.vulnCount}>{stats?.mediumFindings}</div>
                            <div className={styles.vulnLabel}>Medium</div>
                        </div>
                        <div className={`${styles.vulnCard} ${styles.low}`}>
                            <div className={styles.vulnCount}>{stats?.lowFindings}</div>
                            <div className={styles.vulnLabel}>Low</div>
                        </div>
                    </div>
                </div>

                {/* Account Info */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.glitch}>ACCOUNT INFORMATION</span>
                    </h2>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Member Since</span>
                            <span className={styles.infoValue}>
                                {user.subscription?.startDate
                                    ? new Date(user.subscription.startDate).toLocaleDateString()
                                    : 'N/A'}
                            </span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Subscription Status</span>
                            <span className={`${styles.infoValue} ${styles.active}`}>
                                {user.subscription?.status || 'Active'}
                            </span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>API Access</span>
                            <span className={styles.infoValue}>
                                {user.role === 'free' ? 'Not Available' : 'Enabled'}
                            </span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Data Retention</span>
                            <span className={styles.infoValue}>
                                {subscriptionTier === 'free' ? 'Last 30 days' : subscriptionTier === 'pro' ? '12 months' : 'Unlimited'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.glitch}>RECENT ACTIVITY</span>
                    </h2>
                    <div className={styles.activityList}>
                        {stats?.recentScans && stats.recentScans.length > 0 ? (
                            stats.recentScans.map((scan) => (
                                <div key={scan._id} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>🔍</div>
                                    <div className={styles.activityDetails}>
                                        <div className={styles.activityTitle}>Scan completed on {scan.target}</div>
                                        <div className={styles.activityTime}>
                                            {new Date(scan.createdAt).toLocaleDateString()} at {new Date(scan.createdAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <div className={styles.activityAction}>
                                        <button onClick={() => router.push('/history')} className={styles.viewBtn}>
                                            View Report
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.activityItem}>
                                <div className={styles.activityIcon}>📭</div>
                                <div className={styles.activityDetails}>
                                    <div className={styles.activityTitle}>No recent scans</div>
                                    <div className={styles.activityTime}>Start a scan to see activity here</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Logout Button */}
                <div className={styles.footer}>
                    <button onClick={logout} className={styles.logoutBtn}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
