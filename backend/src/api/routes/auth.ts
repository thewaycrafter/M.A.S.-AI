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
        const user = new User({
            username,
            email,
            password,
            role: 'user',
            subscription: {
                tier: 'free',
                status: 'active',
                startDate: new Date(),
            }
        });

        await user.save();

        // Generate token
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

        // Send welcome email (async, don't wait)
        sendWelcomeEmail(email, username).catch(err => console.error('Failed to send welcome email:', err));

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                subscription: user.subscription
            }
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

        const user: any = await User.findOne({ email: email.toLowerCase() });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({
                message: 'If an account exists with this email, you will receive a password reset link.'
            });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Send reset email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

        try {
            const { sendEmail } = await import('../../services/email');
            await sendEmail({
                to: user.email,
                subject: '[M.A.S. AI] Password Reset Request',
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
                        <h2>Password Reset Request</h2>
                        <p>Hello ${user.username},</p>
                        <p>We received a request to reset your password. Click the button below to set a new password:</p>
                        <a href="${resetUrl}" class="btn">🔑 Reset Password</a>
                        <p>This link will expire in <strong>1 hour</strong>.</p>
                        <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
                        <div class="footer">
                            <p>This is an automated message from M.A.S. AI Security Platform.</p>
                        </div>
                    </div>
                </body>
                </html>
                `
            });
            console.log(`📧 Password reset email sent to ${user.email}`);
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
        }

        res.json({
            message: 'If an account exists with this email, you will receive a password reset link.'
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

export default router;

