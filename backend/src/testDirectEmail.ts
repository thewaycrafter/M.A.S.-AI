import nodemailer from 'nodemailer';

const testDirectEmail = async () => {
    console.log('Testing direct SMTP connection...');

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'aegisaitool@gmail.com',
            pass: 'fnliksxagfhgdyit',
        },
        debug: true,
        logger: true
    });

    try {
        console.log('Verifying transporter...');
        await transporter.verify();
        console.log('✅ SMTP Connection verified!');

        console.log('Sending test email...');
        const result = await transporter.sendMail({
            from: '"M.A.S. AI" <aegisaitool@gmail.com>',
            to: 'aegisaitool@gmail.com',
            subject: 'M.A.S. AI Test Email',
            html: '<h1>Test Email</h1><p>Your email configuration is working!</p>',
        });

        console.log('✅ Email sent! Message ID:', result.messageId);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
};

testDirectEmail();
