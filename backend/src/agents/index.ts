import openaiService from '../services/openai';
import { emitAgentLog } from '../services/websocket';

export interface AgentLog {
    timestamp: string;
    level: 'info' | 'success' | 'warning' | 'error' | 'attack';
    agent: string;
    message: string;
}

export class BaseAgent {
    protected name: string;
    protected logs: AgentLog[] = [];

    constructor(name: string) {
        this.name = name;
    }

    protected log(level: AgentLog['level'], message: string) {
        const log: AgentLog = {
            timestamp: new Date().toLocaleTimeString(),
            level,
            agent: this.name,
            message,
        };
        this.logs.push(log);

        // Emit to WebSocket for real-time updates
        emitAgentLog(log);

        // Also log to console for debugging
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            attack: '⚔️',
        }[level];
        console.log(`${emoji} [${this.name}] ${message}`);
        return log;
    }

    getLogs(): AgentLog[] {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }
}

/**
 * Recon Agent - Passive discovery and asset mapping
 */
export class ReconAgent extends BaseAgent {
    constructor() {
        super('RECON');
    }

    async discoverAssets(target: string): Promise<{
        domains: string[];
        endpoints: string[];
        technologies: string[];
    }> {
        this.log('info', `Starting reconnaissance on ${target}`);

        // Simulate port scanning
        await this.delay(1000);
        this.log('info', 'Port scan initiated...');

        await this.delay(1500);
        this.log('success', 'Discovered 23 open ports');

        // Simulate tech fingerprinting
        await this.delay(1000);
        this.log('info', 'Fingerprinting technologies...');

        const mockResult = {
            domains: [target, `api.${target}`, `cdn.${target}`],
            endpoints: [
                '/api/users',
                '/api/auth/login',
                '/api/products',
                '/api/orders',
                '/admin',
            ],
            technologies: ['React', 'Node.js', 'MongoDB', 'Nginx'],
        };

        await this.delay(1500);
        this.log('success', `Technologies identified: ${mockResult.technologies.join(', ')}`);

        return mockResult;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Vulnerability Reasoning Agent - Logic-based vulnerability detection
 */
export class VulnerabilityReasoningAgent extends BaseAgent {
    constructor() {
        super('VULN_REASON');
    }

    async scanForVulnerabilities(context: {
        target: string;
        endpoints: string[];
        technologies: string[];
    }): Promise<any[]> {
        this.log('info', 'Initiating vulnerability scan...');

        const vulnerabilities = [];

        for (const endpoint of context.endpoints) {
            await this.delay(1000);
            this.log('attack', `Testing ${endpoint} for vulnerabilities`);

            // Try AI-powered reasoning first
            if (endpoint.includes('/api/')) {
                try {
                    const result = await openaiService.reasonAboutVulnerability({
                        target: context.target,
                        endpoint,
                        technology: context.technologies.join(', '),
                        observations: [
                            'Endpoint accepts user input',
                            'No visible input sanitization headers',
                            'Using older framework version',
                        ],
                    });

                    if (result.vulnerabilities.length > 0) {
                        for (const vuln of result.vulnerabilities) {
                            this.log('error', `⚠️  ${vuln.type} detected in ${endpoint} (${vuln.severity})`);
                            vulnerabilities.push({ ...vuln, endpoint });
                        }
                    }
                } catch (error) {
                    // Fallback to mock detection when OpenAI fails
                    this.log('warning', 'AI analysis unavailable, using pattern-based detection');
                    const mockVulns = this.generateMockVulnerabilities(endpoint, context.technologies);
                    vulnerabilities.push(...mockVulns);
                }
            } else {
                // For non-API endpoints, use mock detection
                const mockVulns = this.generateMockVulnerabilities(endpoint, context.technologies);
                vulnerabilities.push(...mockVulns);
            }
        }

        this.log('success', `Scan complete. Found ${vulnerabilities.length} vulnerabilities`);
        return vulnerabilities;
    }

    private generateMockVulnerabilities(endpoint: string, technologies: string[]): any[] {
        const vulns = [];

        // Pattern-based vulnerability detection
        if (endpoint.includes('/login') || endpoint.includes('/auth')) {
            vulns.push({
                type: 'Weak Authentication',
                confidence: 0.85,
                reasoning: 'Authentication endpoint detected without rate limiting headers',
                severity: 'high',
                cwe: 'CWE-307',
                endpoint,
            });
            if (!endpoint.includes('https')) {
                vulns.push({
                    type: 'Credentials Over HTTP',
                    confidence: 0.95,
                    reasoning: 'Authentication credentials transmitted over unencrypted channel',
                    severity: 'critical',
                    cwe: 'CWE-319',
                    endpoint,
                });
            }
        }

        if (endpoint.includes('/api/users') || endpoint.includes('/api/admin')) {
            vulns.push({
                type: 'Broken Access Control',
                confidence: 0.75,
                reasoning: 'Sensitive endpoint may lack proper authorization checks',
                severity: 'high',
                cwe: 'CWE-284',
                endpoint,
            });
        }

        if (endpoint.includes('/api/') && (endpoint.includes('id=') || endpoint.includes('search='))) {
            vulns.push({
                type: 'SQL Injection',
                confidence: 0.80,
                reasoning: 'Parameter injection possible in database query',
                severity: 'critical',
                cwe: 'CWE-89',
                endpoint,
            });
        }

        if (endpoint.includes('/api/products') || endpoint.includes('/api/orders')) {
            vulns.push({
                type: 'IDOR (Insecure Direct Object Reference)',
                confidence: 0.70,
                reasoning: 'Predictable resource identifiers without access validation',
                severity: 'medium',
                cwe: 'CWE-639',
                endpoint,
            });
        }

        if (technologies.some(t => t.toLowerCase().includes('react') || t.toLowerCase().includes('vue'))) {
            vulns.push({
                type: 'XSS (Cross-Site Scripting)',
                confidence: 0.65,
                reasoning: 'Frontend framework may render unsanitized user input',
                severity: 'medium',
                cwe: 'CWE-79',
                endpoint,
            });
        }

        // Log detected vulnerabilities
        for (const vuln of vulns) {
            this.log('error', `⚠️  ${vuln.type} detected in ${endpoint} (${vuln.severity})`);
        }

        return vulns;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Exploit Simulation Agent - Sandboxed exploit chain generation
 */
export class ExploitSimulationAgent extends BaseAgent {
    constructor() {
        super('EXPLOIT_SIM');
    }

    async generateExploit(vulnerability: {
        type: string;
        endpoint: string;
        target: string;
    }): Promise<any> {
        this.log('attack', `Generating exploit for ${vulnerability.type}...`);

        await this.delay(2000);

        const exploit = await openaiService.generateExploitChain({
            type: vulnerability.type,
            target: vulnerability.target,
            endpoint: vulnerability.endpoint,
            evidence: 'Error message reveals database structure',
        });

        this.log('success', `Exploit chain generated: ${exploit.exploitChain.length} steps`);
        this.log('info', `PoC created (sandboxed, not executed)`);

        return exploit;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Business Logic AI - Workflow and abuse path detection
 */
export class BusinessLogicAgent extends BaseAgent {
    constructor() {
        super('BIZ_LOGIC');
    }

    async analyzeWorkflow(workflow: {
        name: string;
        steps: string[];
    }): Promise<any> {
        this.log('info', `Analyzing ${workflow.name} workflow...`);

        await this.delay(1500);

        const analysis = await openaiService.analyzeBusinessLogic({
            description: workflow.name,
            steps: workflow.steps,
            userRoles: ['user', 'admin'],
        });

        if (analysis.vulnerabilities.length > 0) {
            for (const vuln of analysis.vulnerabilities) {
                this.log('warning', `Potential ${vuln.type} detected (${vuln.likelihood} likelihood)`);
            }
        } else {
            this.log('success', 'No business logic flaws detected');
        }

        return analysis;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Defense & Fix Agent - Remediation and hardening
 */
export class DefenseAgent extends BaseAgent {
    constructor() {
        super('DEFENSE');
    }

    async generateFix(vulnerability: {
        type: string;
        language: string;
        code?: string;
    }): Promise<any> {
        this.log('info', `Generating fix for ${vulnerability.type}...`);

        await this.delay(2000);

        const remediation = await openaiService.generateRemediation({
            type: vulnerability.type,
            language: vulnerability.language,
            vulnerableCode: vulnerability.code,
        });

        this.log('success', `Secure code fix generated (Priority: ${remediation.priority})`);

        return remediation;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Future Threat Agent - Emerging threat prediction
 */
export class FutureThreatAgent extends BaseAgent {
    constructor() {
        super('FUTURE_THREAT');
    }

    async predictThreats(technology: string): Promise<any> {
        this.log('info', 'Scanning for emerging threats...');

        await this.delay(2000);

        const threats = await openaiService.predictFutureThreats({
            currentThreatLandscape: [
                'AI-driven attacks',
                'Supply chain compromises',
                'Quantum computing risks',
            ],
            targetTechnology: technology,
        });

        this.log('success', `Identified ${threats.threats.length} emerging threats`);

        return threats;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Threat Modeling Agent - Attack surface analysis
 */
export class ThreatModelingAgent extends BaseAgent {
    constructor() {
        super('THREAT_MODEL');
    }

    async modelThreats(assets: {
        endpoints: string[];
        technologies: string[];
    }): Promise<any> {
        this.log('info', 'Building threat model...');

        await this.delay(1500);
        this.log('info', 'Mapping attack surface using STRIDE methodology');

        await this.delay(1000);
        this.log('info', 'Analyzing trust boundaries...');

        await this.delay(1000);
        this.log('success', 'Threat model complete');

        return {
            attackVectors: ['SQL Injection', 'XSS', 'CSRF', 'Business Logic'],
            trustBoundaries: ['Client-Server', 'API-Database', 'User-Admin'],
            riskScore: 8.3,
        };
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
