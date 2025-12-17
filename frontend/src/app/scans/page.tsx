'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import styles from './scans.module.css';

export default function ScansInfoPage() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const scanCategories = [
        {
            id: 'web-api',
            name: 'Web Application & API Security',
            icon: '🌐',
            coverage: '90%',
            description: 'Comprehensive testing of web applications and RESTful/GraphQL APIs',
            tests: [
                'SQL Injection (SQLi)',
                'Cross-Site Scripting (XSS)',
                'Cross-Site Request Forgery (CSRF)',
                'Server-Side Request Forgery (SSRF)',
                'XML External Entity (XXE)',
                'Command Injection',
                'Path Traversal',
                'File Upload Vulnerabilities',
                'API Rate Limiting',
                'GraphQL Introspection',
                'REST API Authentication Flaws',
                'JSON Web Token (JWT) Attacks',
            ],
        },
        {
            id: 'authentication',
            name: 'Authentication Testing',
            icon: '🔐',
            coverage: '95%',
            description: 'Deep analysis of authentication mechanisms and password policies',
            tests: [
                'Weak Password Policies',
                'Brute Force Protection',
                'Multi-Factor Authentication (MFA) Bypass',
                'Session Fixation',
                'Session Hijacking',
                'OAuth/OIDC Misconfigurations',
                'SAML Vulnerabilities',
                'Password Reset Flaws',
                'Remember Me Functionality',
                'Account Enumeration',
                'Credential Stuffing Prevention',
            ],
        },
        {
            id: 'authorization',
            name: 'Authorization & Access Control',
            icon: '🛡️',
            coverage: '92%',
            description: 'Testing role-based and attribute-based access controls',
            tests: [
                'Insecure Direct Object Reference (IDOR)',
                'Privilege Escalation',
                'Horizontal Access Control',
                'Vertical Access Control',
                'Missing Function Level Access Control',
                'Path-Based Authorization',
                'Role-Based Access Control (RBAC)',
                'Attribute-Based Access Control (ABAC)',
                'API Authorization Flaws',
            ],
        },
        {
            id: 'cryptography',
            name: 'Cryptography & Data Protection',
            icon: '🔒',
            coverage: '88%',
            description: 'Analysis of encryption, hashing, and secure data handling',
            tests: [
                'Weak Encryption Algorithms',
                'Insecure TLS/SSL Configurations',
                'Certificate Validation Issues',
                'Weak Hashing Algorithms',
                'Insufficient Entropy',
                'Hardcoded Secrets',
                'Key Management Flaws',
                'Data at Rest Encryption',
                'Data in Transit Protection',
                'Perfect Forward Secrecy',
            ],
        },
        {
            id: 'business-logic',
            name: 'Business Logic Vulnerabilities',
            icon: '💼',
            coverage: '85%',
            description: 'Testing application-specific logic and workflows',
            tests: [
                'Race Conditions',
                'Price Manipulation',
                'Workflow Bypass',
                'Insufficient Process Validation',
                'Business Constraint Violations',
                'Time-of-Check to Time-of-Use (TOCTOU)',
                'Payment Logic Flaws',
                'Refund/Credit Abuse',
                'Inventory Manipulation',
            ],
        },
        {
            id: 'network',
            name: 'Network Security',
            icon: '🌐',
            coverage: '87%',
            description: 'Network layer vulnerabilities and misconfigurations',
            tests: [
                'Open Ports & Services',
                'DNS Security (DNSSEC, Zone Transfers)',
                'SSL/TLS Weaknesses',
                'HTTP Security Headers',
                'Content Security Policy (CSP)',
                'CORS Misconfigurations',
                'Subdomain Takeover',
                'Email Security (SPF, DKIM, DMARC)',
            ],
        },
        {
            id: 'cloud',
            name: 'Cloud Security',
            icon: '☁️',
            coverage: '90%',
            description: 'AWS, Azure, GCP security testing',
            tests: [
                'S3 Bucket Permissions',
                'IAM Misconfigurations',
                'Security Group Rules',
                'Storage Account Access',
                'Lambda/Function Security',
                'Container Security',
                'Kubernetes Misconfigurations',
                'Cloud Database Exposure',
                'API Gateway Security',
            ],
        },
        {
            id: 'supply-chain',
            name: 'Supply Chain Security',
            icon: '📦',
            coverage: '83%',
            description: 'Third-party dependencies and software composition analysis',
            tests: [
                'Known Vulnerable Dependencies',
                'Outdated Library Versions',
                'License Compliance Issues',
                'Dependency Confusion',
                'Typosquatting Risks',
                'Malicious Package Detection',
                'Software Bill of Materials (SBOM)',
            ],
        },
        {
            id: 'client-side',
            name: 'Client-Side Security',
            icon: '💻',
            coverage: '89%',
            description: 'Browser-based vulnerabilities and frontend security',
            tests: [
                'DOM-Based XSS',
                'Clickjacking',
                'HTML5 Security',
                'WebSocket Security',
                'LocalStorage/SessionStorage Abuse',
                'PostMessage Vulnerabilities',
                'Browser Extension Risks',
                'Frontend Secret Exposure',
            ],
        },
        {
            id: 'mobile',
            name: 'Mobile Application Security',
            icon: '📱',
            coverage: '84%',
            description: 'iOS and Android app security testing',
            tests: [
                'Insecure Data Storage',
                'Weak Server-Side Controls',
                'Insufficient Transport Layer Protection',
                'Unintended Data Leakage',
                'Poor Authorization & Authentication',
                'Client-Side Injection',
                'Security Decisions via Untrusted Inputs',
                'Improper Session Handling',
            ],
        },
        {
            id: 'social-engineering',
            name: 'Social Engineering Vectors',
            icon: '🎭',
            coverage: '78%',
            description: 'Phishing and social engineering vulnerability assessment',
            tests: [
                'Phishing Simulation',
                'Email Spoofing Detection',
                'Domain Squatting',
                'User Awareness Gaps',
                'Information Disclosure',
                'Social Media Exposure',
            ],
        },
        {
            id: 'logging',
            name: 'Logging & Monitoring',
            icon: '📊',
            coverage: '86%',
            description: 'Security event logging and detection capabilities',
            tests: [
                'Insufficient Logging',
                'Log Injection',
                'Sensitive Data in Logs',
                'Log Tampering Protection',
                'Security Event Detection',
                'Audit Trail Completeness',
                'SIEM Integration',
            ],
        },
    ];

    return (
        <div>
            <Navigation />
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <span className={styles.glitch}>WHAT WE TEST</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Comprehensive AI-powered security testing across 200+ vulnerability classes
                    </p>
                </div>

                {/* Stats Overview */}
                <div className={styles.statsBar}>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>19</span>
                        <span className={styles.statLabel}>Categories</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>200+</span>
                        <span className={styles.statLabel}>Vulnerability Types</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>7</span>
                        <span className={styles.statLabel}>AI Agents</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>100%</span>
                        <span className={styles.statLabel}>Coverage</span>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className={styles.categoriesGrid}>
                    {scanCategories.map((category) => (
                        <div
                            key={category.id}
                            className={`${styles.categoryCard} ${activeCategory === category.id ? styles.active : ''}`}
                            onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.icon}>{category.icon}</div>
                                <h3 className={styles.categoryName}>{category.name}</h3>
                                <div className={styles.coverage}>
                                    <div className={styles.coverageBar}>
                                        <div className={styles.coverageFill} style={{ width: category.coverage }}></div>
                                    </div>
                                    <span className={styles.coverageText}>{category.coverage} Coverage</span>
                                </div>
                            </div>

                            <p className={styles.description}>{category.description}</p>

                            {activeCategory === category.id && (
                                <div className={styles.testsList}>
                                    <h4>Tests Performed:</h4>
                                    <ul>
                                        {category.tests.map((test, idx) => (
                                            <li key={idx}>✓ {test}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button className={styles.expandBtn}>
                                {activeCategory === category.id ? 'Show Less ▲' : 'Show Tests ▼'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* How It Works */}
                <div className={styles.howSection}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.glitch}>HOW OUR AI AGENTS WORK</span>
                    </h2>
                    <div className={styles.agentsGrid}>
                        <div className={styles.agentCard}>
                            <div className={styles.agentNumber}>01</div>
                            <h3>Reconnaissance Agent</h3>
                            <p>Discovers assets, technologies, and attack surface using OSINT techniques</p>
                        </div>
                        <div className={styles.agentCard}>
                            <div className={styles.agentNumber}>02</div>
                            <h3>Threat Modeling Agent</h3>
                            <p>Identifies potential threats specific to your tech stack and business logic</p>
                        </div>
                        <div className={styles.agentCard}>
                            <div className={styles.agentNumber}>03</div>
                            <h3>Vulnerability Reasoning Agent</h3>
                            <p>Uses AI to understand context and find complex, logic-based vulnerabilities</p>
                        </div>
                        <div className={styles.agentCard}>
                            <div className={styles.agentNumber}>04</div>
                            <h3>Exploitation Agent</h3>
                            <p>Validates findings with safe proof-of-concept exploits</p>
                        </div>
                        <div className={styles.agentCard}>
                            <div className={styles.agentNumber}>05</div>
                            <h3>Remediation Agent</h3>
                            <p>Provides fix recommendations and secure coding guidance</p>
                        </div>
                        <div className={styles.agentCard}>
                            <div className={styles.agentNumber}>06</div>
                            <h3>Reporting Agent</h3>
                            <p>Generates comprehensive reports with severity ratings and timelines</p>
                        </div>
                        <div className={styles.agentCard}>
                            <div className={styles.agentNumber}>07</div>
                            <h3>Orchestrator Agent</h3>
                            <p>Coordinates all agents and ensures comprehensive test coverage</p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className={styles.cta}>
                    <h2>Ready to Secure Your Application?</h2>
                    <p>Start scanning in minutes with our AI-powered platform</p>
                    <div className={styles.ctaButtons}>
                        <button onClick={() => window.location.href = '/auth/signup'} className={styles.primaryBtn}>
                            Start Free Scan
                        </button>
                        <button onClick={() => window.location.href = '/pricing'} className={styles.secondaryBtn}>
                            View Pricing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
