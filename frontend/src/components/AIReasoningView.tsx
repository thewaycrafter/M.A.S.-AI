'use client';

import { useState } from 'react';
import styles from './AIReasoningView.module.css';

interface ReasoningStep {
    step: number;
    action: string;
    finding: string;
    confidence: number;
    evidence: string[];
}

interface AIReasoningViewProps {
    vulnerability: {
        title: string;
        category: string;
        severity: string;
        reasoning?: ReasoningStep[];
    };
}

export default function AIReasoningView({ vulnerability }: AIReasoningViewProps) {
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));

    const toggleStep = (step: number) => {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(step)) {
            newExpanded.delete(step);
        } else {
            newExpanded.add(step);
        }
        setExpandedSteps(newExpanded);
    };

    // Mock reasoning if not provided
    const reasoning: ReasoningStep[] = vulnerability.reasoning || [
        {
            step: 1,
            action: 'Initial Reconnaissance',
            finding: 'Analyzed endpoint structure and identified potential input vectors',
            confidence: 95,
            evidence: ['User-controlled input detected', 'No visible sanitization', 'Direct database query construction'],
        },
        {
            step: 2,
            action: 'Pattern Recognition',
            finding: 'Matched against known SQL injection patterns from knowledge base',
            confidence: 92,
            evidence: ['String concatenation in query', 'Missing parameterization', 'Error messages leak SQL syntax'],
        },
        {
            step: 3,
            action: 'Exploit Reasoning',
            finding: 'Confirmed exploitability through theoretical proof-of-concept',
            confidence: 88,
            evidence: ['Payload: \' OR 1=1--', 'Expected behavior: authentication bypass', 'Risk: Data exfiltration possible'],
        },
        {
            step: 4,
            action: 'Impact Assessment',
            finding: `Classified as ${vulnerability.severity} based on CVSS v3.1 scoring`,
            confidence: 98,
            evidence: ['Attack Vector: Network (AV:N)', 'Attack Complexity: Low (AC:L)', 'Privileges Required: None (PR:N)', 'User Interaction: None (UI:N)'],
        },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>🤖 AI Reasoning Chain</h2>
                <p className={styles.subtitle}>How AI identified this vulnerability</p>
            </div>

            <div className={styles.vulnInfo}>
                <h3>{vulnerability.title}</h3>
                <div className={styles.tags}>
                    <span className={styles.tag}>{vulnerability.category}</span>
                    <span className={`${styles.tag} ${styles.severity}`} data-severity={vulnerability.severity.toLowerCase()}>
                        {vulnerability.severity}
                    </span>
                </div>
            </div>

            <div className={styles.timeline}>
                {reasoning.map((step, index) => (
                    <div key={index} className={styles.step}>
                        <div className={styles.stepHeader} onClick={() => toggleStep(index)}>
                            <div className={styles.stepNumber}>{step.step}</div>
                            <div className={styles.stepInfo}>
                                <h4>{step.action}</h4>
                                <div className={styles.confidence}>
                                    <div className={styles.confidenceBar}>
                                        <div className={styles.confidenceValue} style={{ width: `${step.confidence}%` }}></div>
                                    </div>
                                    <span>{step.confidence}% confident</span>
                                </div>
                            </div>
                            <div className={styles.expandIcon}>{expandedSteps.has(index) ? '▼' : '▶'}</div>
                        </div>

                        {expandedSteps.has(index) && (
                            <div className={styles.stepContent}>
                                <p className={styles.finding}>{step.finding}</p>
                                <div className={styles.evidence}>
                                    <h5>Evidence:</h5>
                                    <ul>
                                        {step.evidence.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {index < reasoning.length - 1 && <div className={styles.connector}></div>}
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <p>💡 This reasoning chain shows the AI's step-by-step analysis process</p>
            </div>
        </div>
    );
}
