import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { User } from '../../models/User';
import { Payment } from '../../models/Payment';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// Create order for subscription
router.post('/create-order', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { tier, duration } = req.body; // tier: 'pro' | 'enterprise', duration: 'monthly' | 'yearly'

        // Calculate amount based on tier
        let amount = 0;
        if (tier === 'pro') {
            amount = duration === 'yearly' ? 29999 : 2999; // ₹2,999/month or ₹29,999/year
        }

        // Create Razorpay order
        const options = {
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${req.user?.id?.toString().slice(-4)}`,
            notes: {
                userId: req.user?.id || '',
                tier,
                duration,
            },
        };

        const order: any = await razorpay.orders.create(options as any);

        // Save payment record
        const payment = new Payment({
            userId: req.user?.id,
            amount: amount,
            currency: 'INR',
            razorpayOrderId: order.id,
            status: 'pending',
            subscription: { tier, duration },
        });

        await payment.save();

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: 'INR',
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error: any) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Verify payment and update subscription
router.post('/verify-payment', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Find payment record
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (!payment.subscription) {
            return res.status(400).json({ error: 'Invalid payment record: missing subscription details' });
        }

        // Update payment
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = 'success';
        await payment.save();

        // Update user subscription
        const user = await User.findById(payment.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const startDate = new Date();
        const endDate = new Date();
        if (payment.subscription.duration === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        user.subscription = {
            tier: payment.subscription.tier as any,
            status: 'active',
            startDate,
            endDate,
            razorpaySubscriptionId: razorpay_payment_id,
            razorpayCustomerId: undefined // Add required property
        };

        // Upgrade role for pro users
        if (payment.subscription.tier === 'pro') {
            user.role = 'pro';
        }

        await user.save();

        res.json({
            message: 'Payment verified successfully',
            subscription: user.subscription,
        });
    } catch (error: any) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

// Get payment history
router.get('/history', requireAuth, async (req: AuthRequest, res) => {
    try {
        const payments = await Payment.find({ userId: req.user?.id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ payments });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

// Razorpay webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'] as string;

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', secret || '')
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body;

        // Handle different events
        switch (event.event) {
            case 'payment.captured':
                // Payment successful
                console.log('Payment captured:', event.payload.payment.entity);
                break;
            case 'payment.failed':
                // Payment failed
                console.log('Payment failed:', event.payload.payment.entity);
                break;
            case 'subscription.cancelled':
                // Subscription cancelled
                console.log('Subscription cancelled:', event.payload.subscription.entity);
                break;
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export default router;
