'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser, getToken } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import styles from '../admin.module.css';

interface ScanHistoryItem {
    _id: string;
    scanId: string;
    target: string;
    status: string;
    userId: {
        _id: string;
        username: string;
        email: string;
    };
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

interface Stats {
    overview: {
        totalScans: number;
        todayScans: number;
        weekScans: number;
        monthScans: number;
    };
    vulnerabilities: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        avgRiskScore: number;
    };
    financial: {
        totalRevenue: number;
        avgDuration: number;
    };
    topTargets: Array<{ _id: string; count: number }>;
}

export default function AdminScanHistoryPage() {
    const router = useRouter();
    const [scans, setScans] = useState<ScanHistoryItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<Array<{ _id: string; username: string; email: string }>>([]);
    const [domains, setDomains] = useState<Array<{ _id: string; count: number }>>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Filters
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [searchTarget, setSearchTarget] = useState('');
    const [minRiskScore, setMinRiskScore] = useState('');
    const [maxRiskScore, setMaxRiskScore] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        const user = getUser();
        if (!isAuthenticated() || user?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        loadData();
    }, [router]);

    useEffect(() => {
        fetchScans();
    }, [selectedUser, selectedDomain, searchTarget, minRiskScore, maxRiskScore, startDate, endDate, sortBy, sortOrder, page]);

    const loadData = async () => {
        const token = getToken();

        // Load stats, users, domains in parallel
        const [statsRes, usersRes, domainsRes] = await Promise.all([
            fetch('http://localhost:3001/api/scan-history/admin-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('http://localhost:3001/api/scan-history/admin-users', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('http://localhost:3001/api/scan-history/admin-domains', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        if (statsRes.ok) {
            const data = await statsRes.json();
            setStats(data);
        }

        if (usersRes.ok) {
            const data = await usersRes.json();
            setUsers(data.users || []);
        }

        if (domainsRes.ok) {
            const data = await domainsRes.json();
            setDomains(data.domains || []);
        }

        await fetchScans();
        setLoading(false);
    };

    const fetchScans = async () => {
        const token = getToken();
        const params = new URLSearchParams();

        if (selectedUser) params.append('userId', selectedUser);
        if (selectedDomain) params.append('target', selectedDomain);
        if (searchTarget) params.append('target', searchTarget);
        if (minRiskScore) params.append('minRiskScore', minRiskScore);
        if (maxRiskScore) params.append('maxRiskScore', maxRiskScore);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        params.append('limit', String(limit));
        params.append('skip', String((page - 1) * limit));

        const response = await fetch(`http://localhost:3001/api/scan-history/admin-all?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            setScans(data.scans || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
        }
    };

    const downloadPdf = async (scanId: string, target: string) => {
        setDownloadingId(scanId);
        try {
            const response = await fetch(`http://localhost:3001/api/reports/${scanId}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `MAS-AI-Report-${target.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('Failed to download PDF');
        } finally {
            setDownloadingId(null);
        }
    };

    const exportAllCsv = async () => {
        try {
            const token = getToken();
            const params = new URLSearchParams();
            if (selectedUser) params.append('userId', selectedUser);
            if (selectedDomain) params.append('target', selectedDomain);
            params.append('limit', '10000');

            const response = await fetch(`http://localhost:3001/api/scan-history/admin-all?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.json();
            const scansData = data.scans;

            // Create CSV
            const headers = ['Target', 'User', 'Email', 'Risk Score', 'Critical', 'High', 'Medium', 'Low', 'Duration', 'Cost', 'Date'];
            const rows = scansData.map((s: any) => [
                s.target,
                s.userId?.username || 'Unknown',
                s.userId?.email || '',
                s.results?.riskScore || 0,
                s.results?.critical || 0,
                s.results?.high || 0,
                s.results?.medium || 0,
                s.results?.low || 0,
                s.metadata?.duration || 0,
                s.metadata?.cost || 0,
                new Date(s.createdAt).toLocaleDateString()
            ]);

            const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `MAS-AI-Scan-History-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('Failed to export CSV');
        }
    };

    const clearFilters = () => {
        setSelectedUser('');
        setSelectedDomain('');
        setSearchTarget('');
        setMinRiskScore('');
        setMaxRiskScore('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const getSeverityColor = (score: number) => {
        if (score >= 8) return '#ff0040';
        if (score >= 6) return '#ff6b00';
        if (score >= 4) return '#ffa500';
        return '#00ff41';
    };

    if (loading) return <div className={styles.loading}>Loading scan history...</div>;

    return (
        <div>
            <Navigation />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>📊 Admin Scan History</h1>
                    <p className={styles.subtitle}>View and analyze all users&apos; security scans</p>
                </div>

                {/* Stats Overview */}
                {stats && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px',
                        marginBottom: '25px'
                    }}>
                        <div style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.3)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00ff41' }}>{stats.overview.totalScans}</div>
                            <div style={{ color: '#888', fontSize: '0.85rem' }}>Total Scans</div>
                        </div>
                        <div style={{ background: 'rgba(255,0,64,0.1)', border: '1px solid rgba(255,0,64,0.3)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff0040' }}>{stats.vulnerabilities.critical}</div>
                            <div style={{ color: '#888', fontSize: '0.85rem' }}>Critical Vulns</div>
                        </div>
                        <div style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b00' }}>{stats.vulnerabilities.high}</div>
                            <div style={{ color: '#888', fontSize: '0.85rem' }}>High Vulns</div>
                        </div>
                        <div style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00e5a0' }}>₹{stats.financial.totalRevenue}</div>
                            <div style={{ color: '#888', fontSize: '0.85rem' }}>Total Revenue</div>
                        </div>
                    </div>
                )}

                {/* Smart Filters */}
                <div className={styles.card} style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#00e5a0', marginBottom: '15px' }}>🔍 Smart Filters</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                        {/* User Filter */}
                        <div>
                            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>User</label>
                            <select
                                value={selectedUser}
                                onChange={(e) => { setSelectedUser(e.target.value); setPage(1); }}
                                style={{ width: '100%', padding: '10px', background: '#1a1a2e', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                            >
                                <option value="">All Users</option>
                                {users.map((u) => (
                                    <option key={u._id} value={u._id}>{u.username} ({u.email})</option>
                                ))}
                            </select>
                        </div>

                        {/* Domain Filter */}
                        <div>
                            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Domain</label>
                            <select
                                value={selectedDomain}
                                onChange={(e) => { setSelectedDomain(e.target.value); setPage(1); }}
                                style={{ width: '100%', padding: '10px', background: '#1a1a2e', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                            >
                                <option value="">All Domains</option>
                                {domains.map((d) => (
                                    <option key={d._id} value={d._id}>{d._id} ({d.count} scans)</option>
                                ))}
                            </select>
                        </div>

                        {/* Search Target */}
                        <div>
                            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Search</label>
                            <input
                                type="text"
                                placeholder="Search target..."
                                value={searchTarget}
                                onChange={(e) => { setSearchTarget(e.target.value); setPage(1); }}
                                style={{ width: '100%', padding: '10px', background: '#1a1a2e', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                            />
                        </div>

                        {/* Risk Score Range */}
                        <div>
                            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Risk Score</label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minRiskScore}
                                    onChange={(e) => { setMinRiskScore(e.target.value); setPage(1); }}
                                    style={{ width: '50%', padding: '10px', background: '#1a1a2e', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                                    min="0"
                                    max="10"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxRiskScore}
                                    onChange={(e) => { setMaxRiskScore(e.target.value); setPage(1); }}
                                    style={{ width: '50%', padding: '10px', background: '#1a1a2e', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                                    min="0"
                                    max="10"
                                />
                            </div>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>From Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                style={{ width: '100%', padding: '10px', background: '#1a1a2e', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>To Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                style={{ width: '100%', padding: '10px', background: '#1a1a2e', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                            />
                        </div>

                        {/* Sort By */}
                        <div>
                            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{ width: '100%', padding: '10px', background: '#1a1a2e', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                            >
                                <option value="createdAt">Date</option>
                                <option value="results.riskScore">Risk Score</option>
                                <option value="metadata.cost">Cost</option>
                                <option value="target">Target</option>
                            </select>
                        </div>

                        {/* Sort Order */}
                        <div>
                            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Order</label>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                style={{ width: '100%', padding: '10px', background: '#1a1a2e', color: '#fff', border: '1px solid #333', borderRadius: '6px' }}
                            >
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={clearFilters}
                            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            🗑️ Clear Filters
                        </button>
                        <button
                            onClick={exportAllCsv}
                            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #00ff41, #00e5a0)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            📥 Export CSV
                        </button>
                    </div>
                </div>

                {/* Results Count */}
                <div style={{ marginBottom: '15px', color: '#888' }}>
                    Showing {scans.length} of {total} scans (Page {page} of {totalPages})
                </div>

                {/* Scans Table */}
                <div className={styles.card}>
                    {scans.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No scans found matching your filters.</p>
                        </div>
                    ) : (
                        <div className={styles.tableResponsive}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Target</th>
                                        <th>User</th>
                                        <th>Risk</th>
                                        <th>Vulns</th>
                                        <th>Cost</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scans.map((scan) => (
                                        <tr key={scan._id}>
                                            <td>
                                                <strong style={{ color: '#00ff41' }}>{scan.target}</strong>
                                            </td>
                                            <td>
                                                <div>{scan.userId?.username || 'Unknown'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{scan.userId?.email}</div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    color: getSeverityColor(scan.results?.riskScore || 0),
                                                    fontWeight: 'bold'
                                                }}>
                                                    {(scan.results?.riskScore || 0).toFixed(1)}/10
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ color: '#ff0040', marginRight: '8px' }}>C:{scan.results?.critical || 0}</span>
                                                <span style={{ color: '#ff6b00', marginRight: '8px' }}>H:{scan.results?.high || 0}</span>
                                                <span style={{ color: '#ffa500' }}>M:{scan.results?.medium || 0}</span>
                                            </td>
                                            <td>₹{(scan.metadata?.cost || 0).toFixed(2)}</td>
                                            <td>{new Date(scan.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button
                                                    onClick={() => downloadPdf(scan.scanId, scan.target)}
                                                    disabled={downloadingId === scan.scanId}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: downloadingId === scan.scanId ? '#333' : 'linear-gradient(135deg, #00ff41, #00e5a0)',
                                                        color: downloadingId === scan.scanId ? '#888' : '#000',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {downloadingId === scan.scanId ? '...' : '📄 PDF'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ padding: '8px 16px', background: page === 1 ? '#333' : '#00ff41', color: page === 1 ? '#666' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                ← Previous
                            </button>
                            <span style={{ padding: '8px', color: '#00ff41' }}>Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{ padding: '8px 16px', background: page === totalPages ? '#333' : '#00ff41', color: page === totalPages ? '#666' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
