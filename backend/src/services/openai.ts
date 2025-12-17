import OpenAI from 'openai';
import config from '../config';

class OpenAIService {
    private client: OpenAI;
    private model: string = 'gpt-4o-mini';

    constructor() {
        if (!config.openai.apiKey) {
            console.warn('⚠️  OpenAI API key not configured. AI features will not work.');
        }

        this.client = new OpenAI({
            apiKey: config.openai.apiKey || 'dummy-key',
        });
    }

    /**
     * Generate AI response for vulnerability reasoning
     */
    async reasonAboutVulnerability(context: {
        target: string;
        endpoint: string;
        technology: string;
        observations: string[];
    }): Promise<{
        vulnerabilities: Array<{
            type: string;
            confidence: number;
            reasoning: string;
            severity: 'critical' | 'high' | 'medium' | 'low';
            cwe?: string;
        }>;
    }> {
        const prompt = `You are an elite security researcher analyzing a web application for vulnerabilities.

Target: ${context.target}
Endpoint: ${context.endpoint}
Technology Stack: ${context.technology}
Observations:
${context.observations.map((obs, idx) => `${idx + 1}. ${obs}`).join('\n')}

Your task:
1. Identify potential vulnerabilities based on the observations
2. Reason about exploitability
3. Assign confidence scores (0-1) based on evidence strength
4. Classify severity (critical, high, medium, low)
5. Provide CWE references where applicable

Output ONLY valid JSON in this exact format:
{
  "vulnerabilities": [
    {
      "type": "SQL Injection",
      "confidence": 0.95,
      "reasoning": "Detailed explanation...",
      "severity": "critical",
      "cwe": "CWE-89"
    }
  ]
}`;

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a security expert specializing in vulnerability analysis. Always respond with valid JSON only.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3,
                max_tokens: 2000,
            });

            const content = response.choices[0].message.content || '{"vulnerabilities": []}';
            return JSON.parse(content);
        } catch (error) {
            console.error('OpenAI API error:', error);
            return { vulnerabilities: [] };
        }
    }

    /**
     * Generate exploit chain for a vulnerability
     */
    async generateExploitChain(vulnerability: {
        type: string;
        target: string;
        endpoint: string;
        evidence: string;
    }): Promise<{
        exploitChain: string[];
        poc: string;
        impact: string;
    }> {
        const prompt = `Generate a theoretical exploit chain for the following vulnerability:

Type: ${vulnerability.type}
Target: ${vulnerability.target}
Endpoint: ${vulnerability.endpoint}
Evidence: ${vulnerability.evidence}

Provide:
1. Step-by-step exploit chain
2. Proof-of-concept (safe, theoretical only)
3. Potential impact

Output ONLY valid JSON:
{
  "exploitChain": ["Step 1...", "Step 2..."],
  "poc": "Theoretical PoC code...",
  "impact": "Description of potential impact..."
}`;

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a penetration testing expert. Generate theoretical exploits for educational purposes only. Always respond with valid JSON.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.4,
                max_tokens: 1500,
            });

            const content = response.choices[0].message.content || '{"exploitChain": [], "poc": "", "impact": ""}';
            return JSON.parse(content);
        } catch (error) {
            console.error('OpenAI API error:', error);
            return {
                exploitChain: [],
                poc: 'Error generating PoC',
                impact: 'Unknown',
            };
        }
    }

    /**
     * Generate remediation recommendations
     */
    async generateRemediation(vulnerability: {
        type: string;
        language: string;
        vulnerableCode?: string;
    }): Promise<{
        fix: string;
        explanation: string;
        codeExample?: string;
        priority: 'immediate' | 'high' | 'medium' | 'low';
    }> {
        const prompt = `Generate a secure code fix for the following vulnerability:

Vulnerability Type: ${vulnerability.type}
Language: ${vulnerability.language}
${vulnerability.vulnerableCode ? `Vulnerable Code:\n${vulnerability.vulnerableCode}` : ''}

Provide:
1. Secure code fix
2. Explanation of the fix
3. Code example (if applicable)
4. Priority level

Output ONLY valid JSON:
{
  "fix": "Description of fix...",
  "explanation": "Why this fix works...",
  "codeExample": "Secure code...",
  "priority": "immediate"
}`;

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a security engineer specializing in secure coding. Always respond with valid JSON.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.2,
                max_tokens: 1500,
            });

            const content = response.choices[0].message.content || '{"fix": "", "explanation": "", "priority": "medium"}';
            return JSON.parse(content);
        } catch (error) {
            console.error('OpenAI API error:', error);
            return {
                fix: 'Error generating fix',
                explanation: 'Unable to generate remediation',
                priority: 'medium',
            };
        }
    }

    /**
     * Analyze business logic for potential abuse
     */
    async analyzeBusinessLogic(workflow: {
        description: string;
        steps: string[];
        userRoles: string[];
    }): Promise<{
        vulnerabilities: Array<{
            type: string;
            scenario: string;
            impact: string;
            likelihood: 'high' | 'medium' | 'low';
        }>;
    }> {
        const prompt = `Analyze the following business logic workflow for potential abuse scenarios:

Description: ${workflow.description}
Steps:
${workflow.steps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}
User Roles: ${workflow.userRoles.join(', ')}

Identify:
1. Potential abuse scenarios (race conditions, logic bypasses, etc.)
2. Impact of each scenario
3. Likelihood of exploitation

Output ONLY valid JSON:
{
  "vulnerabilities": [
    {
      "type": "Race Condition",
      "scenario": "Description...",
      "impact": "What could happen...",
      "likelihood": "high"
    }
  ]
}`;

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a business logic security expert. Always respond with valid JSON.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.4,
                max_tokens: 2000,
            });

            const content = response.choices[0].message.content || '{"vulnerabilities": []}';
            return JSON.parse(content);
        } catch (error) {
            console.error('OpenAI API error:', error);
            return { vulnerabilities: [] };
        }
    }

    /**
     * Predict future threats
     */
    async predictFutureThreats(context: {
        currentThreatLandscape: string[];
        targetTechnology: string;
    }): Promise<{
        threats: Array<{
            name: string;
            description: string;
            timeframe: string;
            preparedness: string;
        }>;
    }> {
        const prompt = `Based on the current threat landscape, predict emerging threats for this technology:

Current Threats:
${context.currentThreatLandscape.map((threat, idx) => `${idx + 1}. ${threat}`).join('\n')}

Target Technology: ${context.targetTechnology}

Predict:
1. Emerging threat vectors (AI-driven attacks, quantum risks, etc.)
2. Timeline for each threat
3. How to prepare

Output ONLY valid JSON:
{
  "threats": [
    {
      "name": "AI-Powered Social Engineering",
      "description": "...",
      "timeframe": "6-12 months",
      "preparedness": "Recommendations..."
    }
  ]
}`;

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a cybersecurity futurist. Always respond with valid JSON.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.6,
                max_tokens: 2000,
            });

            const content = response.choices[0].message.content || '{"threats": []}';
            return JSON.parse(content);
        } catch (error) {
            console.error('OpenAI API error:', error);
            return { threats: [] };
        }
    }
}

export default new OpenAIService();
