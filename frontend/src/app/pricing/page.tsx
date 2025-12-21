'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isAuthenticated } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import styles from './pricing.module.css';

export default function PricingPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (isAuthenticated()) {
            setUser(getUser());
        }
    }, []);

    const handleUpgrade = (tier: string) => {
        if (!isAuthenticated()) {
            router.push('/auth/login');
            return;
        }
        // Redirect to payment flow (will implement Razorpay later)
        router.push(`/checkout?tier=${tier}`);
    };

    return (
        <div>
            <Navigation />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <span className={styles.glitch}>CHOOSE YOUR PLAN</span>
                    </h1>
                    <p className={styles.subtitle}>Scale your security testing with AI-powered penetration testing</p>
                </div>

                <div className={styles.pricingGrid}>
                    {/* Free Tier */}
                    <div className={styles.pricingCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.tierName}>Free</h2>
                            <div className={styles.price}>
                                <span className={styles.currency}>₹</span>
                                <span className={styles.amount}>0</span>
                                <span className={styles.period}>/month</span>
                            </div>
                            <p className={styles.tierDesc}>Get started with basic security testing</p>
                        </div>

                        <ul className={styles.features}>
                            <li className={styles.feature}>✅ 3 scans per month</li>
                            <li className={styles.feature}>✅ Basic vulnerability detection</li>
                            <li className={styles.feature}>✅ PDF reports</li>
                            <li className={styles.feature}>✅ Up to 10 vulnerabilities per scan</li>
                            <li className={styles.feature}>❌ No API access</li>
                            <li className={styles.feature}>❌ Limited to 5 categories</li>
                            <li className={styles.feature}>❌ No historical data</li>
                            <li className={styles.feature}>💬 Community support</li>
                        </ul>

                        <button
                            className={`${styles.upgradeBtn} ${user?.subscription?.tier === 'free' ? styles.current : ''}`}
                            disabled={user?.subscription?.tier === 'free'}
                            onClick={() => handleUpgrade('free')}
                        >
                            {user?.subscription?.tier === 'free' ? 'Current Plan' : 'Get Started'}
                        </button>

                        <div className={styles.costInfo}>
                            <p>💰 OpenAI Cost: ~₹1 per scan</p>
                        </div>
                    </div>

                    {/* Pro Tier - POPULAR */}
                    <div className={`${styles.pricingCard} ${styles.popular}`}>
                        <div className={styles.popularBadge}>MOST POPULAR</div>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.tierName}>Pro</h2>
                            <div className={styles.price}>
                                <span className={styles.currency}>₹</span>
                                <span className={styles.amount}>2,999</span>
                                <span className={styles.period}>/month</span>
                            </div>
                            <p className={styles.tierDesc}>Professional security testing for growing teams</p>
                        </div>

                        <ul className={styles.features}>
                            <li className={styles.feature}>✅ Unlimited scans</li>
                            <li className={styles.feature}>✅ Full vulnerability detection (200+ classes)</li>
                            <li className={styles.feature}>✅ PDF + JSON export</li>
                            <li className={styles.feature}>✅ Historical data (12 months)</li>
                            <li className={styles.feature}>✅ API access</li>
                            <li className={styles.feature}>✅ Attack surface visualization</li>
                            <li className={styles.feature}>✅ AI reasoning insights</li>
                            <li className={styles.feature}>⚡ Priority support</li>
                        </ul>

                        <button
                            className={`${styles.upgradeBtn} ${styles.popularBtn} ${user?.subscription?.tier === 'pro' ? styles.current : ''}`}
                            disabled={user?.subscription?.tier === 'pro'}
                            onClick={() => handleUpgrade('pro')}
                        >
                            {user?.subscription?.tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                        </button>

                        <div className={styles.costInfo}>
                            <p>💰 Avg Cost: ₹1.50/scan × unlimited = Best Value!</p>
                            <p>💎 Profit: 99% margin after OpenAI costs</p>
                        </div>
                    </div>

                    {/* Enterprise Tier */}
                    <div className={styles.pricingCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.tierName}>Enterprise</h2>
                            <div className={styles.price}>
                                <span className={styles.amount}>Custom</span>
                            </div>
                            <p className={styles.tierDesc}>Complete control for organizations</p>
                        </div>

                        <ul className={styles.features}>
                            <li className={styles.feature}>✅ Everything in Pro</li>
                            <li className={styles.feature}>✅ Unlimited users</li>
                            <li className={styles.feature}>✅ White-label reports</li>
                            <li className={styles.feature}>✅ Custom integrations</li>
                            <li className={styles.feature}>✅ Dedicated support</li>
                            <li className={styles.feature}>✅ SLA guarantee</li>
                            <li className={styles.feature}>✅ Admin dashboard</li>
                            <li className={styles.feature}>🔒 Full security compliance</li>
                        </ul>

                        <button
                            className={`${styles.upgradeBtn} ${user?.role === 'admin' ? styles.current : ''}`}
                            disabled={user?.role === 'admin'}
                            onClick={() => window.location.href = 'mailto:sales@singhal-ai.com'}
                        >
                            {user?.role === 'admin' ? 'Current Plan' : 'Contact Sales'}
                        </button>

                        <div className={styles.costInfo}>
                            <p>📞 Custom pricing based on team size</p>
                        </div>
                    </div>
                </div>

                {/* Feature Comparison Table */}
                <div className={styles.comparisonSection}>
                    <h2 className={styles.comparisonTitle}>Detailed Feature Comparison</h2>
                    <div className={styles.comparisonTable}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Feature</th>
                                    <th>Free</th>
                                    <th>Pro</th>
                                    <th>Enterprise</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Scans per month</td>
                                    <td>3</td>
                                    <td>Unlimited</td>
                                    <td>Unlimited</td>
                                </tr>
                                <tr>
                                    <td>Vulnerability classes</td>
                                    <td>20</td>
                                    <td>200+</td>
                                    <td>200+</td>
                                </tr>
                                <tr>
                                    <td>PDF reports</td>
                                    <td>✅</td>
                                    <td>✅</td>
                                    <td>✅ White-label</td>
                                </tr>
                                <tr>
                                    <td>JSON export</td>
                                    <td>❌</td>
                                    <td>✅</td>
                                    <td>✅</td>
                                </tr>
                                <tr>
                                    <td>Historical data</td>
                                    <td>❌</td>
                                    <td>12 months</td>
                                    <td>Unlimited</td>
                                </tr>
                                <tr>
                                    <td>API access</td>
                                    <td>❌</td>
                                    <td>✅</td>
                                    <td>✅</td>
                                </tr>
                                <tr>
                                    <td>Support</td>
                                    <td>Community</td>
                                    <td>Priority</td>
                                    <td>Dedicated</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={() => router.push('/dashboard')} className={styles.backBtn}>
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
