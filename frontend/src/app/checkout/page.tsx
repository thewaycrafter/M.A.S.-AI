'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './checkout.module.css';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tier = searchParams.get('tier') || 'pro';

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
            router.push(`/auth/login?redirect=/checkout?tier=${tier}`);
            return;
        }
        setUser(JSON.parse(userData));
    }, [router, tier]);

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
                    duration: 'monthly'
                })
            });

            const order = await orderRes.json();
            if (!orderRes.ok) throw new Error(order.error || 'Failed to create order');

            // 2. Open Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy', // Replace with logic to get key if needed from backend
                amount: order.amount,
                currency: order.currency,
                name: 'Aegis AI',
                description: `Upgrade to ${tier.toUpperCase()}`,
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
                        if (verifyData.success) {
                            alert('Upgrade Successful! Refreshing...');
                            // Update local user role
                            const updatedUser = { ...user, role: 'pro' };
                            localStorage.setItem('user', JSON.stringify(updatedUser));
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
                    color: '#00ff00'
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
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.title}>System Upgrade</div>

                <div className={styles.planPreview}>
                    <div className={styles.planName}>
                        <span>AEGIS {tier.toUpperCase()}</span>
                        <span className={styles.planPrice}>₹2,999</span>
                    </div>
                    <ul className={styles.features}>
                        <li>Unlimited Scans</li>
                        <li>Advanced AI Agents</li>
                        <li>PDF Report Export</li>
                        <li>Priority Support</li>
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

                <a href="/dashboard" className={styles.backLink}>[ ABORT / RETURN TO TERMINAL ]</a>
            </div>
        </div>
    );
}
