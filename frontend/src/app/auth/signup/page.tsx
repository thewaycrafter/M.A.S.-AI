'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './signup.module.css';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setRazorpayLoaded(true);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePayment = async (user: any, token: string) => {
        try {
            // Create order
            const orderRes = await fetch('http://localhost:3001/api/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    tier: 'pro',
                    duration: 'monthly'
                })
            });

            const order = await orderRes.json();
            if (!orderRes.ok) throw new Error(order.error || 'Failed to create order');

            const options = {
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: "M.A.S. AI",
                description: "Pro Subscription",
                order_id: order.orderId,
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
                            // Update local user data with new subscription
                            const updatedUser = { ...user, role: 'pro', subscription: verifyData.subscription };
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                            router.push('/dashboard');
                        } else {
                            throw new Error(verifyData.error || 'Payment verification failed');
                        }
                    } catch (err: any) {
                        setError('Payment failed: ' + err.message);
                        // Even if payment fails, user is created, so redirect to dashboard (as free user)
                        setTimeout(() => router.push('/dashboard'), 2000);
                    }
                },
                prefill: {
                    name: user.username,
                    email: user.email,
                },
                theme: {
                    color: "#00ff41"
                },
                modal: {
                    ondismiss: function () {
                        // Redirect to dashboard even if dismissed (user is already created)
                        router.push('/dashboard');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err: any) {
            console.error('Payment initialization failed:', err);
            setError('Payment system error. Account created as Free plan.');
            setTimeout(() => router.push('/dashboard'), 2000);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Register user
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Signup failed');

            // Store token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (selectedPlan === 'pro') {
                if (!razorpayLoaded) {
                    alert('Payment system loading... please wait');
                    return;
                }
                await handlePayment(data.user, data.token);
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <div className={styles.header}>
                    <div className={styles.terminalPrompt}>root@mas-ai:~#</div>
                    <Link href="/">
                        <h1 className={styles.title}>M.A.S. AI</h1>
                    </Link>
                    <p className={styles.subtitle}>Join the Security Revolution</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Username</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="Choose a username"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="email"
                                className={styles.input}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="your.email@domain.com"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="password"
                                className={styles.input}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Minimum 8 characters"
                                required
                                minLength={8}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Select Plan</label>
                        <div className={styles.planSelection}>
                            <div
                                className={`${styles.planCard} ${selectedPlan === 'free' ? styles.selected : ''}`}
                                onClick={() => setSelectedPlan('free')}
                            >
                                <div className={styles.planName}>FREE</div>
                                <div className={styles.planPrice}>₹0</div>
                                <div className={styles.planFeature}>3 scans/mo</div>
                            </div>
                            <div
                                className={`${styles.planCard} ${selectedPlan === 'pro' ? styles.selected : ''}`}
                                onClick={() => setSelectedPlan('pro')}
                            >
                                <div className={styles.planName}>PRO</div>
                                <div className={styles.planPrice}>₹2,999</div>
                                <div className={styles.planFeature}>100 scans/mo</div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'PROCESSING...' : (selectedPlan === 'pro' ? 'CONTINUE TO PAYMENT' : 'CREATE ACCOUNT')}
                    </button>
                </form>

                <div className={styles.footer}>
                    <Link href="/" className={styles.link}>
                        ← Back to Home
                    </Link>
                    {' | '}
                    Already have an account?{' '}
                    <Link href="/auth/login" className={styles.link}>
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
