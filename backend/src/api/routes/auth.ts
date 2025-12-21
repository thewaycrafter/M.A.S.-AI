import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { requireAuth, AuthRequest, generateToken } from '../../middleware/auth';
import { sendWelcomeEmail } from '../../services/email';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
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
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
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

// Login
router.post('/login', async (req, res) => {
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
        console.log('Password hash in DB:', user.password);
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

export default router;
