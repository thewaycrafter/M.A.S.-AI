/**
 * Email Templates for M.A.S. AI
 * Professional, readable email templates with light backgrounds for maximum compatibility
 */

interface TemplateData {
    [key: string]: string | number | undefined;
}

// Common email styles - using light background for maximum email client compatibility
const getEmailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>M.A.S. AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
                            <table role="presentation" style="width: 100%;">
                                <tr>
                                    <td>
                                        <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #00ff41; font-family: 'Courier New', monospace; letter-spacing: 2px;">M.A.S. AI</h1>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #00e5a0; letter-spacing: 1px;">Multi-Agent Adaptive Security Platform</p>
                                    </td>
                                    <td align="right">
                                        <div style="width: 50px; height: 50px; background: rgba(0, 255, 65, 0.2); border-radius: 50%; display: inline-block; line-height: 50px; text-align: center; font-size: 24px;">🛡️</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Content -->
                    ${content}
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                            <table role="presentation" style="width: 100%;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;">
                                            This is an automated message from M.A.S. AI Security Platform.
                                        </p>
                                        <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;">
                                            If you have any questions, please contact our support team.
                                        </p>
                                        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                                            © ${new Date().getFullYear()} M.A.S. AI. All rights reserved.
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
<a href="${url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00ff41 0%, #00d936 100%); color: #000000; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 14px rgba(0, 255, 65, 0.4);">${text}</a>
`;

const infoBox = (content: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const colors = {
        info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
        warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
        success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' }
    };
    const c = colors[type];
    return `
    <div style="background-color: ${c.bg}; border-left: 4px solid ${c.border}; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
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
                <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1e293b; font-weight: 600;">
                    🎉 Welcome to M.A.S. AI, ${username}!
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                    Thank you for joining M.A.S. AI - the Multi-Agent Adaptive Security platform. We're excited to have you on board!
                </p>
                
                ${infoBox('Your account has been successfully created. You can now access all the features of our security platform.', 'success')}
                
                <h3 style="margin: 30px 0 15px 0; font-size: 18px; color: #1e293b; font-weight: 600;">
                    🚀 What you can do with M.A.S. AI:
                </h3>
                <table role="presentation" style="width: 100%;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                            <strong style="color: #1e293b;">🔍 Vulnerability Scanning</strong>
                            <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">AI-powered security assessments across 19+ vulnerability categories</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                            <strong style="color: #1e293b;">🤖 Multi-Agent Analysis</strong>
                            <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">7 specialized AI agents working together to find threats</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                            <strong style="color: #1e293b;">📊 Detailed Reports</strong>
                            <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">Comprehensive PDF reports with remediation guidance</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0;">
                            <strong style="color: #1e293b;">⚡ Real-time Monitoring</strong>
                            <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">WebSocket-powered live scan updates</p>
                        </td>
                    </tr>
                </table>
                
                <div style="text-align: center; margin: 35px 0;">
                    ${primaryButton('Go to Dashboard', '${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard')}
                </div>
                
                <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.7;">
                    If you have any questions, our support team is always here to help.
                </p>
            </td>
        </tr>
    `),

    // Email Verification
    verification: (username: string, verifyUrl: string) => getEmailWrapper(`
        <tr>
            <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1e293b; font-weight: 600;">
                    📧 Verify Your Email Address
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                    Hello <strong>${username}</strong>,
                </p>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                    Thank you for signing up for M.A.S. AI! To complete your registration and access all features of our security platform, please verify your email address.
                </p>
                
                <div style="text-align: center; margin: 35px 0; padding: 30px; background-color: #f8fafc; border-radius: 12px;">
                    ${primaryButton('✅ Verify Email Address', verifyUrl)}
                    <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b;">
                        Button not working? Copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #3b82f6; word-break: break-all;">
                        ${verifyUrl}
                    </p>
                </div>
                
                ${infoBox('⏰ <strong>Important:</strong> This verification link will expire in <strong>24 hours</strong>. After that, you\'ll need to request a new verification email.', 'warning')}
                
                <h3 style="margin: 30px 0 15px 0; font-size: 16px; color: #1e293b; font-weight: 600;">
                    Why verify your email?
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
                    <li>Access all security scanning features</li>
                    <li>Receive important security alerts</li>
                    <li>Get scan completion notifications</li>
                    <li>Recover your account if needed</li>
                </ul>
                
                <p style="margin: 25px 0 0 0; font-size: 14px; color: #94a3b8;">
                    If you did not create an account with M.A.S. AI, please ignore this email or <a href="mailto:support@masai.com" style="color: #3b82f6;">contact our support team</a>.
                </p>
            </td>
        </tr>
    `),

    // Password Reset
    passwordReset: (username: string, resetUrl: string) => getEmailWrapper(`
        <tr>
            <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1e293b; font-weight: 600;">
                    🔐 Password Reset Request
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                    Hello <strong>${username}</strong>,
                </p>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                    We received a request to reset the password for your M.A.S. AI account. If you made this request, click the button below to create a new password.
                </p>
                
                <div style="text-align: center; margin: 35px 0; padding: 30px; background-color: #f8fafc; border-radius: 12px;">
                    ${primaryButton('🔑 Reset My Password', resetUrl)}
                    <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b;">
                        Button not working? Copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #3b82f6; word-break: break-all;">
                        ${resetUrl}
                    </p>
                </div>
                
                ${infoBox('⏰ <strong>Important:</strong> This password reset link will expire in <strong>1 hour</strong> for security reasons. After that, you\'ll need to request a new reset link.', 'warning')}
                
                <h3 style="margin: 30px 0 15px 0; font-size: 16px; color: #1e293b; font-weight: 600;">
                    🛡️ Security Tips
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
                    <li>Choose a strong password with at least 8 characters</li>
                    <li>Include uppercase, lowercase, numbers, and symbols</li>
                    <li>Don't reuse passwords from other accounts</li>
                    <li>Consider using a password manager</li>
                </ul>
                
                ${infoBox('🚨 <strong>Didn\'t request this?</strong> If you did not request a password reset, someone may be trying to access your account. Please ignore this email and your password will remain unchanged. For additional security, you may want to <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/login" style="color: #1e40af;">log in</a> and change your password.', 'info')}
            </td>
        </tr>
    `),

    // Scan Complete
    scanComplete: (username: string, target: string, findings: { critical: number; high: number; medium: number; low: number; total: number }, scanId: string) => getEmailWrapper(`
        <tr>
            <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1e293b; font-weight: 600;">
                    🔍 Security Scan Complete
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                    Hello <strong>${username}</strong>,
                </p>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                    Your security assessment for <strong style="color: #1e293b;">${target}</strong> has been completed successfully.
                </p>
                
                <!-- Findings Summary -->
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b; font-weight: 600;">
                        📊 Findings Summary
                    </h3>
                    <table role="presentation" style="width: 100%;">
                        <tr>
                            <td style="padding: 12px; background-color: #fef2f2; border-radius: 8px; text-align: center; width: 23%;">
                                <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${findings.critical}</div>
                                <div style="font-size: 11px; color: #7f1d1d; text-transform: uppercase; letter-spacing: 1px;">Critical</div>
                            </td>
                            <td style="width: 2%;"></td>
                            <td style="padding: 12px; background-color: #fff7ed; border-radius: 8px; text-align: center; width: 23%;">
                                <div style="font-size: 28px; font-weight: bold; color: #ea580c;">${findings.high}</div>
                                <div style="font-size: 11px; color: #7c2d12; text-transform: uppercase; letter-spacing: 1px;">High</div>
                            </td>
                            <td style="width: 2%;"></td>
                            <td style="padding: 12px; background-color: #fefce8; border-radius: 8px; text-align: center; width: 23%;">
                                <div style="font-size: 28px; font-weight: bold; color: #ca8a04;">${findings.medium}</div>
                                <div style="font-size: 11px; color: #713f12; text-transform: uppercase; letter-spacing: 1px;">Medium</div>
                            </td>
                            <td style="width: 2%;"></td>
                            <td style="padding: 12px; background-color: #f0fdf4; border-radius: 8px; text-align: center; width: 23%;">
                                <div style="font-size: 28px; font-weight: bold; color: #16a34a;">${findings.low}</div>
                                <div style="font-size: 11px; color: #14532d; text-transform: uppercase; letter-spacing: 1px;">Low</div>
                            </td>
                        </tr>
                    </table>
                    <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <span style="font-size: 14px; color: #64748b;">Total Findings: </span>
                        <span style="font-size: 20px; font-weight: bold; color: #1e293b;">${findings.total}</span>
                    </div>
                </div>
                
                ${findings.critical > 0 || findings.high > 0
            ? infoBox('⚠️ <strong>Action Required:</strong> Critical or high severity vulnerabilities were detected. We recommend addressing these issues as soon as possible to protect your application.', 'warning')
            : infoBox('✅ <strong>Good News:</strong> No critical or high severity vulnerabilities were detected in this scan.', 'success')
        }
                
                <div style="text-align: center; margin: 35px 0;">
                    ${primaryButton('📄 View Full Report', '${process.env.FRONTEND_URL || "http://localhost:3000"}/history')}
                </div>
                
                <p style="margin: 25px 0 0 0; font-size: 14px; color: #64748b; line-height: 1.7;">
                    <strong>Scan ID:</strong> ${scanId}<br>
                    <strong>Target:</strong> ${target}
                </p>
            </td>
        </tr>
    `),

    // Authorization Request
    authorizationRequest: (requesterName: string, requesterEmail: string, targetDomain: string, approvalUrl: string) => getEmailWrapper(`
        <tr>
            <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1e293b; font-weight: 600;">
                    🔒 Security Testing Authorization Request
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                    Hello Domain Administrator,
                </p>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                    A user has requested authorization to perform security testing on your domain using M.A.S. AI - an AI-powered penetration testing platform.
                </p>
                
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1e293b; font-weight: 600;">
                        📋 Request Details
                    </h3>
                    <table role="presentation" style="width: 100%;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #64748b; font-size: 14px;">Requester Name:</span>
                                <span style="color: #1e293b; font-weight: 600; font-size: 14px; float: right;">${requesterName}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #64748b; font-size: 14px;">Requester Email:</span>
                                <span style="color: #1e293b; font-weight: 600; font-size: 14px; float: right;">${requesterEmail}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">
                                <span style="color: #64748b; font-size: 14px;">Target Domain:</span>
                                <span style="color: #3b82f6; font-weight: 600; font-size: 14px; float: right;">${targetDomain}</span>
                            </td>
                        </tr>
                    </table>
                </div>
                
                ${infoBox('⚠️ <strong>What is M.A.S. AI?</strong> M.A.S. AI is an AI-powered security testing platform that uses multiple specialized agents to identify vulnerabilities in web applications. All testing is non-destructive and follows industry best practices.', 'info')}
                
                <h3 style="margin: 30px 0 15px 0; font-size: 16px; color: #1e293b; font-weight: 600;">
                    🔍 What will be tested?
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
                    <li>Authentication and session management</li>
                    <li>Input validation and injection flaws</li>
                    <li>Security misconfigurations</li>
                    <li>Cross-site scripting (XSS) vulnerabilities</li>
                    <li>Cryptographic weaknesses</li>
                    <li>And 15+ additional security categories</li>
                </ul>
                
                <div style="text-align: center; margin: 35px 0;">
                    ${primaryButton('Review & Authorize', approvalUrl)}
                </div>
                
                <p style="margin: 25px 0 0 0; font-size: 14px; color: #94a3b8;">
                    If you did not expect this request or do not wish to authorize security testing, you can simply ignore this email. No testing will be performed without your explicit approval.
                </p>
            </td>
        </tr>
    `),

    // Account Not Found (for password reset)
    accountNotFound: (email: string) => getEmailWrapper(`
        <tr>
            <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1e293b; font-weight: 600;">
                    ❓ Password Reset Request
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                    Hello,
                </p>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                    We received a password reset request for the email address <strong>${email}</strong>.
                </p>
                
                ${infoBox('⚠️ <strong>No Account Found:</strong> We couldn\'t find a M.A.S. AI account associated with this email address. If you believe you have an account, you may have registered with a different email.', 'warning')}
                
                <h3 style="margin: 30px 0 15px 0; font-size: 16px; color: #1e293b; font-weight: 600;">
                    What would you like to do?
                </h3>
                
                <div style="text-align: center; margin: 35px 0;">
                    ${primaryButton('Create New Account', '${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/signup')}
                </div>
                
                <p style="margin: 25px 0 0 0; font-size: 14px; color: #94a3b8;">
                    If you didn't request a password reset, you can safely ignore this email.
                </p>
            </td>
        </tr>
    `)
};

export default emailTemplates;
