import {
    ReconAgent,
    VulnerabilityReasoningAgent,
    ExploitSimulationAgent,
    BusinessLogicAgent,
    DefenseAgent,
    FutureThreatAgent,
    ThreatModelingAgent,
    AgentLog,
} from './index';

export class AgentOrchestrator {
    private reconAgent: ReconAgent;
    private threatModelingAgent: ThreatModelingAgent;
    private vulnReasoningAgent: VulnerabilityReasoningAgent;
    private exploitSimAgent: ExploitSimulationAgent;
    private bizLogicAgent: BusinessLogicAgent;
    private defenseAgent: DefenseAgent;
    private futureThreatAgent: FutureThreatAgent;

    constructor() {
        this.reconAgent = new ReconAgent();
        this.threatModelingAgent = new ThreatModelingAgent();
        this.vulnReasoningAgent = new VulnerabilityReasoningAgent();
        this.exploitSimAgent = new ExploitSimulationAgent();
        this.bizLogicAgent = new BusinessLogicAgent();
        this.defenseAgent = new DefenseAgent();
        this.futureThreatAgent = new FutureThreatAgent();
    }

    /**
     * Run a complete security scan
     */
    async runScan(target: string): Promise<{
        target: string;
        startedAt: string;
        completedAt: string;
        results: {
            assets: any;
            threats: any;
            vulnerabilities: any[];
            exploits: any[];
            remediations: any[];
            futureThreats: any;
        };
        logs: AgentLog[];
    }> {
        const startedAt = new Date().toISOString();
        console.log(`\n🚀 Starting comprehensive security scan on ${target}\n`);

        // Phase 1: Reconnaissance
        console.log('📡 Phase 1: Reconnaissance');
        const assets = await this.reconAgent.discoverAssets(target);

        // Phase 2: Threat Modeling
        console.log('\n🗺️  Phase 2: Threat Modeling');
        const threatModel = await this.threatModelingAgent.modelThreats({
            endpoints: assets.endpoints,
            technologies: assets.technologies,
        });

        // Phase 3: Vulnerability Scanning
        console.log('\n🔍 Phase 3: Vulnerability Scanning');
        const vulnerabilities = await this.vulnReasoningAgent.scanForVulnerabilities({
            target,
            endpoints: assets.endpoints,
            technologies: assets.technologies,
        });

        // Phase 4: Business Logic Analysis
        console.log('\n📈 Phase 4: Business Logic Analysis');
        const bizLogicResults = await this.bizLogicAgent.analyzeWorkflow({
            name: 'Payment Processing',
            steps: [
                'User adds items to cart',
                'User applies coupon code',
                'User initiates checkout',
                'Payment is processed',
                'Order is confirmed',
            ],
        });

        // Phase 5: Exploit Generation (for critical vulns only)
        console.log('\n⚙️  Phase 5: Exploit Generation');
        const exploits = [];
        for (const vuln of vulnerabilities.filter(v => v.severity === 'critical').slice(0, 2)) {
            const exploit = await this.exploitSimAgent.generateExploit({
                type: vuln.type,
                endpoint: vuln.endpoint,
                target,
            });
            exploits.push({ vulnerability: vuln, exploit });
        }

        // Phase 6: Remediation Generation
        console.log('\n🔧 Phase 6: Remediation Generation');
        const remediations = [];
        for (const vuln of vulnerabilities.slice(0, 3)) {
            const fix = await this.defenseAgent.generateFix({
                type: vuln.type,
                language: 'JavaScript',
            });
            remediations.push({ vulnerability: vuln, fix });
        }

        // Phase 7: Future Threat Prediction
        console.log('\n🌐 Phase 7: Future Threat Analysis');
        const futureThreats = await this.futureThreatAgent.predictThreats(
            assets.technologies.join(', ')
        );

        const completedAt = new Date().toISOString();

        // Collect all logs
        const allLogs = [
            ...this.reconAgent.getLogs(),
            ...this.threatModelingAgent.getLogs(),
            ...this.vulnReasoningAgent.getLogs(),
            ...this.exploitSimAgent.getLogs(),
            ...this.bizLogicAgent.getLogs(),
            ...this.defenseAgent.getLogs(),
            ...this.futureThreatAgent.getLogs(),
        ];

        console.log(`\n✅ Scan complete. Found ${vulnerabilities.length} vulnerabilities\n`);

        return {
            target,
            startedAt,
            completedAt,
            results: {
                assets,
                threats: threatModel,
                vulnerabilities,
                exploits,
                remediations,
                futureThreats,
            },
            logs: allLogs,
        };
    }

    /**
     * Get all agent logs
     */
    getAllLogs(): AgentLog[] {
        return [
            ...this.reconAgent.getLogs(),
            ...this.threatModelingAgent.getLogs(),
            ...this.vulnReasoningAgent.getLogs(),
            ...this.exploitSimAgent.getLogs(),
            ...this.bizLogicAgent.getLogs(),
            ...this.defenseAgent.getLogs(),
            ...this.futureThreatAgent.getLogs(),
        ];
    }

    /**
     * Clear all logs
     */
    clearAllLogs() {
        this.reconAgent.clearLogs();
        this.threatModelingAgent.clearLogs();
        this.vulnReasoningAgent.clearLogs();
        this.exploitSimAgent.clearLogs();
        this.bizLogicAgent.clearLogs();
        this.defenseAgent.clearLogs();
        this.futureThreatAgent.clearLogs();
    }
}

export default new AgentOrchestrator();
