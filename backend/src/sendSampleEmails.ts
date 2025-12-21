/**
 * Send sample emails to test all email templates
 * Run with: npx ts-node src/sendSampleEmails.ts
 */

import { sendEmail } from './services/email';
import { emailTemplates } from './services/emailTemplates';

const TEST_EMAIL = 'themridulsinghal@gmail.com';
const SAMPLE_USERNAME = 'Mridul';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function sendAllSampleEmails() {
    console.log(`\n📧 Sending sample emails to: ${TEST_EMAIL}\n`);
    console.log('='.repeat(60));

    try {
        // 1. Welcome Email
        console.log('\n1️⃣ Sending Welcome Email...');
        await sendEmail({
            to: TEST_EMAIL,
            subject: '[M.A.S. AI] Welcome to M.A.S. AI! 🎉',
            html: emailTemplates.welcome(SAMPLE_USERNAME)
        });
        console.log('   ✅ Welcome email sent!');

        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Email Verification
        console.log('\n2️⃣ Sending Email Verification...');
        const verifyUrl = `${FRONTEND_URL}/auth/verify-email?token=sample-verification-token-12345`;
        await sendEmail({
            to: TEST_EMAIL,
            subject: '[M.A.S. AI] Verify Your Email Address',
            html: emailTemplates.verification(SAMPLE_USERNAME, verifyUrl)
        });
        console.log('   ✅ Verification email sent!');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Password Reset
        console.log('\n3️⃣ Sending Password Reset Email...');
        const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=sample-reset-token-67890`;
        await sendEmail({
            to: TEST_EMAIL,
            subject: '[M.A.S. AI] Password Reset Request',
            html: emailTemplates.passwordReset(SAMPLE_USERNAME, resetUrl)
        });
        console.log('   ✅ Password reset email sent!');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // 4. Scan Complete
        console.log('\n4️⃣ Sending Scan Complete Email...');
        const sampleFindings = {
            critical: 2,
            high: 5,
            medium: 12,
            low: 23,
            total: 42
        };
        await sendEmail({
            to: TEST_EMAIL,
            subject: '[M.A.S. AI] Security Scan Complete - example.com',
            html: emailTemplates.scanComplete(SAMPLE_USERNAME, 'example.com', sampleFindings, 'scan-id-abc123')
        });
        console.log('   ✅ Scan complete email sent!');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // 5. Authorization Request
        console.log('\n5️⃣ Sending Authorization Request Email...');
        const approvalUrl = `${FRONTEND_URL}/auth/approve-authorization?token=auth-token-xyz789`;
        await sendEmail({
            to: TEST_EMAIL,
            subject: '[M.A.S. AI] Security Testing Authorization Request',
            html: emailTemplates.authorizationRequest(SAMPLE_USERNAME, 'mridul@example.com', 'example.com', approvalUrl)
        });
        console.log('   ✅ Authorization request email sent!');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // 6. Account Not Found
        console.log('\n6️⃣ Sending Account Not Found Email...');
        await sendEmail({
            to: TEST_EMAIL,
            subject: '[M.A.S. AI] Password Reset Request',
            html: emailTemplates.accountNotFound('unknown@example.com')
        });
        console.log('   ✅ Account not found email sent!');

        console.log('\n' + '='.repeat(60));
        console.log('\n🎉 All 6 sample emails have been sent successfully!');
        console.log(`📬 Check your inbox at: ${TEST_EMAIL}\n`);

    } catch (error) {
        console.error('\n❌ Error sending emails:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Run the script
sendAllSampleEmails();
