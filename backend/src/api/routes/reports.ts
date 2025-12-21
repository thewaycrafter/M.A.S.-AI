import { Router, Request, Response } from 'express';
import { getScanById, writeAuditLog } from '../../services/database';
import { generatePDFReport, ScanReport } from '../../services/pdf-report';

const router = Router();

/**
 * GET /api/reports/:scanId
 * Generate and download PDF report for a specific scan
 */
router.get('/:scanId', async (req: Request, res: Response) => {
    try {
        const { scanId } = req.params;

        // Fetch scan results from database
        const scanData = await getScanById(scanId);

        if (!scanData) {
            return res.status(404).json({
                error: 'Scan not found',
                message: `No scan found with ID: ${scanId}`,
            });
        }

        // Convert to ScanReport format
        const report: ScanReport = {
            scanId: scanData.scanId,
            target: scanData.target,
            startTime: new Date(scanData.startTime),
            endTime: new Date(scanData.endTime || scanData.startTime),
            duration: scanData.duration || 0,
            status: scanData.status,
            coverage: {
                totalCategories: scanData.coverage?.totalCategories ?? 19,
                categoriesTested: scanData.coverage?.categoriesTested ?? [],
                coveragePercentage: scanData.coverage?.coveragePercentage ?? 0,
            },
            findings: {
                total: scanData.findings?.total ?? 0,
                critical: scanData.findings?.critical ?? 0,
                high: scanData.findings?.high ?? 0,
                medium: scanData.findings?.medium ?? 0,
                low: scanData.findings?.low ?? 0,
            },
            vulnerabilities: [
                ...(scanData.webVulnerabilities || []),
                ...(scanData.authenticationFindings || []),
                ...(scanData.authorizationFindings || []),
                ...(scanData.cryptographyFindings || []),
                ...(scanData.businessLogicFindings || []),
                ...(scanData.networkFindings || []),
                ...(scanData.cloudFindings || []),
                ...(scanData.supplyChainFindings || []),
                ...(scanData.clientSideFindings || []),
                ...(scanData.mobileFindings || []),
                ...(scanData.socialEngineeringFindings || []),
                ...(scanData.loggingFindings || []),
            ],
            threats: scanData.threats || {},
            exploits: scanData.exploits || [],
            remediations: scanData.remediations || [],
        };

        // Generate PDF
        const pdfBuffer = await generatePDFReport(report);

        // Write audit log
        await writeAuditLog({
            eventType: 'export',
            target: scanData.target,
            action: `PDF report generated for scan ${scanId}`,
            metadata: {
                scanId,
                reportSize: pdfBuffer.length,
                format: 'PDF',
            },
        });

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="mas-ai-report-${scanId}-${Date.now()}.pdf"`
        );
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF report:', error);
        res.status(500).json({
            error: 'Failed to generate report',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /api/reports/generate
 * Generate PDF from custom scan data (without database lookup)
 */
router.post('/generate', async (req: Request, res: Response) => {
    try {
        const reportData: ScanReport = req.body;

        if (!reportData.target) {
            return res.status(400).json({
                error: 'Invalid data',
                message: 'Report data must include target',
            });
        }

        // Generate PDF
        const pdfBuffer = await generatePDFReport(reportData);

        // Write audit log
        await writeAuditLog({
            eventType: 'export',
            target: reportData.target,
            action: 'Custom PDF report generated',
            metadata: {
                reportSize: pdfBuffer.length,
                format: 'PDF',
            },
        });

        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="mas-ai-report-${Date.now()}.pdf"`
        );
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating custom PDF:', error);
        res.status(500).json({
            error: 'Failed to generate report',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
