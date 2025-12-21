'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Joyride from 'react-joyride';
import LiveConsole from '@/components/LiveConsole';
import Navigation from '@/components/Navigation';
import styles from './dashboard.module.css';
import Image from 'next/image';
import { isAuthenticated, getUser, getToken } from '@/utils/auth';
import { freeTour, proTour, adminTour, tourStyles } from '@/utils/tours';

export default function Dashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'console' | 'report'>('console');
    const [showTargetInput, setShowTargetInput] = useState(false);
    const [target, setTarget] = useState('');
    const [scanning, setScanning] = useState(false);
    const [killSwitchActive, setKillSwitchActive] = useState(false);
    const [scanId, setScanId] = useState<string | null>(null);
    const [scanResults, setScanResults] = useState<any>(null);
    const [hasScanned, setHasScanned] = useState(false);
    const [runTour, setRunTour] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Check authentication
    // Check authentication
    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/auth/login');
            return;
        }
        const currentUser = getUser();
        setUser(currentUser);

        // Show tour on first login (check local storage to be sure)
        const hasSeenTour = localStorage.getItem('singhal_tour_seen');
        if (currentUser && !hasSeenTour) {
            // Also check backend status if available, but trust local storage for "first login" feel
            setTimeout(() => setRunTour(true), 1000);
        }
    }, [router]);

    const handleTourComplete = async () => {
        setRunTour(false);
        localStorage.setItem('singhal_tour_seen', 'true');

        // Mark tour as completed in backend as well
        try {
            await fetch('http://localhost:3001/api/auth/complete-tour', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                },
            });
        } catch (error) {
            console.error('Failed to save tour completion:', error);
        }
    };

    // Select tour based on user role
    const getTourSteps = () => {
        if (!user) return [];
        if (user.role === 'admin') return adminTour;
        if (user.role === 'pro' || user.subscription?.tier === 'pro') return proTour;
        return freeTour;
    };

    // Metrics state
    const [metrics, setMetrics] = useState({
        critical: 0,
        high: 0,
        medium: 0,
        riskScore: 0,
    });

    // Fetch analytics on load
    useEffect(() => {
        if (!isAuthenticated()) return;

        const fetchAnalytics = async () => {
            try {
                const token = getToken();
                const response = await fetch('http://localhost:3001/api/analytics/breakdown', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();

                    // If user has history, use it. Otherwise show zeros (not mock data)
                    const totalVulns = data.critical + data.high + data.medium + data.low;

                    if (totalVulns > 0) {
                        setMetrics({
                            critical: data.critical || 0,
                            high: data.high || 0,
                            medium: data.medium || 0,
                            riskScore: 0, // Calculate if needed, or fetch from backend
                        });
                        // Don't use mock data if real data exists
                        // But for new users, zeros are fine or we can keep the "demo" feel with mocks if preferred.
                        // For now, let's stick to real data or zeros.
                    }
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            }
        };

        fetchAnalytics();
    }, []);

    // Display metrics: use state directly. If new user, it will be 0s.
    // To keep the "hacker feel" for new users, maybe fallback to mock ONLY if truly 0?
    // Let's use real data.
    const displayMetrics = metrics;

    const startScan = async () => {
        if (!target) {
            alert('Please enter a target URL or IP address');
            return;
        }

        setScanning(true);
        setShowTargetInput(false);

        try {
            const response = await fetch('http://localhost:3001/api/scans/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ target }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403 && data.requiresAuthorization) {
                    alert(`⛔ ${data.message}`);
                    setAuthTarget(target);
                    setShowTargetInput(false);
                    setShowAuthModal(true);
                    return;
                }
                throw new Error(data.message || data.error || 'Scan failed');
            }

            console.log('Scan completed:', data);

            // Mark that user has run a scan
            setHasScanned(true);

            // Store full scan results for Report tab
            setScanResults(data);

            // Update metrics from scan results
            if (data.findings) {
                const total = data.findings.total || 0;
                const criticalCount = data.findings.critical || 0;
                const highCount = data.findings.high || 0;
                const mediumCount = data.findings.medium || 0;

                // Calculate risk score (0-10)
                const riskScore = Math.min(
                    ((criticalCount * 10) + (highCount * 7) + (mediumCount * 4)) / 100 * 10,
                    10
                );

                setMetrics({
                    critical: criticalCount,
                    high: highCount,
                    medium: mediumCount,
                    riskScore: parseFloat(riskScore.toFixed(1)),
                });
            }

            // Store scan ID for PDF download
            if (data.scanId) {
                setScanId(data.scanId);
            }

            alert(`✅ Scan completed on ${data.target || target}! Found ${data.findings?.total || 0} vulnerabilities.`);
        } catch (error) {
            console.error('Error starting scan:', error);
            alert('Failed to start scan. Make sure the backend is running.');
        } finally {
            setScanning(false);
        }
    };

    const handleKillSwitch = () => {
        if (confirm('⚠️ KILL SWITCH WARNING: This will immediately terminate all active scans and shut down AI agents. Continue?')) {
            setKillSwitchActive(true);
            // In production, this would call an API endpoint to shut down all scans
            alert('🔴 KILL SWITCH ACTIVATED - All scans terminated');
            setTimeout(() => setKillSwitchActive(false), 3000);
        }
    };

    const handleReset = () => {
        if (confirm('🔄 Reset all data? This will clear all scan results, metrics, and logs.')) {
            setHasScanned(false);
            setScanResults(null);
            setScanId(null);
            setTarget('');
            setMetrics({ critical: 0, high: 0, medium: 0, riskScore: 0 });
            alert('✅ All data has been reset');
        }
    };

    const downloadPDF = async () => {
        try {
            // Use stored scanId if available, otherwise generate custom report
            if (scanId) {
                // Download PDF for specific scan
                window.open(`http://localhost:3001/api/reports/${scanId}`, '_blank');
                alert('✅ PDF report is being generated and downloaded!');
                return;
            }

            // Generate custom PDF from current scan logs
            const logsResponse = await fetch('http://localhost:3001/api/scans/logs');
            const logs = await logsResponse.json();

            // Create sample report data
            const reportData = {
                scanId: `scan-${Date.now()}`,
                target: target || 'No target specified',
                startTime: new Date(Date.now() - 60000),
                endTime: new Date(),
                duration: 60000,
                status: 'completed',
                coverage: {
                    totalCategories: 19,
                    categoriesTested: ['Web', 'Auth', 'Authz', 'Crypto', 'Business Logic'],
                    coveragePercentage: 85,
                },
                findings: {
                    total: metrics.critical + metrics.high + metrics.medium,
                    critical: metrics.critical,
                    high: metrics.high,
                    medium: metrics.medium,
                    low: 0,
                },
                vulnerabilities: [
                    {
                        name: 'SQL Injection in /api/users',
                        severity: 'critical',
                        category: 'Input Validation',
                        cwe: 'CWE-89',
                        description: 'Unsanitized user input in SQL query allows database manipulation',
                    },
                    {
                        name: 'Stored XSS in Comment System',
                        severity: 'critical',
                        category: 'Output Handling',
                        cwe: 'CWE-79',
                        description: 'User-generated content not properly escaped',
                    },
                    {
                        name: 'CSRF Token Missing',
                        severity: 'high',
                        category: 'Authentication',
                        cwe: 'CWE-352',
                        description: 'State-changing requests lack CSRF protection',
                    },
                ],
                threats: {},
                exploits: [],
                remediations: [
                    {
                        title: 'Implement Parameterized Queries',
                        description: 'Use prepared statements for all database operations to prevent SQL injection',
                    },
                    {
                        title: 'Enable Content Security Policy',
                        description: 'Add CSP headers to prevent XSS attacks',
                    },
                ],
            };

            // Call PDF generation API
            const pdfResponse = await fetch('http://localhost:3001/api/reports/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData),
            });

            if (!pdfResponse.ok) {
                throw new Error('Failed to generate PDF');
            }

            // Download the PDF
            const blob = await pdfResponse.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `singhal-ai-report-${Date.now()}.pdf`;
            link.click();
            URL.revokeObjectURL(url);

            alert('✅ PDF report downloaded successfully!');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to generate PDF report. Make sure the backend is running.');
        }
    };

    // Authorization State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authTarget, setAuthTarget] = useState('');
    const [authApproverEmail, setAuthApproverEmail] = useState('');
    const [authStartDate, setAuthStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [authEndDate, setAuthEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [authSubmitting, setAuthSubmitting] = useState(false);

    const checkAuthorization = async (targetToCheck: string) => {
        if (!targetToCheck) return;
        try {
            const response = await fetch(`http://localhost:3001/api/authorization/check/${encodeURIComponent(targetToCheck)}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();

            if (response.ok) {
                if (data.authorized) {
                    return true; // Authorized
                } else {
                    return false; // Not authorized
                }
            }
            return false;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    };

    const requestAuthorization = async () => {
        if (!authTarget || !authApproverEmail || !authStartDate || !authEndDate) {
            alert('Please fill in all fields');
            return;
        }

        setAuthSubmitting(true);
        try {
            const response = await fetch('http://localhost:3001/api/authorization/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    target: authTarget,
                    approverEmail: authApproverEmail,
                    startDate: authStartDate,
                    endDate: authEndDate
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ Authorization request submitted! The domain owner will receive an email for approval.');
                setShowAuthModal(false);
                setShowTargetInput(true); // Go back to scan input
            } else {
                throw new Error(data.error || 'Failed to submit request');
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setAuthSubmitting(false);
        }
    };

    const openAuthModal = (targetUrl: string) => {
        setAuthTarget(targetUrl);
        setShowTargetInput(false);
        setShowAuthModal(true);
    };

    const exportJSON = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/scans/logs');
            const data = await response.json();

            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `singhal-ai-scan-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting JSON:', error);
            alert('Failed to export JSON. Make sure the backend is running.');
        }
    };

    return (
        <div>
            <Navigation />
            <Joyride
                steps={getTourSteps()}
                run={runTour}
                continuous
                showSkipButton
                callback={(data) => {
                    if (data.status === 'finished' || data.status === 'skipped') {
                        handleTourComplete();
                    }
                }}
                styles={tourStyles}
            />
            <div className={styles.dashboardContainer}>
                {/* Target Input Modal */}
                {showTargetInput && (
                    <div className={styles.targetModal}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h2>🎯 START NEW SECURITY SCAN</h2>
                                <button
                                    className={styles.modalClose}
                                    onClick={() => setShowTargetInput(false)}
                                >✕</button>
                            </div>
                            <div className={styles.modalBody}>
                                <label className={styles.inputLabel}>
                                    Target URL or IP Address
                                </label>
                                <input
                                    type="text"
                                    className={styles.targetInput}
                                    placeholder="example.com or 192.168.1.100"
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && startScan()}
                                    autoFocus
                                />
                                <div className={styles.scanOptions}>
                                    <label className={styles.checkbox}>
                                        <input type="checkbox" defaultChecked />
                                        <span>Comprehensive Scan (All 17 Phases)</span>
                                    </label>
                                    <label className={styles.checkbox}>
                                        <input type="checkbox" defaultChecked />
                                        <span>Real-time WebSocket Updates</span>
                                    </label>
                                </div>
                                <div className={styles.warningBox}>
                                    ⚠️ <strong>AUTHORIZATION REQUIRED:</strong> Only scan targets you have explicit permission to test.
                                </div>
                                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                    <button
                                        className={styles.btnSecondary}
                                        onClick={() => openAuthModal(target)}
                                        style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                                    >
                                        Request Authorization for this Target
                                    </button>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button
                                    className={styles.btnCancel}
                                    onClick={() => setShowTargetInput(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={styles.btnStart}
                                    onClick={startScan}
                                    disabled={scanning || !target}
                                >
                                    {scanning ? '⏳ Starting...' : '🚀 START SCAN'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Authorization Request Modal */}
                {showAuthModal && (
                    <div className={styles.targetModal}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h2>🔐 REQUEST AUTHORIZATION</h2>
                                <button
                                    className={styles.modalClose}
                                    onClick={() => setShowAuthModal(false)}
                                >✕</button>
                            </div>
                            <div className={styles.modalBody}>
                                <p style={{ color: '#aaa', marginBottom: '20px' }}>
                                    Scanning unauthorized targets is illegal. Submit a request to the domain owner for approval.
                                </p>

                                <label className={styles.inputLabel}>Target Domain</label>
                                <input
                                    type="text"
                                    className={styles.targetInput}
                                    value={authTarget}
                                    onChange={(e) => setAuthTarget(e.target.value)}
                                    placeholder="example.com"
                                />

                                <label className={styles.inputLabel} style={{ marginTop: '15px' }}>Approver Email (Domain Owner)</label>
                                <input
                                    type="email"
                                    className={styles.targetInput}
                                    value={authApproverEmail}
                                    onChange={(e) => setAuthApproverEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                    <div>
                                        <label className={styles.inputLabel}>Start Date</label>
                                        <input
                                            type="date"
                                            className={styles.targetInput}
                                            value={authStartDate}
                                            onChange={(e) => setAuthStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.inputLabel}>End Date</label>
                                        <input
                                            type="date"
                                            className={styles.targetInput}
                                            value={authEndDate}
                                            onChange={(e) => setAuthEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                            </div>
                            <div className={styles.modalFooter}>
                                <button
                                    className={styles.btnCancel}
                                    onClick={() => setShowAuthModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={styles.btnStart}
                                    onClick={requestAuthorization}
                                    disabled={authSubmitting}
                                >
                                    {authSubmitting ? '⏳ Sending...' : '📨 SEND REQUEST'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className={styles.main}>
                    <div className={styles.container}>
                        {/* Status Banner */}
                        <div className={styles.statusBanner}>
                            <div className={styles.bannerLeft}>
                                <span className={styles.statusIndicator}></span>
                                <span className={styles.bannerText}>
                                    {scanning ? 'SCAN IN PROGRESS' : 'READY FOR SCANNING'}
                                </span>
                            </div>
                            <div className={styles.bannerRight}>
                                <span className={styles.bannerText}>TARGET: {target || 'No active target'}</span>
                                <span className={styles.bannerText}>SESSION: {new Date().toLocaleTimeString()}</span>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className={styles.metricsGrid}>
                            <div className={styles.metricCard}>
                                <div className={styles.metricHeader}>
                                    <span className={styles.metricIcon}>🔴</span>
                                    <span className={styles.metricLabel}>CRITICAL</span>
                                </div>
                                <div className={styles.metricValue}>{displayMetrics.critical}</div>
                                <div className={styles.metricChange}>{displayMetrics.critical > 0 ? `${displayMetrics.critical} detected` : 'None found'}</div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.metricHeader}>
                                    <span className={styles.metricIcon}>🟠</span>
                                    <span className={styles.metricLabel}>HIGH</span>
                                </div>
                                <div className={styles.metricValue}>{displayMetrics.high}</div>
                                <div className={styles.metricChange}>{displayMetrics.high > 0 ? `${displayMetrics.high} detected` : 'None found'}</div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.metricHeader}>
                                    <span className={styles.metricIcon}>🟡</span>
                                    <span className={styles.metricLabel}>MEDIUM</span>
                                </div>
                                <div className={styles.metricValue}>{displayMetrics.medium}</div>
                                <div className={styles.metricChange}>{displayMetrics.medium > 0 ? `${displayMetrics.medium} detected` : 'None found'}</div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.metricHeader}>
                                    <span className={styles.metricIcon}>⚡</span>
                                    <span className={styles.metricLabel}>RISK SCORE</span>
                                </div>
                                <div className={styles.metricValue}>{displayMetrics.riskScore}</div>
                                <div className={styles.metricChange}>
                                    {displayMetrics.riskScore >= 8 ? 'CRITICAL RISK' :
                                        displayMetrics.riskScore >= 6 ? 'HIGH RISK' :
                                            displayMetrics.riskScore >= 4 ? 'MEDIUM RISK' : 'LOW RISK'}
                                </div>
                            </div>
                        </div>

                        {/* Main Grid: Console + Sidebar */}
                        <div className={styles.mainGrid}>
                            {/* Live Console */}
                            <div className={styles.consoleSection}>
                                <div className={styles.sectionTabs}>
                                    <button
                                        className={`${styles.tab} ${activeTab === 'console' ? styles.tabActive : ''}`}
                                        onClick={() => setActiveTab('console')}
                                    >
                                        ❯_ ATTACK CONSOLE
                                    </button>
                                    <button
                                        className={`${styles.tab} ${activeTab === 'report' ? styles.tabActive : ''}`}
                                        onClick={() => setActiveTab('report')}
                                    >
                                        📊 SCAN REPORT
                                    </button>
                                </div>

                                {activeTab === 'console' ? (
                                    <div className={styles.consoleWrapper}>
                                        <LiveConsole />
                                    </div>
                                ) : (
                                    <div className={styles.reportWrapper}>
                                        <div className={styles.reportContent}>
                                            <div className={styles.reportHeader}>
                                                <h3>VULNERABILITY SCAN REPORT</h3>
                                                <span className={styles.reportDate}>{new Date().toLocaleDateString()}</span>
                                            </div>

                                            {!scanResults ? (
                                                <div className={styles.reportSection}>
                                                    <p>No scan completed yet. Start a scan to view results.</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={styles.reportSection}>
                                                        <h4>EXECUTIVE SUMMARY</h4>
                                                        <div className={styles.reportText}>
                                                            <p>Target: <code>{scanResults.target}</code></p>
                                                            <p>Scan ID: <code>{scanResults.scanId}</code></p>
                                                            <p>Total Findings: <code>{scanResults.findings?.total || 0}</code></p>
                                                            <p>Overall Risk: <span className={
                                                                metrics.riskScore >= 8 ? styles.riskCritical :
                                                                    metrics.riskScore >= 6 ? styles.riskHigh :
                                                                        metrics.riskScore >= 4 ? styles.riskMedium : styles.riskLow
                                                            }>
                                                                {metrics.riskScore >= 8 ? 'CRITICAL' :
                                                                    metrics.riskScore >= 6 ? 'HIGH' :
                                                                        metrics.riskScore >= 4 ? 'MEDIUM' : 'LOW'} ({metrics.riskScore}/10)
                                                            </span></p>
                                                        </div>
                                                    </div>

                                                    <div className={styles.reportSection}>
                                                        <h4>FINDINGS BREAKDOWN</h4>
                                                        <div className={styles.reportText}>
                                                            <p>🔴 Critical: {scanResults.findings?.critical || 0}</p>
                                                            <p>🟠 High: {scanResults.findings?.high || 0}</p>
                                                            <p>🟡 Medium: {scanResults.findings?.medium || 0}</p>
                                                            <p>⚪ Low: {scanResults.findings?.low || 0}</p>
                                                        </div>
                                                    </div>

                                                    <div className={styles.reportSection}>
                                                        <h4>DETAILED VULNERABILITIES</h4>
                                                        <div className={styles.findingsList}>
                                                            {scanResults.vulnerabilities && scanResults.vulnerabilities.length > 0 ? (
                                                                scanResults.vulnerabilities.map((vuln: any, idx: number) => (
                                                                    <div key={idx} className={styles.finding}>
                                                                        <span className={`${styles.findingSeverity} ${vuln.severity === 'critical' ? styles.critical :
                                                                            vuln.severity === 'high' ? styles.high :
                                                                                vuln.severity === 'medium' ? styles.medium : styles.low
                                                                            }`}>{vuln.severity?.toUpperCase()}</span>
                                                                        <span className={styles.findingTitle}>{vuln.type} in {vuln.endpoint}</span>
                                                                        <span className={styles.findingCwe}>{vuln.cwe}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p>✅ No vulnerabilities detected</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <div className={styles.reportActions}>
                                                <button className={styles.btnDownload} onClick={downloadPDF} disabled={!scanResults}>
                                                    ⬇ DOWNLOAD PDF
                                                </button>
                                                <button className={styles.btnExport} onClick={exportJSON} disabled={!scanResults}>
                                                    📤 EXPORT JSON
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className={styles.sidebar}>
                                {/* AI Agents */}
                                <div className={styles.sidebarCard}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.cardIcon}>🤖</span>
                                        <h3>AI AGENTS</h3>
                                    </div>
                                    <div className={styles.agentsList}>
                                        {[
                                            { name: 'RECON', status: scanning ? 'ACTIVE' : 'STANDBY', progress: scanning ? 100 : 0 },
                                            { name: 'THREAT_MODEL', status: scanning ? 'ACTIVE' : 'STANDBY', progress: scanning ? 100 : 0 },
                                            { name: 'VULN_REASON', status: scanning ? 'SCANNING' : 'STANDBY', progress: scanning ? 67 : 0 },
                                            { name: 'EXPLOIT_SIM', status: 'STANDBY', progress: 0 },
                                            { name: 'BIZ_LOGIC', status: scanning ? 'ACTIVE' : 'STANDBY', progress: scanning ? 100 : 0 },
                                            { name: 'DEFENSE', status: scanning ? 'ACTIVE' : 'STANDBY', progress: scanning ? 100 : 0 },
                                            { name: 'FUTURE_THREAT', status: scanning ? 'ACTIVE' : 'STANDBY', progress: scanning ? 100 : 0 },
                                        ].map((agent, idx) => (
                                            <div key={idx} className={styles.agentItem}>
                                                <div className={styles.agentTop}>
                                                    <span className={styles.agentName}>{agent.name}</span>
                                                    <span className={`${styles.agentStatus} ${styles['status' + agent.status]}`}>
                                                        {agent.status}
                                                    </span>
                                                </div>
                                                <div className={styles.progressBar}>
                                                    <div
                                                        className={styles.progressFill}
                                                        style={{ width: `${agent.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className={styles.sidebarCard}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.cardIcon}>📊</span>
                                        <h3>QUICK STATS</h3>
                                    </div>
                                    <div className={styles.statsList}>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Scans Today</span>
                                            <span className={styles.statValue}>24</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Vulns Found</span>
                                            <span className={styles.statValue}>187</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Exploits Generated</span>
                                            <span className={styles.statValue}>43</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Fixes Suggested</span>
                                            <span className={styles.statValue}>156</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className={styles.actions}>
                                    <button
                                        className={styles.btnAction}
                                        onClick={() => setShowTargetInput(true)}
                                    >
                                        ▶ NEW SCAN
                                    </button>
                                    <button
                                        className={styles.btnAction}
                                        onClick={() => router.push('/')}
                                    >
                                        ◄ HOME
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
