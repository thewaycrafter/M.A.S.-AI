import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { requireAuth, AuthRequest, generateToken } from '../../middleware/auth';
import { authLimiter, passwordResetLimiter } from '../../middleware/rateLimit';
import { sendWelcomeEmail } from '../../services/email';

const router = express.Router();

// Register new user (rate limited)
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user
        const user: any = new User({
            username,
            email,
            password,
            role: 'user',
            isEmailVerified: false,
            subscription: {
                tier: 'free',
                status: 'active',
                startDate: new Date(),
            }
        });

        // Generate email verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET is not configured!');
            return res.status(500).json({ error: 'Server configuration error' });
        }
        const token = jwt.sign(
            { id: user._id, role: user.role },
            jwtSecret,
            { expiresIn: '24h' }
        );

        // Send verification email (async)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verifyUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

        try {
            const { sendEmail } = await import('../../services/email');
            const { emailTemplates } = await import('../../services/emailTemplates');
            await sendEmail({
                to: email,
                subject: '[M.A.S. AI] Verify Your Email Address',
                html: emailTemplates.verification(username, verifyUrl)
            });
            console.log(`📧 Verification email sent to ${email}`);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        // Also send welcome email
        sendWelcomeEmail(email, username).catch(err => console.error('Failed to send welcome email:', err));

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                subscription: user.subscription
            },
            message: 'Registration successful! Please check your email to verify your account.'
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login (rate limited)
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('🔐 Login attempt:', { username, passwordLength: password?.length });

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user (can login with username or email)
        const user: any = await User.findOne({
            $or: [{ username }, { email: username }],
        });

        if (!user) {
            console.log('❌ User not found:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('✅ User found:', user.username);
        console.log('Attempting password comparison...');

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        console.log('Password comparison result:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('❌ Password invalid');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('✅ Login successful!');

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                subscription: user.subscription,
                onboarding: user.onboarding,
                usage: user.usage,
            },
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
    try {
        const user = await User.findById(req.user?.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user profile
router.put('/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { firstName, lastName, company, phone } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user?.id,
            {
                $set: {
                    'profile.firstName': firstName,
                    'profile.lastName': lastName,
                    'profile.company': company,
                    'profile.phone': phone,
                },
            },
            { new: true }
        ).select('-password');

        res.json({ message: 'Profile updated', user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Mark tour as completed
router.post('/complete-tour', requireAuth, async (req: AuthRequest, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user?.id,
            {
                $set: {
                    'onboarding.tourCompleted': true,
                },
            },
            { new: true }
        ).select('-password');

        res.json({ message: 'Tour completed', user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update tour status' });
    }
});

// Request password reset (rate limited)
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user: any = await User.findOne({ email: normalizedEmail });
        const { sendEmail } = await import('../../services/email');
        const { emailTemplates } = await import('../../services/emailTemplates');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        // If user doesn't exist, inform them (but still send an email for security)
        if (!user) {
            // Send "account not found" email
            try {
                await sendEmail({
                    to: normalizedEmail,
                    subject: '[M.A.S. AI] Password Reset Request',
                    html: emailTemplates.accountNotFound(normalizedEmail)
                });
                console.log(`📧 Account not found email sent to ${normalizedEmail}`);
            } catch (emailError) {
                console.error('Failed to send account not found email:', emailError);
            }

            return res.json({
                success: false,
                message: 'No account found with this email address. Please check the email or create a new account.',
                accountExists: false
            });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Send password reset email
        const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

        try {
            await sendEmail({
                to: user.email,
                subject: '[M.A.S. AI] Password Reset Request',
                html: emailTemplates.passwordReset(user.username, resetUrl)
            });
            console.log(`📧 Password reset email sent to ${user.email}`);
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            return res.status(500).json({ error: 'Failed to send password reset email. Please try again.' });
        }

        res.json({
            success: true,
            message: 'Password reset link has been sent to your email address.',
            accountExists: true
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});

// Reset password with token (rate limited)
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Find user by reset token
        const user: any = await (User as any).findByResetToken(token);

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Update password and clear reset token
        user.password = password;
        user.clearPasswordResetToken();
        await user.save();

        console.log(`🔐 Password reset successful for ${user.username}`);

        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Verify email with token
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        // Find user by verification token
        const user: any = await (User as any).findByVerificationToken(token);

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        // Verify the email
        user.verifyEmail();
        await user.save();

        console.log(`✅ Email verified for ${user.username}`);

        res.json({
            message: 'Email verified successfully! You can now use all features.',
            verified: true
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
});

// Resend verification email (requires auth)
router.post('/resend-verification', requireAuth, async (req: AuthRequest, res) => {
    try {
        const user: any = await User.findById(req.user?.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        // Generate new verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // Send verification email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verifyUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

        try {
            const { sendEmail } = await import('../../services/email');
            await sendEmail({
                to: user.email,
                subject: '[M.A.S. AI] Verify Your Email Address',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #fff; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 12px; padding: 30px; border: 1px solid #333; }
                        .logo { color: #00ff41; font-size: 24px; font-weight: bold; font-family: monospace; }
                        .btn { display: inline-block; background: linear-gradient(135deg, #00ff41, #00e5a0); color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
                        .footer { color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #333; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">M.A.S. AI</div>
                        <h2>📧 Email Verification</h2>
                        <p>Hello ${user.username},</p>
                        <p>Please verify your email address by clicking the button below:</p>
                        <a href="${verifyUrl}" class="btn">✅ Verify Email Address</a>
                        <p>This link will expire in <strong>24 hours</strong>.</p>
                        <div class="footer">
                            <p>This is an automated message from M.A.S. AI Security Platform.</p>
                        </div>
                    </div>
                </body>
                </html>
                `
            });
            console.log(`📧 Verification email resent to ${user.email}`);
        } catch (emailError) {
            console.error('Failed to resend verification email:', emailError);
            return res.status(500).json({ error: 'Failed to send verification email' });
        }

        res.json({ message: 'Verification email sent! Please check your inbox.' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});

export default router;
