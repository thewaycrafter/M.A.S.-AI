'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isAuthenticated } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import styles from './pricing.module.css';

export default function PricingPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

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
        // Pass duration to checkout
        router.push(`/checkout?tier=${tier}&duration=${billingCycle}`);
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

                    {/* Billing Toggle */}
                    <div className={styles.billingToggle}>
                        <span className={`${styles.billingLabel} ${billingCycle === 'monthly' ? styles.active : ''}`}>Monthly</span>
                        <div
                            className={`${styles.toggleSwitch} ${billingCycle === 'yearly' ? styles.toggled : ''}`}
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        >
                            <div className={styles.toggleThumb} />
                        </div>
                        <span className={`${styles.billingLabel} ${billingCycle === 'yearly' ? styles.active : ''}`}>
                            Yearly <span className={styles.saveBadge}>SAVE 17%</span>
                        </span>
                    </div>
                </div>

                <div className={styles.pricingGrid}>
                    {/* Free Tier */}
                    <div className={styles.pricingCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.tierName}>Free</h2>
                            <div className={styles.price}>
                                <span className={styles.currency}>₹</span>
                                <span className={styles.amount}>0</span>
                                <span className={styles.period}>{billingCycle === 'yearly' ? '/year' : '/month'}</span>
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
                                <span className={styles.amount}>{billingCycle === 'yearly' ? '29,999' : '2,999'}</span>
                                <span className={styles.period}>{billingCycle === 'yearly' ? '/year' : '/month'}</span>
                            </div>
                            <p className={styles.tierDesc}>Professional security testing for individuals</p>
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
                            <p>💰 Best Value for Solo Researchers</p>
                        </div>
                    </div>


                    {/* Business Tier - NEW */}
                    <div className={styles.pricingCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.tierName}>Business</h2>
                            <div className={styles.price}>
                                <span className={styles.currency}>₹</span>
                                <span className={styles.amount}>{billingCycle === 'yearly' ? '99,999' : '9,999'}</span>
                                <span className={styles.period}>{billingCycle === 'yearly' ? '/year' : '/month'}</span>
                            </div>
                            <p className={styles.tierDesc}>Advanced security for teams & agencies</p>
                        </div>

                        <ul className={styles.features}>
                            <li className={styles.feature}>✅ Everything in Pro</li>
                            <li className={styles.feature}>✅ 5 User Seats</li>
                            <li className={styles.feature}>✅ White-label PDF Reports</li>
                            <li className={styles.feature}>✅ CI/CD Integration Tools</li>
                            <li className={styles.feature}>✅ Audit Logs Retention (Forever)</li>
                            <li className={styles.feature}>✅ Advanced Reconnaissance Agent</li>
                            <li className={styles.feature}>✅ Custom Scanning Profiles</li>
                            <li className={styles.feature}>🚀 <span style={{ color: '#00ff41' }}>Dedicated Account Manager</span></li>
                        </ul>

                        <button
                            className={`${styles.upgradeBtn} ${user?.subscription?.tier === 'business' ? styles.current : ''}`}
                            disabled={user?.subscription?.tier === 'business'}
                            onClick={() => handleUpgrade('business')}
                        >
                            {user?.subscription?.tier === 'business' ? 'Current Plan' : 'Upgrade to Business'}
                        </button>

                        <div className={styles.costInfo}>
                            <p>🏢 Ideal for small security teams</p>
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
                            <li className={styles.feature}>✅ Everything in Business</li>
                            <li className={styles.feature}>✅ Unlimited users</li>
                            <li className={styles.feature}>✅ SSO / SAML Integration</li>
                            <li className={styles.feature}>✅ On-premise Deployment Option</li>
                            <li className={styles.feature}>✅ Custom Contracts & SLA</li>
                            <li className={styles.feature}>✅ 24/7 Dedicated Support</li>
                            <li className={styles.feature}>✅ Custom AI Model Tuning</li>
                            <li className={styles.feature}>🔒 ISO/SOC2 Compliance Assistance</li>
                        </ul>

                        <button
                            className={`${styles.upgradeBtn} ${user?.role === 'admin' ? styles.current : ''}`}
                            disabled={user?.role === 'admin'}
                            onClick={() => window.location.href = 'mailto:sales@mas-ai.com'}
                        >
                            {user?.role === 'admin' ? 'Current Plan' : 'Contact Sales'}
                        </button>

                        <div className={styles.costInfo}>
                            <p>📞 Custom pricing based on scale</p>
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
                                    <th>Business</th>
                                    <th>Enterprise</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Scans per month</td>
                                    <td>3</td>
                                    <td>Unlimited</td>
                                    <td>Unlimited</td>
                                    <td>Unlimited</td>
                                </tr>
                                <tr>
                                    <td>Vulnerability classes</td>
                                    <td>20</td>
                                    <td>200+</td>
                                    <td>200+</td>
                                    <td>Custom</td>
                                </tr>
                                <tr>
                                    <td>Report Branding</td>
                                    <td>Standard</td>
                                    <td>Standard</td>
                                    <td>White-label</td>
                                    <td>White-label</td>
                                </tr>
                                <tr>
                                    <td>JSON & Export</td>
                                    <td>❌</td>
                                    <td>✅</td>
                                    <td>✅</td>
                                    <td>✅</td>
                                </tr>
                                <tr>
                                    <td>Historical data</td>
                                    <td>❌</td>
                                    <td>12 months</td>
                                    <td>Unlimited</td>
                                    <td>Unlimited</td>
                                </tr>
                                <tr>
                                    <td>API access</td>
                                    <td>❌</td>
                                    <td>✅</td>
                                    <td>✅</td>
                                    <td>✅</td>
                                </tr>
                                <tr>
                                    <td>Integrations</td>
                                    <td>❌</td>
                                    <td>Basic</td>
                                    <td>CI/CD</td>
                                    <td>Custom</td>
                                </tr>
                                <tr>
                                    <td>Support</td>
                                    <td>Community</td>
                                    <td>Priority</td>
                                    <td>Dedicated Mgr</td>
                                    <td>24/7 SLA</td>
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
