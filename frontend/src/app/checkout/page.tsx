'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './checkout.module.css';

declare global {
    interface Window {
        Razorpay: any;
    }
}

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tier = searchParams.get('tier') || 'pro';
    const duration = searchParams.get('duration') || 'monthly';

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Load Razorpay Script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => setRazorpayLoaded(true);
        script.onerror = () => setError('Failed to load payment gateway');
        document.body.appendChild(script);

        // Check Auth
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            router.push(`/auth/login?redirect=/checkout?tier=${tier}&duration=${duration}`);
            return;
        }
        setUser(JSON.parse(userData));
    }, [router, tier, duration]);

    const getPrice = () => {
        if (tier === 'pro') return duration === 'yearly' ? '29,999' : '2,999';
        if (tier === 'business') return duration === 'yearly' ? '99,999' : '9,999';
        return '0';
    };

    const handlePayment = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            // 1. Create Order
            const orderRes = await fetch('http://localhost:3001/api/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    tier: tier,
                    duration: duration
                })
            });

            const order = await orderRes.json();
            if (!orderRes.ok) throw new Error(order.error || 'Failed to create order');

            // 2. Open Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy',
                amount: order.amount,
                currency: order.currency,
                name: 'M.A.S. AI',
                description: `Upgrade to ${tier.toUpperCase()} (${duration})`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('http://localhost:3001/api/payments/verify-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok) {
                            alert('Upgrade Successful! Refreshing...');
                            // Update local user role/subscription
                            const updatedUser = {
                                ...user,
                                role: tier === 'business' ? 'pro' : 'user', // Simplified role mapping
                                subscription: verifyData.subscription
                            };
                            localStorage.setItem('user', JSON.stringify(updatedUser)); // Optimistic update
                            router.push('/dashboard');
                        } else {
                            throw new Error('Payment verification failed');
                        }
                    } catch (err: any) {
                        setError(err.message || 'Verification failed');
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user?.username,
                    email: user?.email,
                },
                theme: {
                    color: '#00ff41'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
            rzp.on('payment.failed', function (response: any) {
                setError(response.error.description);
                setLoading(false);
            });

        } catch (err: any) {
            console.error('Payment failed:', err);
            setError(err.message || 'Payment processing failed');
            setLoading(false);
        }
    };

    if (!user) return <div className={styles.container}>Loading secure channel...</div>;

    return (
        <div className={styles.card}>
            <div className={styles.title}>System Upgrade</div>

            <div className={styles.planPreview}>
                <div className={styles.planName}>
                    <span>M.A.S. AI {tier.toUpperCase()}</span>
                    <span className={styles.planPrice}>₹{getPrice()}</span>
                </div>
                <div style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Billing Cycle: <span style={{ color: '#fff' }}>{duration.charAt(0).toUpperCase() + duration.slice(1)}</span>
                </div>
                <ul className={styles.features}>
                    <li>Unlimited Scans</li>
                    <li>Advanced AI Agents</li>
                    <li>PDF Report Export</li>
                    {tier === 'business' && <li style={{ color: '#fca5a5' }}>White-label Reports & 5 Seats</li>}
                </ul>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
                className={styles.payBtn}
                onClick={handlePayment}
                disabled={loading || !razorpayLoaded}
            >
                {loading ? 'Processing...' : 'INITIALIZE UPLINK [PAY]'}
            </button>

            <a href="/pricing" className={styles.backLink}>[ ABORT / RETURN TO PRICING ]</a>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <div className={styles.container}>
            <Suspense fallback={<div>Loading payment terminal...</div>}>
                <CheckoutContent />
            </Suspense>
        </div>
    );
}
