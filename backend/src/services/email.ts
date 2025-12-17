import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

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

export const sendEmail = async ({ to, subject, html, text }: EmailOptions) => {
    try {
        if (!process.env.EMAIL_USER) {
            console.log('⚠️ EMAIL_USER not set. Skipping email sending.');
            console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
            return;
        }

        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Aegis AI'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
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
    const templatePath = path.join(__dirname, '../templates/emails/welcome.html');
    let html = '';

    try {
        html = fs.readFileSync(templatePath, 'utf8');
    } catch (err) {
        // Fallback if template file is missing (e.g. in build)
        html = `<h1>Welcome to Aegis AI, ${username}!</h1><p>Your journey into advanced security starts here.</p>`;
    }

    // specific replacement
    html = html.replace('{{username}}', username);

    await sendEmail({
        to: email,
        subject: 'Welcome to Aegis AI - Access Granted',
        html,
    });
};

export const sendScanCompletionEmail = async (email: string, username: string, scanData: any) => {
    const templatePath = path.join(__dirname, '../templates/emails/scan-complete.html');
    let html = '';

    try {
        html = fs.readFileSync(templatePath, 'utf8');
    } catch (err) {
        html = `<h1>Scan Complete for ${scanData.target}</h1><p>Risk Score: ${scanData.riskScore}</p>`;
    }

    // Determine risk color hex
    const riskScore = scanData.riskScore || 0;
    let riskColorHex = '#10b981'; // Low (Green)
    if (riskScore >= 9) riskColorHex = '#f43f5e'; // Critical (Rose)
    else if (riskScore >= 7) riskColorHex = '#f97316'; // High (Orange)
    else if (riskScore >= 4) riskColorHex = '#f59e0b'; // Medium (Amber)

    html = html
        .replace('{{target}}', scanData.target)
        .replace('{{scanId}}', scanData.scanId)
        .replace('{{riskScore}}', riskScore.toFixed(1))
        .replace('{{criticalCount}}', (scanData.critical || 0).toString())
        .replace('{{highCount}}', (scanData.high || 0).toString())
        .replace('{{riskColorClass}}', riskColorHex);

    await sendEmail({
        to: email,
        subject: `Scan Complete: ${scanData.target} (Risk Score: ${riskScore.toFixed(1)})`,
        html,
    });
};
