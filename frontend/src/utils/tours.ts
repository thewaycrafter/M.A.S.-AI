import Joyride, { Step } from 'react-joyride';

// Tour steps for Free users
export const freeTour: Step[] = [
    {
        target: 'body',
        content: 'Welcome to Singhal AI! Let me show you how to get started with security testing.',
        placement: 'center',
    },
    {
        target: '[data-tour="start-scan"]',
        content: 'Click here to start a new security scan. As a Free user, you get 3 scans per month.',
    },
    {
        target: '[data-tour="target-input"]',
        content: 'Enter your target domain or URL here. We\'ll analyze it for vulnerabilities.',
    },
    {
        target: '[data-tour="console"]',
        content: 'Watch real-time AI agent activity here as they scan your target.',
    },
    {
        target: '[data-tour="results"]',
        content: 'Your scan results will appear here, showing vulnerabilities and risk scores.',
    },
];

// Tour steps for Pro users
export const proTour: Step[] = [
    {
        target: 'body',
        content: 'Welcome to Singhal AI Pro! You now have unlimited access to all features.',
        placement: 'center',
    },
    {
        target: '[data-tour="start-scan"]',
        content: 'Start unlimited scans with no restrictions.',
    },
    {
        target: '[data-tour="advanced-viz"]',
        content: 'Access advanced visualizations like attack surface maps and AI reasoning insights.',
    },
    {
        target: '[data-tour="export"]',
        content: 'Export results in PDF or JSON format for your team.',
    },
    {
        target: '[data-tour="history"]',
        content: 'View your complete scan history for the past 12 months.',
    },
];

// Tour steps for Admin users
export const adminTour: Step[] = [
    {
        target: 'body',
        content: 'Welcome, Admin! You have complete control over the Singhal AI platform.',
        placement: 'center',
    },
    {
        target: '[data-tour="admin-menu"]',
        content: 'Access administrative functions like authorization management and audit logs here.',
    },
    {
        target: '[data-tour="authorization"]',
        content: 'Manage authorized targets and implement security policies.',
    },
    {
        target: '[data-tour="audit-logs"]',
        content: 'Review all system activities with cryptographically signed audit logs.',
    },
    {
        target: '[data-tour="kill-switch"]',
        content: 'Emergency kill switch to halt all scanning operations instantly.',
    },
];

export const tourStyles = {
    options: {
        primaryColor: '#00ff41',
        textColor: '#fff',
        backgroundColor: '#0a0e14',
        overlayColor: 'rgba(0, 0, 0, 0.8)',
        arrowColor: '#00ff41',
        zIndex: 10000,
    },
    tooltip: {
        fontFamily: '"Courier New", monospace',
        fontSize: 14,
    },
};
