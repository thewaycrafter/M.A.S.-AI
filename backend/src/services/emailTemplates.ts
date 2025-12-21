/**
 * Email Templates for M.A.S. AI
 * Professional, dark-themed cyberpunk aesthetic
 */

interface TemplateData {
    [key: string]: string | number | undefined;
}

// Common email styles - Dark Mode Cyberpunk Theme
const getEmailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>M.A.S. AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050505; color: #e2e8f0;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #0a0e14; border: 1px solid #1f2937; box-shadow: 0 0 20px rgba(0, 255, 65, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 40px; border-bottom: 1px solid #1f2937;">
                            <table role="presentation" style="width: 100%;">
                                <tr>
                                    <td>
                                        <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #00ff41; font-family: 'Courier New', monospace; letter-spacing: 2px; text-shadow: 0 0 10px rgba(0, 255, 65, 0.3);">M.A.S. AI</h1>
                                        <p style="margin: 5px 0 0 0; font-size: 11px; color: #00e5a0; letter-spacing: 1px; text-transform: uppercase;">Defensive-First AI Penetration Testing</p>
                                    </td>
                                    <td align="right">
                                        <div style="font-size: 24px;">🛡️</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Content -->
                    ${content}
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #080a0f; border-top: 1px solid #1f2937;">
                            <table role="presentation" style="width: 100%;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; font-family: 'Courier New', monospace;">
                                            > SYSTEM_MESSAGE: Automated Transmission
                                        </p>
                                        <p style="margin: 0 0 10px 0; font-size: 11px; color: #475569;">
                                            This message was sent from the M.A.S. AI Security Platform. Do not reply to this email directly.
                                        </p>
                                        <p style="margin: 0; font-size: 11px; color: #475569;">
                                            © ${new Date().getFullYear()} M.A.S. AI // SECURE_TRANSMISSION
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

const primaryButton = (text: string, url: string) => `
<a href="${url}" style="display: inline-block; padding: 14px 32px; background-color: #00ff41; color: #000000; text-decoration: none; font-weight: bold; font-family: 'Courier New', monospace; font-size: 14px; border: 1px solid #00ff41; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 0 15px rgba(0, 255, 65, 0.3);">
    ${text}
</a>
`;

const infoBox = (content: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const colors = {
        info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#93c5fd' },
        warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#fcd34d' },
        success: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#86efac' }
    };
    const c = colors[type];
    return `
    <div style="background-color: ${c.bg}; border-left: 3px solid ${c.border}; padding: 16px 20px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: ${c.text}; line-height: 1.6;">
            ${content}
        </p>
    </div>
    `;
};

// =====================
// Email Templates
// =====================

export const emailTemplates = {
    // Welcome Email
    welcome: (username: string) => getEmailWrapper(`
        <tr>
            <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #ffffff; font-weight: 600; font-family: 'Courier New', monospace;">
                    > INITIATING_SESSION: ${username}
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #cbd5e1; line-height: 1.7;">
                    Welcome to the M.A.S. AI network. Your account has been successfully provisioned. You now have access to our advanced multi-agent security grid.
                </p>
                
                ${infoBox('ACCESS_LEVEL: GRANTED. System ready for vulnerability assessment operations.', 'success')}
                
                <h3 style="margin: 30px 0 15px 0; font-size: 14px; color: #00ff41; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                    // AVAILABLE_MODULES
                </h3>
                <div style="background: #111827; border: 1px solid #1f2937; padding: 20px;">
                    <table role="presentation" style="width: 100%;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #1f2937;">
                                <strong style="color: #e2e8f0; font-family: 'Courier New', monospace;">[01] Vulnerability Scanning</strong>
                                <p style="margin: 2px 0 0 0; font-size: 13px; color: #94a3b8;">Full spectrum analysis across 19+ categories</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #1f2937;">
                                <strong style="color: #e2e8f0; font-family: 'Courier New', monospace;">[02] Multi-Agent swarm</strong>
                                <p style="margin: 2px 0 0 0; font-size: 13px; color: #94a3b8;">7 autonomous AI agents working in concert</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">
                                <strong style="color: #e2e8f0; font-family: 'Courier New', monospace;">[03] Real-time Telemetry</strong>
                                <p style="margin: 2px 0 0 0; font-size: 13px; color: #94a3b8;">Live websocket data feeds from scanning nodes</p>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                    ${primaryButton('ENTER DASHBOARD', '${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard')}
                </div>
            </td>
        </tr>
    `),

    // Email Verification
    verification: (username: string, verifyUrl: string) => getEmailWrapper(`
        <tr>
            <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #ffffff; font-weight: 600; font-family: 'Courier New', monospace;">
                    > VERIFY_IDENTITY
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #cbd5e1; line-height: 1.7;">
                    User <strong>${username}</strong>, identity verification is required to complete system access authorization.
                </p>
                
                <div style="text-align: center; margin: 35px 0;">
                    ${primaryButton('VERIFY EMAIL', verifyUrl)}
                </div>
                
                ${infoBox('TTL_WARNING: This verification token expires in 24 hours.', 'warning')}
                
                <p style="margin: 25px 0 0 0; font-size: 12px; color: #64748b; font-family: 'Courier New', monospace;">
                    LINK_TARGET: <span style="color: #3b82f6;">${verifyUrl}</span>
                </p>
            </td>
        </tr>
    `),

    // Password Reset
    passwordReset: (username: string, resetUrl: string) => getEmailWrapper(`
        <tr>
            <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #ff3333; font-weight: 600; font-family: 'Courier New', monospace;">
                    > PASSWORD_RESET_REQUEST
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #cbd5e1; line-height: 1.7;">
                    A request to reset credentials for user <strong>${username}</strong> has been logged.
                </p>
                
                <div style="text-align: center; margin: 35px 0;">
                    ${primaryButton('RESET PASSWORD', resetUrl)}
                </div>
                
                ${infoBox('SECURITY_NOTICE: If you did not initiate this request, assume your account identifier is known. No changes have been made.', 'warning')}
                
                <p style="margin: 25px 0 0 0; font-size: 12px; color: #64748b; font-family: 'Courier New', monospace;">
                    LINK_TARGET: <span style="color: #3b82f6;">${resetUrl}</span>
                </p>
            </td>
        </tr>
    `),

    // Scan Complete
    scanComplete: (username: string, target: string, findings: { critical: number; high: number; medium: number; low: number; total: number }, scanId: string) => getEmailWrapper(`
        <tr>
            <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #ffffff; font-weight: 600; font-family: 'Courier New', monospace;">
                    > SCAN_COMPLETE: ${target}
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #cbd5e1; line-height: 1.7;">
                    Automated security assessment has concluded. Results are available for review.
                </p>
                
                <!-- Findings Matrix -->
                <div style="background-color: #111827; border: 1px solid #1f2937; padding: 25px; margin: 25px 0;">
                    <h3 style="margin: 0 0 20px 0; font-size: 14px; color: #e2e8f0; font-weight: 600; font-family: 'Courier New', monospace; text-transform: uppercase;">
                        // VULNERABILITY_MATRIX
                    </h3>
                    <table role="presentation" style="width: 100%;">
                        <tr>
                            <td style="padding: 15px; background-color: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.3); text-align: center; width: 23%;">
                                <div style="font-size: 24px; font-weight: bold; color: #ef4444; font-family: 'Courier New', monospace;">${findings.critical}</div>
                                <div style="font-size: 10px; color: #fca5a5; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Critical</div>
                            </td>
                            <td style="width: 2%;"></td>
                            <td style="padding: 15px; background-color: rgba(234, 88, 12, 0.1); border: 1px solid rgba(234, 88, 12, 0.3); text-align: center; width: 23%;">
                                <div style="font-size: 24px; font-weight: bold; color: #f97316; font-family: 'Courier New', monospace;">${findings.high}</div>
                                <div style="font-size: 10px; color: #fdba74; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">High</div>
                            </td>
                            <td style="width: 2%;"></td>
                            <td style="padding: 15px; background-color: rgba(202, 138, 4, 0.1); border: 1px solid rgba(202, 138, 4, 0.3); text-align: center; width: 23%;">
                                <div style="font-size: 24px; font-weight: bold; color: #eab308; font-family: 'Courier New', monospace;">${findings.medium}</div>
                                <div style="font-size: 10px; color: #fde047; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Medium</div>
                            </td>
                            <td style="width: 2%;"></td>
                            <td style="padding: 15px; background-color: rgba(22, 163, 74, 0.1); border: 1px solid rgba(22, 163, 74, 0.3); text-align: center; width: 23%;">
                                <div style="font-size: 24px; font-weight: bold; color: #22c55e; font-family: 'Courier New', monospace;">${findings.low}</div>
                                <div style="font-size: 10px; color: #86efac; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Low</div>
                            </td>
                        </tr>
                    </table>
                    <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #1f2937;">
                        <span style="font-size: 12px; color: #64748b; font-family: 'Courier New', monospace;">TOTAL_THREATS_DETECTED: </span>
                        <span style="font-size: 16px; font-weight: bold; color: #e2e8f0; font-family: 'Courier New', monospace;">${findings.total}</span>
                    </div>
                </div>
                
                ${findings.critical > 0 || findings.high > 0
            ? infoBox('CRITICAL_ALERT: High severity threats detected. Immediate remediation recommended.', 'warning')
            : infoBox('STATUS_NORMAL: No high priority threats detected.', 'success')
        }
                
                <div style="text-align: center; margin: 35px 0;">
                    ${primaryButton('VIEW FULL REPORT', '${process.env.FRONTEND_URL || "http://localhost:3000"}/history')}
                </div>
                
                <p style="margin: 25px 0 0 0; font-size: 12px; color: #64748b; font-family: 'Courier New', monospace;">
                    SCAN_ID: ${scanId}
                </p>
            </td>
        </tr>
    `),

    // Authorization Request
    authorizationRequest: (requesterName: string, requesterEmail: string, targetDomain: string, approvalUrl: string) => getEmailWrapper(`
        <tr>
            <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #ffffff; font-weight: 600; font-family: 'Courier New', monospace;">
                     > AUTH_REQUEST: PENTEST
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #cbd5e1; line-height: 1.7;">
                    Authorization requested for security assessment operations on domain: <strong style="color: #00ff41;">${targetDomain}</strong>
                </p>
                
                <p style="font-size: 13px; color: #94a3b8; font-style: italic; margin-bottom: 25px;">
                    Protocol M.A.S. AI: Automated Multi-Agent Penetration Test
                </p>

                <div style="background-color: #111827; border: 1px solid #1f2937; padding: 25px; margin: 25px 0;">
                    <table role="presentation" style="width: 100%;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #1f2937;">
                                <span style="color: #64748b; font-size: 12px; font-family: 'Courier New', monospace;">REQUESTER_ID:</span>
                                <span style="color: #e2e8f0; font-size: 14px; float: right;">${requesterName}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #1f2937;">
                                <span style="color: #64748b; font-size: 12px; font-family: 'Courier New', monospace;">CONTACT_CHANNEL:</span>
                                <span style="color: #e2e8f0; font-size: 14px; float: right;">${requesterEmail}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">
                                <span style="color: #64748b; font-size: 12px; font-family: 'Courier New', monospace;">TARGET_ASSET:</span>
                                <span style="color: #00ff41; font-weight: 600; font-size: 14px; float: right;">${targetDomain}</span>
                            </td>
                        </tr>
                    </table>
                </div>
                
                ${infoBox('SCOPE_NOTICE: Testing includes non-destructive analysis via 7 autonomous agents. 19 vulnerability categories covered.', 'info')}
                
                <div style="text-align: center; margin: 35px 0;">
                    ${primaryButton('AUTHORIZE SCAN', approvalUrl)}
                </div>
            </td>
        </tr>
    `),

    // Account Not Found (for password reset)
    accountNotFound: (email: string) => getEmailWrapper(`
        <tr>
            <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #ff3333; font-weight: 600; font-family: 'Courier New', monospace;">
                    > ERROR: USER_UNKNOWN
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #cbd5e1; line-height: 1.7;">
                    A credential reset was requested for user identity <strong>${email}</strong>, but no matching record exists in the database.
                </p>
                
                ${infoBox('RECOMMENDATION: Verify email address or initialize new user account.', 'warning')}
                
                <div style="text-align: center; margin: 35px 0;">
                    ${primaryButton('INITIALIZE ACCOUNT', '${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/signup')}
                </div>
            </td>
        </tr>
    `)
};

export default emailTemplates;
