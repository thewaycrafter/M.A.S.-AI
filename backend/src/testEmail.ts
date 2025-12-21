import { sendEmail } from './services/email';
import dotenv from 'dotenv';

import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('📧 Testing Email Configuration...');
console.log(`User: ${process.env.EMAIL_USER}`);
console.log(`Host: ${process.env.EMAIL_HOST}`);
console.log(`Port: ${process.env.EMAIL_PORT}`);
console.log(`Secure: ${process.env.EMAIL_SECURE}`);
console.log(`Pass Debug: ${JSON.stringify(process.env.EMAIL_PASSWORD)}`);
if (process.env.EMAIL_PASSWORD) {
    console.log(`Pass Codes: ${process.env.EMAIL_PASSWORD.split('').map(c => c.charCodeAt(0)).join(',')}`);
}

const testEmail = async () => {
    try {
        console.log('Sending test email...');
        const result = await sendEmail({
            to: process.env.EMAIL_USER!, // Send to self
            subject: 'M.A.S. AI SMTP Test',
            html: '<h1>SMTP Configuration Valid</h1><p>Your email system is working correctly.</p>',
        });

        if (result) {
            console.log('✅ Email sent successfully!');
            console.log('Message ID:', result.messageId);
        } else {
            console.log('❌ Email function returned no result (likely configured to skip or failed silently).');
        }
    } catch (error) {
        console.error('❌ Email Test Failed:', error);
    }
};

testEmail();
