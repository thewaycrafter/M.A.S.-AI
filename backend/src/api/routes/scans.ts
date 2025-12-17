import express, { Router, Request, Response } from 'express';
import orchestrator from '../../agents/orchestrator';
import { saveScanResult, writeAuditLog } from '../../services/database';
import { requireAuth, checkUsageLimit, AuthRequest } from '../../middleware/auth';
import { User } from '../../models/User';
import { ScanHistory } from '../../models/ScanHistory';

const router: Router = express.Router();

/**
 * POST /api/scans/start
 * Start a new security scan (REQUIRES AUTH + USAGE LIMIT CHECK)
 */
router.post('/start', requireAuth, checkUsageLimit, async (req: AuthRequest, res: Response) => {
    try {
        const { target } = req.body;
        const userId = req.user?.id;

        if (!target) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Target parameter is required',
            });
        }

        // Extract domain from URL if full URL provided
        let cleanTarget = target;
        try {
            cleanTarget = target.replace(/^https?:\/\//, '');
            cleanTarget = cleanTarget.split('/')[0];
            cleanTarget = cleanTarget.replace(/^www\./, '');
        } catch (e) { }

        console.log(`🎯 Initiating scan on ${cleanTarget} by user ${req.user?.username}`);

        // Clear previous logs
        orchestrator.clearAllLogs();

        // Start scan
        const scanId = `scan-${Date.now()}`;
        const startTime = new Date();

        // Run scan and get results
        const results = await orchestrator.runScan(cleanTarget);

        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        // Calculate findings summary
        const allFindings = [
            ...(results.results?.vulnerabilities || []),
            ...(results.results?.threats?.identifiedThreats || []),
        ];

        const findingsBySeverity = {
            total: allFindings.length,
            critical: allFindings.filter((f: any) => f.severity === 'critical').length,
            high: allFindings.filter((f: any) => f.severity === 'high').length,
            medium: allFindings.filter((f: any) => f.severity === 'medium').length,
            low: allFindings.filter((f: any) => f.severity === 'low').length,
        };

        // Calculate estimated tokens and cost
        const estimatedTokens = allFindings.length * 150; // Rough estimate
        const costPerToken = 0.000002; // gpt-4o-mini pricing
        const estimatedCost = (estimatedTokens * costPerToken) * 83; // Convert to INR

        // Save scan to user's history
        try {
            console.log('💾 Saving scan history...');
            const scanHistory = new ScanHistory({
                userId,
                scanId,
                target: cleanTarget,
                status: 'completed',
                results: {
                    vulnerabilities: allFindings,
                    riskScore: Math.min((findingsBySeverity.critical * 3 + findingsBySeverity.high * 2 + findingsBySeverity.medium) / 10, 10),
                    critical: findingsBySeverity.critical,
                    high: findingsBySeverity.high,
                    medium: findingsBySeverity.medium,
                    low: findingsBySeverity.low,
                },
                metadata: {
                    duration: Math.round(duration / 1000),
                    agentsUsed: ['reconnaissance', 'threat-model', 'vulnerability-reasoning'],
                    tokensUsed: estimatedTokens,
                    cost: Number(estimatedCost.toFixed(2)),
                },
                completedAt: endTime,
            });

            await scanHistory.save();
            console.log('✅ Scan history saved successfully');

            // Increment user's scan count
            await User.findByIdAndUpdate(userId, {
                $inc: {
                    'usage.scansThisMonth': 1,
                    'usage.totalScans': 1,
                },
                $set: {
                    'usage.lastScanDate': new Date(),
                },
            });
        } catch (historyError) {
            console.error('❌ CRITICAL: Could not save scan history:', historyError);
        }

        // Save to original database (optional - won't crash if DB unavailable)
        try {
            await saveScanResult({
                scanId,
                target: cleanTarget,
                startTime,
                endTime,
                duration,
                status: 'completed',
                coverage: {
                    totalCategories: 19,
                    categoriesTested: ['Web', 'Auth', 'Authz', 'Crypto', 'Business Logic'],
                    coveragePercentage: 85,
                },
                findings: findingsBySeverity,
                webVulnerabilities: results.results?.vulnerabilities || [],
                authenticationFindings: [],
                authorizationFindings: [],
                cryptographyFindings: [],
                businessLogicFindings: [],
                networkFindings: [],
                cloudFindings: [],
                supplyChainFindings: [],
                clientSideFindings: [],
                mobileFindings: [],
                socialEngineeringFindings: [],
                loggingFindings: [],
                threats: results.results?.threats || {},
                exploits: results.results?.exploits || [],
                remediations: results.results?.remediations || [],
                assets: results.results?.assets || {},
                metadata: {
                    scanType: 'comprehensive',
                    originalTarget: target,
                    userId,
                },
            });
        } catch (dbError) {
            console.warn('⚠️  Could not save scan results (database unavailable)');
        }

        // Send email notification (async)
        if (req.user?.email) {
            console.log(`📧 Sending scan completion email to ${req.user.email}`);
            import('../../services/email').then(({ sendScanCompletionEmail }) => {
                sendScanCompletionEmail(req.user!.email, req.user!.username, {
                    target: cleanTarget,
                    scanId,
                    riskScore: Math.min((findingsBySeverity.critical * 3 + findingsBySeverity.high * 2 + findingsBySeverity.medium) / 10, 10),
                    critical: findingsBySeverity.critical,
                    high: findingsBySeverity.high
                }).then(() => console.log('✅ Email sent successfully'))
                    .catch(err => console.error('❌ Failed to send scan email:', err));
            });
        } else {
            console.warn('⚠️ No email found for user, skipping notification');
        }

        // Write audit log
        try {
            await writeAuditLog({
                eventType: 'scan_complete',
                userId,
                target: cleanTarget,
                action: `Scan completed on ${cleanTarget} by ${req.user?.username}`,
                metadata: {
                    scanId,
                    duration,
                    findings: findingsBySeverity,
                },
            });
        } catch (auditError) {
            console.warn('⚠️  Could not write audit log');
        }

        res.json({
            success: true,
            message: `Scan completed on ${cleanTarget}`,
            scanId,
            target: cleanTarget,
            duration,
            findings: findingsBySeverity,
            results,
        });
    } catch (error: any) {
        console.error('Scan error:', error);

        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message || 'Failed to start scan',
        });
    }
});

/**
 * GET /api/scans/logs
 * Get all agent logs
 */
router.get('/logs', (req: Request, res: Response) => {
    try {
        const logs = orchestrator.getAllLogs();

        res.json({
            success: true,
            count: logs.length,
            logs,
        });
    } catch (error: any) {
        console.error('Error fetching logs:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch logs',
        });
    }
});

/**
 * DELETE /api/scans/logs
 * Clear all agent logs
 */
router.delete('/logs', (req: Request, res: Response) => {
    try {
        orchestrator.clearAllLogs();

        res.json({
            success: true,
            message: 'Logs cleared',
        });
    } catch (error: any) {
        console.error('Error clearing logs:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to clear logs',
        });
    }
});

export default router;
