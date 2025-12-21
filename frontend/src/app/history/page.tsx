'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import styles from './history.module.css';

interface ScanHistoryItem {
    _id: string;
    scanId: string;
    target: string;
    status: string;
    results: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        riskScore: number;
    };
    metadata: {
        duration: number;
        cost: number;
    };
    createdAt: string;
    completedAt: string;
}

export default function HistoryPage() {
    const router = useRouter();
    const [scans, setScans] = useState<ScanHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/auth/login');
            return;
        }
        loadHistory();
    }, [router]);

    const loadHistory = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/scan-history/history', {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setScans(data.scans || []);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredScans = scans.filter(scan =>
        scan.target.toLowerCase().includes(filter.toLowerCase())
    );

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#ff0040';
            case 'high': return '#ff6b00';
            case 'medium': return '#ffa500';
            default: return '#00ff41';
        }
    };

    return (
        <div>
            <Navigation />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <span className={styles.glitch}>SCAN HISTORY</span>
                    </h1>
                    <p className={styles.subtitle}>View all your previous security scans</p>
                </div>

                <div className={styles.controls}>
                    <input
                        type="text"
                        placeholder="Filter by target..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className={styles.searchInput}
                    />
                    <button onClick={loadHistory} className={styles.refreshBtn}>
                        🔄 Refresh
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loading}>Loading scan history...</div>
                ) : filteredScans.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No scans found.</p>
                        <button onClick={() => router.push('/dashboard')} className={styles.startBtn}>
                            Start Your First Scan
                        </button>
                    </div>
                ) : (
                    <div className={styles.scanGrid}>
                        {filteredScans.map((scan) => (
                            <div key={scan._id} className={styles.scanCard}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.target}>{scan.target}</h3>
                                    <span className={styles.date}>
                                        {new Date(scan.completedAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className={styles.metrics}>
                                    <div className={styles.metric}>
                                        <span className={styles.label}>Risk Score</span>
                                        <span className={styles.value} style={{ color: getSeverityColor((scan.results?.riskScore || 0) > 7 ? 'critical' : (scan.results?.riskScore || 0) > 5 ? 'high' : 'medium') }}>
                                            {(scan.results?.riskScore || 0).toFixed(1)}/10
                                        </span>
                                    </div>
                                    <div className={styles.metric}>
                                        <span className={styles.label}>Critical</span>
                                        <span className={styles.value} style={{ color: '#ff0040' }}>
                                            {scan.results?.critical || 0}
                                        </span>
                                    </div>
                                    <div className={styles.metric}>
                                        <span className={styles.label}>High</span>
                                        <span className={styles.value} style={{ color: '#ff6b00' }}>
                                            {scan.results?.high || 0}
                                        </span>
                                    </div>
                                    <div className={styles.metric}>
                                        <span className={styles.label}>Medium</span>
                                        <span className={styles.value} style={{ color: '#ffa500' }}>
                                            {scan.results?.medium || 0}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    <span className={styles.duration}>
                                        ⏱️ {scan.metadata.duration}s
                                    </span>
                                    <span className={styles.cost}>
                                        💰 ₹{scan.metadata.cost.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
