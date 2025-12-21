import PDFDocument from 'pdfkit';

export interface ScanReport {
    scanId: string;
    target: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    status: string;
    coverage: {
        totalCategories: number;
        categoriesTested: string[];
        coveragePercentage: number;
    };
    findings: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    vulnerabilities: any[];
    threats: any;
    exploits: any[];
    remediations: any[];
}

export class PDFReportGenerator {
    private doc: PDFKit.PDFDocument;
    private buffers: Buffer[] = [];
    private readonly colors = {
        primary: '#00E5A0',      // Bright cyan accent
        secondary: '#0066FF',    // Blue
        critical: '#FF1744',     // Bright red
        high: '#FF6F00',         // Orange
        medium: '#FFC107',       // Amber
        low: '#4CAF50',          // Green
        dark: '#1A1A2E',         // Dark navy
        darker: '#0F0F1E',       // Darker navy
        light: '#F8F9FA',        // Off-white
        text: '#2D3748',         // Slate
        textLight: '#718096',    // Gray
        white: '#FFFFFF',
    };

    constructor() {
        this.doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
            bufferPages: true,
            info: {
                Title: 'Singhal AI Security Assessment Report',
                Author: 'Singhal AI',
                Subject: 'Vulnerability Scan Report',
            }
        });

        this.doc.on('data', (chunk: Buffer) => this.buffers.push(chunk));
    }

    async generate(report: ScanReport): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.doc.on('end', () => resolve(Buffer.concat(this.buffers)));
            this.doc.on('error', reject);

            try {
                this.createCoverPage(report);
                this.doc.addPage();
                this.createExecutiveSummary(report);
                this.doc.addPage();
                this.createRiskDashboard(report);
                this.doc.addPage();
                this.createFindings(report);
                this.doc.addPage();
                this.createRecommendations(report);
                this.addPageNumbers();
                this.doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    private createCoverPage(report: ScanReport) {
        // Premium gradient background
        const gradient = this.doc.linearGradient(0, 0, 0, this.doc.page.height);
        gradient.stop(0, this.colors.darker);
        gradient.stop(0.6, this.colors.dark);
        gradient.stop(1, '#16213E');

        this.doc.rect(0, 0, this.doc.page.width, this.doc.page.height).fill(gradient);

        // Top accent bars
        this.doc.rect(0, 0, this.doc.page.width, 6).fill(this.colors.primary);
        this.doc.rect(0, 8, this.doc.page.width, 3).fill(this.colors.secondary);

        // Logo/Brand
        this.doc
            .fontSize(56)
            .fillColor(this.colors.white)
            .font('Helvetica-Bold')
            .text('SINGHAL', 60, 100, { characterSpacing: 4 });

        this.doc
            .fontSize(56)
            .fillColor(this.colors.primary)
            .text(' AI', { continued: true, characterSpacing: 4 });

        // Subtitle
        this.doc
            .fontSize(18)
            .fillColor(this.colors.textLight)
            .font('Helvetica')
            .text('Vulnerability Assessment Report', 60, 180);

        // Premium card for target info
        this.addPremiumCard(60, 240, 475, 140, () => {
            this.doc
                .fontSize(11)
                .fillColor(this.colors.textLight)
                .font('Helvetica')
                .text('ASSESSMENT TARGET', 80, 260);

            this.doc
                .fontSize(24)
                .fillColor(this.colors.white)
                .font('Helvetica-Bold')
                .text(report.target, 80, 285, { width: 435 });

            this.doc
                .fontSize(10)
                .fillColor(this.colors.textLight)
                .font('Helvetica')
                .text(`SCAN ID: ${report.scanId}`, 80, 340)
                .text(`DATE: ${report.startTime.toLocaleDateString()}`, 80, 355);
        });

        // Risk Score Circle
        const riskScore = this.calculateRiskScore(report.findings);
        const riskColor = this.getRiskColor(riskScore);
        const cx = 300, cy = 520;

        // Glow effect
        for (let i = 3; i > 0; i--) {
            this.doc.circle(cx, cy, 65 + (i * 10)).fillOpacity(0.1).fill(riskColor);
        }

        // Main circle
        this.doc.circle(cx, cy, 65).fillOpacity(1).fillAndStroke(riskColor, this.colors.white).lineWidth(4);

        // Score
        this.doc
            .fontSize(52)
            .fillColor(this.colors.white)
            .font('Helvetica-Bold')
            .text(riskScore.toFixed(1), cx - 40, cy - 26, { width: 80, align: 'center' });

        this.doc
            .fontSize(14)
            .fillColor(this.colors.white)
            .font('Helvetica')
            .text(this.getRiskLevel(riskScore), cx - 80, cy + 35, { width: 160, align: 'center' });

        // Footer stats
        const stats = [
            { label: 'TOTAL FINDINGS', value: report.findings.total },
            { label: 'COVERAGE', value: `${report.coverage.coveragePercentage}%` },
            { label: 'DURATION', value: `${Math.round(report.duration / 1000)}s` },
        ];

        stats.forEach((stat, i) => {
            const x = 100 + (i * 140);
            this.doc
                .fontSize(9)
                .fillColor(this.colors.textLight)
                .font('Helvetica')
                .text(stat.label, x, 680, { width: 120, align: 'center' });

            this.doc
                .fontSize(20)
                .fillColor(this.colors.primary)
                .font('Helvetica-Bold')
                .text(stat.value.toString(), x, 700, { width: 120, align: 'center' });
        });

        // Confidential stamp
        this.doc
            .fontSize(10)
            .fillColor(this.colors.textLight)
            .font('Helvetica-Bold')
            .text('CONFIDENTIAL & PROPRIETARY', 60, 760, { align: 'center', width: 475 });
    }

    private createExecutiveSummary(report: ScanReport) {
        this.addSectionTitle('Executive Summary');

        // Professional intro text
        this.doc
            .fontSize(11)
            .fillColor(this.colors.text)
            .font('Helvetica')
            .text(
                `This comprehensive security assessment was conducted on ${report.target} using Singhal AI's advanced vulnerability scanning platform. Our AI-powered analysis evaluated ${report.coverage.totalCategories} security domains and identified ${report.findings.total} findings requiring attention.`,
                { align: 'justify', lineGap: 4 }
            );

        this.doc.moveDown(2);

        // Scan details in premium cards
        const details = [
            ['Target System', report.target],
            ['Assessment Period', `${report.startTime.toLocaleString()} - ${report.endTime.toLocaleString()}`],
            ['Scan Duration', `${Math.round(report.duration / 1000)} seconds`],
            ['Coverage', `${report.coverage.coveragePercentage}% (${report.coverage.categoriesTested.length}/${report.coverage.totalCategories} categories)`],
        ];

        details.forEach(([label, value], i) => {
            const y = this.doc.y + (i * 35);
            // Subtle background
            this.doc.rect(60, y, 475, 30).fill('#F7FAFC');

            this.doc
                .fontSize(9)
                .fillColor(this.colors.textLight)
                .font('Helvetica-Bold')
                .text(label, 70, y + 8);

            this.doc
                .fontSize(10)
                .fillColor(this.colors.text)
                .font('Helvetica')
                .text(value, 250, y + 8, { width: 275 });
        });

        this.doc.y += details.length * 35 + 20;

        // Severity breakdown with visual bars
        this.addSubtitle('Findings by Severity');

        const findings = [
            { label: 'Critical', count: report.findings.critical, color: this.colors.critical, icon: '●' },
            { label: 'High', count: report.findings.high, color: this.colors.high, icon: '●' },
            { label: 'Medium', count: report.findings.medium, color: this.colors.medium, icon: '●' },
            { label: 'Low', count: report.findings.low, color: this.colors.low, icon: '●' },
        ];

        const maxCount = Math.max(...findings.map(f => f.count), 1);

        findings.forEach((f, i) => {
            const y = this.doc.y + (i * 40);
            const barMaxWidth = 300;
            const barWidth = (f.count / maxCount) * barMaxWidth;

            // Icon
            this.doc
                .fontSize(16)
                .fillColor(f.color)
                .text(f.icon, 60, y);

            // Label
            this.doc
                .fontSize(12)
                .fillColor(this.colors.text)
                .font('Helvetica-Bold')
                .text(f.label, 85, y + 2);

            // Bar with gradient
            if (barWidth > 5) {
                this.doc
                    .roundedRect(170, y, barWidth, 22, 11)
                    .fill(f.color)
                    .fillOpacity(0.15);

                this.doc
                    .roundedRect(170, y, barWidth, 22, 11)
                    .fill(f.color)
                    .fillOpacity(1);
            }

            // Count badge
            this.doc
                .fontSize(14)
                .fillColor(this.colors.text)
                .font('Helvetica-Bold')
                .text(f.count.toString(), 490, y + 3);
        });

        this.doc.y += findings.length * 40;
    }

    private createRiskDashboard(report: ScanReport) {
        this.addSectionTitle('Risk Assessment Dashboard');

        const riskScore = this.calculateRiskScore(report.findings);

        // Large risk indicator
        this.addPremiumCard(60, this.doc.y, 475, 150, () => {
            const y = this.doc.y;

            // Left side - Score
            this.doc
                .fontSize(72)
                .fillColor(this.getRiskColor(riskScore))
                .font('Helvetica-Bold')
                .text(riskScore.toFixed(1), 80, y + 35);

            this.doc
                .fontSize(16)
                .fillColor(this.colors.textLight)
                .font('Helvetica')
                .text('/ 10', 165, y + 80);

            // Right side - Level
            this.doc
                .fontSize(28)
                .fillColor(this.colors.text)
                .font('Helvetica-Bold')
                .text(this.getRiskLevel(riskScore), 250, y + 45);

            // Risk bar
            const barY = y + 100;
            this.doc.rect(250, barY, 260, 20).fill('#E2E8F0');

            const fillWidth = (riskScore / 10) * 260;
            this.doc
                .roundedRect(250, barY, fillWidth, 20, 10)
                .fill(this.getRiskColor(riskScore));
        });

        this.doc.y += 170;

        // Distribution matrix
        this.addSubtitle('Vulnerability Distribution Matrix');

        const matrix = [
            ['Severity', 'Count', 'Weight', 'Risk Contribution'],
            ['Critical', report.findings.critical, '10x', `${(report.findings.critical * 10 / 100 * 100).toFixed(0)}%`],
            ['High', report.findings.high, '7x', `${(report.findings.high * 7 / 100 * 100).toFixed(0)}%`],
            ['Medium', report.findings.medium, '4x', `${(report.findings.medium * 4 / 100 * 100).toFixed(0)}%`],
            ['Low', report.findings.low, '1x', `${(report.findings.low * 1 / 100 * 100).toFixed(0)}%`],
        ];

        matrix.forEach((row, i) => {
            const y = this.doc.y + (i * 32);
            const isHeader = i === 0;

            // Row background
            if (!isHeader) {
                this.doc.rect(60, y, 475, 30).fill(i % 2 === 0 ? '#F7FAFC' : '#FFFFFF');
            } else {
                this.doc.rect(60, y, 475, 30).fill(this.colors.dark);
            }

            // Columns
            const cols = [60, 220, 340, 430];
            row.forEach((cell, j) => {
                this.doc
                    .fontSize(isHeader ? 10 : 11)
                    .fillColor(isHeader ? this.colors.white : this.colors.text)
                    .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
                    .text(String(cell), cols[j] + 10, y + 10);
            });
        });

        this.doc.y += matrix.length * 32 + 20;
    }

    private createFindings(report: ScanReport) {
        this.addSectionTitle('Detailed Vulnerability Findings');

        if (!report.vulnerabilities || report.vulnerabilities.length === 0) {
            this.addPremiumCard(60, this.doc.y, 475, 80, () => {
                this.doc
                    .fontSize(16)
                    .fillColor(this.colors.low)
                    .font('Helvetica-Bold')
                    .text('✓ No Vulnerabilities Detected', 80, this.doc.y + 25);

                this.doc
                    .fontSize(11)
                    .fillColor(this.colors.textLight)
                    .font('Helvetica')
                    .text('The target passed all security checks.', 80, this.doc.y + 15);
            });
            return;
        }

        report.vulnerabilities.slice(0, 12).forEach((vuln, index) => {
            if (this.doc.y > 680) this.doc.addPage();

            const severityColor = this.getSeverityColor(vuln.severity);
            const y = this.doc.y;

            // Card with left accent
            this.doc.rect(60, y, 4, 95).fill(severityColor);
            this.doc.rect(64, y, 471, 95).fill('#FAFAFA').stroke('#E2E8F0').lineWidth(1);

            // Number badge
            this.doc
                .circle(85, y + 22, 15)
                .fill(severityColor);

            this.doc
                .fontSize(12)
                .fillColor(this.colors.white)
                .font('Helvetica-Bold')
                .text(String(index + 1), 75, y + 15, { width: 20, align: 'center' });

            // Severity badge
            this.doc
                .roundedRect(110, y + 8, 70, 22, 11)
                .fill(severityColor);

            this.doc
                .fontSize(10)
                .fillColor(this.colors.white)
                .font('Helvetica-Bold')
                .text(vuln.severity?.toUpperCase() || 'UNKNOWN', 110, y + 13, { width: 70, align: 'center' });

            // Title
            this.doc
                .fontSize(13)
                .fillColor(this.colors.text)
                .font('Helvetica-Bold')
                .text(vuln.type || 'Vulnerability', 190, y + 10, { width: 340 });

            // CWE tag
            if (vuln.cwe) {
                this.doc
                    .fontSize(9)
                    .fillColor(this.colors.textLight)
                    .font('Helvetica')
                    .text(vuln.cwe, 480, y + 12, { width: 50, align: 'right' });
            }

            // Location
            this.doc
                .fontSize(10)
                .fillColor(this.colors.textLight)
                .font('Helvetica')
                .text('Endpoint:', 75, y + 42)
                .fillColor(this.colors.secondary)
                .font('Helvetica-Bold')
                .text(vuln.endpoint || 'N/A', 130, y + 42);

            // Description
            this.doc
                .fontSize(9)
                .fillColor(this.colors.text)
                .font('Helvetica')
                .text(
                    vuln.reasoning || vuln.description || 'No description available',
                    75, y + 62,
                    { width: 450, height: 25, ellipsis: true }
                );

            this.doc.y = y + 105;
        });
    }

    private createRecommendations(report: ScanReport) {
        this.addSectionTitle('Remediation Guide');

        // Generate dynamic recommendations from vulnerabilities
        const remediationGuides: Array<{
            title: string;
            severity: string;
            steps: string[];
            codeExample?: string;
        }> = [];

        // Add recommendations based on actual vulnerabilities
        if (report.vulnerabilities && report.vulnerabilities.length > 0) {
            report.vulnerabilities.slice(0, 5).forEach((vuln: any) => {
                const guide = this.generateRemediationGuide(vuln);
                if (guide) remediationGuides.push(guide);
            });
        }

        // Fallback to generic recommendations if no vulnerabilities
        if (remediationGuides.length === 0) {
            remediationGuides.push(
                {
                    title: 'Implement Input Validation',
                    severity: 'high',
                    steps: [
                        'Validate all user inputs on both client and server side',
                        'Use allowlists for expected input formats',
                        'Sanitize inputs to prevent injection attacks',
                        'Implement length limits on all input fields',
                    ],
                },
                {
                    title: 'Enable Security Headers',
                    severity: 'medium',
                    steps: [
                        'Add Content-Security-Policy header to prevent XSS',
                        'Enable X-Content-Type-Options: nosniff',
                        'Set X-Frame-Options to DENY or SAMEORIGIN',
                        'Add Strict-Transport-Security header for HTTPS',
                    ],
                }
            );
        }

        remediationGuides.forEach((guide, i) => {
            if (this.doc.y > 600) this.doc.addPage();

            const y = this.doc.y;
            const severityColor = this.getSeverityColor(guide.severity);

            // Guide header
            this.doc
                .roundedRect(60, y, 475, 28, 4)
                .fill(severityColor)
                .fillOpacity(0.15);

            this.doc
                .fontSize(12)
                .fillColor(this.colors.text)
                .font('Helvetica-Bold')
                .fillOpacity(1)
                .text(`${i + 1}. ${guide.title}`, 70, y + 8, { width: 400 });

            // Severity badge
            this.doc
                .fontSize(9)
                .fillColor(severityColor)
                .font('Helvetica-Bold')
                .text(guide.severity.toUpperCase(), 480, y + 10, { width: 50, align: 'right' });

            this.doc.y = y + 35;

            // Steps
            guide.steps.forEach((step, stepIndex) => {
                if (this.doc.y > 720) this.doc.addPage();

                this.doc
                    .fontSize(10)
                    .fillColor(this.colors.primary)
                    .font('Helvetica-Bold')
                    .text(`Step ${stepIndex + 1}:`, 70, this.doc.y)
                    .fillColor(this.colors.text)
                    .font('Helvetica')
                    .text(step, 120, this.doc.y - 10, { width: 400 });

                this.doc.moveDown(0.6);
            });

            // Code example if available
            if (guide.codeExample) {
                this.doc
                    .rect(70, this.doc.y, 455, 50)
                    .fill('#1E293B');

                this.doc
                    .fontSize(9)
                    .fillColor('#00E5A0')
                    .font('Courier')
                    .text(guide.codeExample, 80, this.doc.y - 45, { width: 435 });

                this.doc.y += 10;
            }

            this.doc.moveDown(1.5);
        });
    }

    private generateRemediationGuide(vuln: any): any {
        const type = (vuln.type || vuln.name || '').toLowerCase();

        if (type.includes('sql') || type.includes('injection')) {
            return {
                title: `Fix: ${vuln.type || 'SQL Injection'} in ${vuln.endpoint || 'endpoint'}`,
                severity: vuln.severity || 'critical',
                steps: [
                    'Use parameterized queries or prepared statements',
                    'Never concatenate user input directly into SQL queries',
                    'Implement ORM/query builders with built-in escaping',
                    'Validate and sanitize all user inputs',
                    'Apply principle of least privilege to database accounts',
                ],
                codeExample: `// Instead of: query = "SELECT * FROM users WHERE id=" + userId
// Use: db.query("SELECT * FROM users WHERE id = $1", [userId])`,
            };
        }

        if (type.includes('xss') || type.includes('cross-site')) {
            return {
                title: `Fix: ${vuln.type || 'XSS'} in ${vuln.endpoint || 'endpoint'}`,
                severity: vuln.severity || 'high',
                steps: [
                    'Encode all user-generated content before rendering',
                    'Use Content-Security-Policy headers',
                    'Implement context-aware output encoding',
                    'Use HttpOnly and Secure flags on cookies',
                ],
                codeExample: `// Use: escape(userInput) or sanitizeHtml(userInput)
// Never: innerHTML = userInput`,
            };
        }

        if (type.includes('csrf')) {
            return {
                title: `Fix: ${vuln.type || 'CSRF'} Vulnerability`,
                severity: vuln.severity || 'high',
                steps: [
                    'Implement anti-CSRF tokens on all state-changing forms',
                    'Validate tokens on the server for every request',
                    'Use SameSite cookie attribute',
                    'Verify Origin and Referer headers',
                ],
            };
        }

        if (type.includes('auth')) {
            return {
                title: `Fix: ${vuln.type || 'Authentication Issue'}`,
                severity: vuln.severity || 'high',
                steps: [
                    'Implement strong password policies',
                    'Use secure session management',
                    'Add multi-factor authentication',
                    'Implement account lockout after failed attempts',
                ],
            };
        }

        // Generic remediation for unknown types
        return {
            title: `Fix: ${vuln.type || 'Security Issue'} in ${vuln.endpoint || 'application'}`,
            severity: vuln.severity || 'medium',
            steps: [
                'Review the affected code for security issues',
                'Apply the principle of least privilege',
                'Implement proper input validation',
                'Add logging and monitoring for this endpoint',
            ],
        };
    }

    private addSectionTitle(title: string) {
        this.doc
            .fontSize(22)
            .fillColor(this.colors.dark)
            .font('Helvetica-Bold')
            .text(title);

        // Accent underline
        this.doc
            .moveTo(60, this.doc.y + 5)
            .lineTo(200, this.doc.y + 5)
            .strokeColor(this.colors.primary)
            .lineWidth(3)
            .stroke();

        this.doc.moveDown(2);
    }

    private addSubtitle(title: string) {
        this.doc
            .fontSize(14)
            .fillColor(this.colors.text)
            .font('Helvetica-Bold')
            .text(title);

        this.doc.moveDown(0.8);
    }

    private addPremiumCard(x: number, y: number, width: number, height: number, content: () => void) {
        // Shadow
        this.doc.rect(x + 3, y + 3, width, height).fillOpacity(0.05).fill('#000000');

        // Card
        this.doc
            .roundedRect(x, y, width, height, 8)
            .fillOpacity(1)
            .fillAndStroke('#FFFFFF', '#E2E8F0')
            .lineWidth(1);

        const oldY = this.doc.y;
        this.doc.y = y + 10;
        content();
        this.doc.y = oldY;
    }

    private addPageNumbers() {
        const range = (this.doc as any).bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            this.doc.switchToPage(range.start + i);

            if (i > 0) {
                // Footer line
                this.doc
                    .moveTo(60, 770)
                    .lineTo(535, 770)
                    .strokeColor('#E2E8F0')
                    .lineWidth(1)
                    .stroke();

                this.doc
                    .fontSize(9)
                    .fillColor(this.colors.textLight)
                    .font('Helvetica')
                    .text('Singhal AI Security Report', 60, 778)
                    .text(`Page ${i + 1} of ${range.count}`, 450, 778, { width: 85, align: 'right' });
            }
        }
    }

    private calculateRiskScore(findings: any): number {
        const total = findings.critical * 10 + findings.high * 7 + findings.medium * 4 + findings.low * 1;
        return Math.min((total / 100) * 10, 10);
    }

    private getRiskLevel(score: number): string {
        if (score >= 8) return 'CRITICAL';
        if (score >= 6) return 'HIGH RISK';
        if (score >= 4) return 'MODERATE';
        return 'LOW RISK';
    }

    private getRiskColor(score: number): string {
        if (score >= 8) return this.colors.critical;
        if (score >= 6) return this.colors.high;
        if (score >= 4) return this.colors.medium;
        return this.colors.low;
    }

    private getSeverityColor(severity: string): string {
        const sev = severity?.toLowerCase();
        if (sev === 'critical') return this.colors.critical;
        if (sev === 'high') return this.colors.high;
        if (sev === 'medium') return this.colors.medium;
        return this.colors.low;
    }
}

export async function generatePDFReport(report: ScanReport): Promise<Buffer> {
    const parsedReport: ScanReport = {
        ...report,
        startTime: report.startTime instanceof Date ? report.startTime : new Date(report.startTime),
        endTime: report.endTime instanceof Date ? report.endTime : new Date(report.endTime),
    };

    const generator = new PDFReportGenerator();
    return await generator.generate(parsedReport);
}
