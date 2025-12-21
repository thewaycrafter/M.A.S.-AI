import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD?.trim(),
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

// Professional email template wrapper
const createEmailTemplate = (title: string, content: string, ctaButton?: { text: string; url: string }) => {
    const buttonHtml = ctaButton ? `
        <div style="text-align: center; margin: 35px 0;">
            <a href="${ctaButton.url}" 
               style="background: linear-gradient(135deg, #00ff41 0%, #00e5a0 100%);
                      color: #000000;
                      padding: 16px 40px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: 700;
                      font-size: 14px;
                      letter-spacing: 0.5px;
                      display: inline-block;
                      text-transform: uppercase;
                      box-shadow: 0 4px 15px rgba(0, 255, 65, 0.3);">
                ${ctaButton.text}
            </a>
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0f;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e1e3f 0%, #2a2a4a 100%); padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid rgba(0, 255, 65, 0.2);">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 3px;">
                                <span style="color: #00ff41;">SINGHAL</span>
                                <span style="color: #ffffff;"> AI</span>
                            </h1>
                            <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                                Advanced Security Intelligence
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #00e5a0; font-size: 24px; font-weight: 600;">
                                ${title}
                            </h2>
                            <div style="color: #e5e7eb; font-size: 15px; line-height: 1.7;">
                                ${content}
                            </div>
                            ${buttonHtml}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #0d0d12; padding: 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 10px; color: #00ff41; font-weight: 600; font-size: 14px;">
                                            SINGHAL AI
                                        </p>
                                        <p style="margin: 0 0 15px; color: #6b7280; font-size: 12px;">
                                            AI-Powered Penetration Testing Platform
                                        </p>
                                        <p style="margin: 0; color: #4b5563; font-size: 11px;">
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
};

export const sendEmail = async ({ to, subject, html, text }: EmailOptions) => {
    try {
        if (!process.env.EMAIL_USER) {
            console.log('⚠️ EMAIL_USER not set. Skipping email sending.');
            console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
            return;
        }

        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'M.A.S. AI'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>?/gm, ''), // fallback strip tags
        });

        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw, just log. We don't want to break the app if email fails.
    }
};

export const sendWelcomeEmail = async (email: string, username: string) => {
    const content = `
        <p>Hello <strong style="color: #00ff41;">${username}</strong>,</p>
        <p>Welcome to M.A.S. AI – your advanced AI-powered security testing platform. We're excited to have you on board!</p>
        <div style="background: rgba(0, 255, 65, 0.1); border-left: 4px solid #00ff41; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #00e5a0; font-weight: 600;">🛡️ What you can do:</p>
            <ul style="margin: 10px 0 0; padding-left: 20px; color: #d1d5db;">
                <li>Run comprehensive security scans on authorized targets</li>
                <li>Get AI-powered vulnerability analysis</li>
                <li>Generate detailed PDF security reports</li>
                <li>Track your security posture over time</li>
            </ul>
        </div>
        <p>Ready to secure your applications? Log in to your dashboard and start your first scan.</p>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 30px;">
            If you have any questions, our support team is here to help.
        </p>
    `;

    const html = createEmailTemplate('Welcome to M.A.S. AI', content, {
        text: 'Access Dashboard',
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`
    });

    await sendEmail({
        to: email,
        subject: '🛡️ Welcome to M.A.S. AI - Your Security Journey Begins',
        html,
    });
};

export const sendScanCompletionEmail = async (email: string, username: string, scanData: any) => {
    const riskScore = scanData.riskScore || 0;
    let riskColor = '#10b981'; // Low (Green)
    let riskLabel = 'LOW';
    if (riskScore >= 9) { riskColor = '#f43f5e'; riskLabel = 'CRITICAL'; }
    else if (riskScore >= 7) { riskColor = '#f97316'; riskLabel = 'HIGH'; }
    else if (riskScore >= 4) { riskColor = '#f59e0b'; riskLabel = 'MEDIUM'; }

    const content = `
        <p>Hello <strong style="color: #00ff41;">${username}</strong>,</p>
        <p>Your security scan for <strong style="color: #ffffff;">${scanData.target}</strong> has been completed.</p>
        
        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Risk Score</p>
            <p style="margin: 0; font-size: 48px; font-weight: 700; color: ${riskColor};">${riskScore.toFixed(1)}</p>
            <p style="margin: 5px 0 0; color: ${riskColor}; font-weight: 600; font-size: 14px; letter-spacing: 1px;">${riskLabel} RISK</p>
        </div>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
            <tr>
                <td style="background: rgba(244, 63, 94, 0.2); padding: 15px; text-align: center; border-radius: 8px 0 0 8px;">
                    <p style="margin: 0; color: #f43f5e; font-size: 24px; font-weight: 700;">${scanData.critical || 0}</p>
                    <p style="margin: 5px 0 0; color: #f43f5e; font-size: 11px; text-transform: uppercase;">Critical</p>
                </td>
                <td style="background: rgba(249, 115, 22, 0.2); padding: 15px; text-align: center;">
                    <p style="margin: 0; color: #f97316; font-size: 24px; font-weight: 700;">${scanData.high || 0}</p>
                    <p style="margin: 5px 0 0; color: #f97316; font-size: 11px; text-transform: uppercase;">High</p>
                </td>
                <td style="background: rgba(245, 158, 11, 0.2); padding: 15px; text-align: center;">
                    <p style="margin: 0; color: #f59e0b; font-size: 24px; font-weight: 700;">${scanData.medium || 0}</p>
                    <p style="margin: 5px 0 0; color: #f59e0b; font-size: 11px; text-transform: uppercase;">Medium</p>
                </td>
                <td style="background: rgba(16, 185, 129, 0.2); padding: 15px; text-align: center; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #10b981; font-size: 24px; font-weight: 700;">${scanData.low || 0}</p>
                    <p style="margin: 5px 0 0; color: #10b981; font-size: 11px; text-transform: uppercase;">Low</p>
                </td>
            </tr>
        </table>
        
        <p>View the full report in your dashboard for detailed remediation guidance.</p>
    `;

    const html = createEmailTemplate('Scan Complete', content, {
        text: 'View Full Report',
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`
    });

    await sendEmail({
        to: email,
        subject: `🔍 Scan Complete: ${scanData.target} (Risk: ${riskScore.toFixed(1)})`,
        html,
    });
};

// Authorization request email
export const sendAuthorizationRequestEmail = async (
    approverEmail: string,
    requesterEmail: string,
    target: string,
    startDate: Date,
    endDate: Date,
    approvalUrl: string
) => {
    const content = `
        <p>A security testing authorization request has been submitted for your review.</p>
        
        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin: 25px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 8px 0; color: #9ca3af; width: 120px;">Target:</td>
                    <td style="padding: 8px 0; color: #ffffff; font-weight: 600;">${target}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #9ca3af;">Requested by:</td>
                    <td style="padding: 8px 0; color: #00e5a0;">${requesterEmail}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #9ca3af;">Start Date:</td>
                    <td style="padding: 8px 0; color: #ffffff;">${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #9ca3af;">End Date:</td>
                    <td style="padding: 8px 0; color: #ffffff;">${new Date(endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
            </table>
        </div>
        
        <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #f59e0b;">
                <strong>⚠️ Important:</strong> Only approve this request if you own or have authority over the target domain and consent to security testing.
            </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 13px;">This link will expire in 7 days. If you did not expect this request, please ignore this email.</p>
    `;

    const html = createEmailTemplate('Authorization Request', content, {
        text: 'Review Request',
        url: approvalUrl
    });

    await sendEmail({
        to: approverEmail,
        subject: `🔐 [M.A.S. AI] Authorization Request for ${target}`,
        html,
    });
};

// Password reset email
export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
    const content = `
        <p>We received a request to reset your password for your M.A.S. AI account.</p>
        
        <p>Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.</p>
        
        <div style="background: rgba(244, 63, 94, 0.1); border-left: 4px solid #f43f5e; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #f43f5e;">
                <strong>🔒 Security Note:</strong> If you did not request this password reset, please ignore this email and your account will remain secure.
            </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 13px; margin-top: 30px;">
            For security, this request was received from your account settings. If you have any concerns, please contact our support team immediately.
        </p>
    `;

    const html = createEmailTemplate('Password Reset', content, {
        text: 'Reset Password',
        url: resetUrl
    });

    await sendEmail({
        to: email,
        subject: '🔑 [M.A.S. AI] Password Reset Request',
        html,
    });
};
