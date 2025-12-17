'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { isAuthenticated } from '@/utils/auth';
import Navigation from '../components/Navigation';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, []);

  return (
    <>
      <Navigation />
      <div className={styles.container}>
        {/* Hero Section */}
        <header className={styles.hero}>
          <div className={styles.logoSection}>
            <Image src="/logo.png" alt="Aegis AI Logo" width={80} height={80} className={styles.logo} />
            <h1 className={styles.title}>
              <span className={styles.glitch} data-text="AEGIS AI">AEGIS AI</span>
            </h1>
            <p className={styles.tagline}>Defensive-First AI Penetration Testing Engine</p>
          </div>

          <div className={styles.heroContent}>
            <h2 className={styles.heroTitle}>Secure Your Applications with AI-Powered Security Testing</h2>
            <p className={styles.heroSubtitle}>
              Next-generation penetration testing powered by 7 specialized AI agents.
              Detect vulnerabilities before attackers do.
            </p>

            <div className={styles.ctaButtons}>
              {loggedIn ? (
                <Link href="/dashboard" className={styles.primaryBtn}>
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/auth/signup" className={styles.primaryBtn}>
                    Get Started Free
                  </Link>
                  <Link href="/auth/login" className={styles.secondaryBtn}>
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Features Grid */}
        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.glitch}>FEATURES</span>
          </h2>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.icon}>🤖</div>
              <h3>7 AI Agents</h3>
              <p>Specialized agents for reconnaissance, threat modeling, and vulnerability detection</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.icon}>🔍</div>
              <h3>200+ Vulnerability Classes</h3>
              <p>Comprehensive coverage across web, API, auth, crypto, and business logic</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.icon}>⚡</div>
              <h3>Real-Time Analysis</h3>
              <p>Watch AI agents work in real-time with live console feedback</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.icon}>📊</div>
              <h3>Advanced Visualizations</h3>
              <p>Attack surface maps, vulnerability timelines, and AI reasoning insights</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.icon}>📄</div>
              <h3>Professional Reports</h3>
              <p>PDF and JSON exports with detailed remediation guidance</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.icon}>🔒</div>
              <h3>Secure & Compliant</h3>
              <p>Immutable audit logs, authorization gating, and emergency kill switch</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.glitch}>HOW IT WORKS</span>
          </h2>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>01</div>
              <h3>Enter Target</h3>
              <p>Provide your domain or URL to scan</p>
            </div>

            <div className={styles.stepArrow}>→</div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>02</div>
              <h3>AI Analysis</h3>
              <p>7 specialized agents analyze your target</p>
            </div>

            <div className={styles.stepArrow}>→</div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>03</div>
              <h3>Get Results</h3>
              <p>Receive detailed vulnerability report</p>
            </div>

            <div className={styles.stepArrow}>→</div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>04</div>
              <h3>Remediate</h3>
              <p>Follow AI-powered fix recommendations</p>
            </div>
          </div>
        </section>

        {/* Pricing Teaser */}
        <section className={styles.pricingTeaser}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.glitch}>SIMPLE PRICING</span>
          </h2>

          <div className={styles.pricingCards}>
            <div className={styles.pricingCard}>
              <h3>Free</h3>
              <div className={styles.price}>₹0<span>/month</span></div>
              <p>3 scans per month</p>
              <Link href="/pricing" className={styles.pricingBtn}>Learn More</Link>
            </div>

            <div className={`${styles.pricingCard} ${styles.popular}`}>
              <div className={styles.popularBadge}>POPULAR</div>
              <h3>Pro</h3>
              <div className={styles.price}>₹2,999<span>/month</span></div>
              <p>Unlimited scans</p>
              <Link href="/pricing" className={styles.pricingBtn}>Learn More</Link>
            </div>

            <div className={styles.pricingCard}>
              <h3>Enterprise</h3>
              <div className={styles.price}>Custom</div>
              <p>White-label & more</p>
              <Link href="/pricing" className={styles.pricingBtn}>Learn More</Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.cta}>
          <h2>Ready to Secure Your Applications?</h2>
          <p>Start your free account today. No credit card required.</p>
          <Link href="/auth/signup" className={styles.primaryBtn}>
            Get Started Free →
          </Link>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerSection}>
              <h4>AEGIS AI</h4>
              <p>AI-Powered Security Testing</p>
            </div>

            <div className={styles.footerSection}>
              <h4>Product</h4>
              <Link href="/dashboard">Try Demo</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/scans">Scan Info</Link>
            </div>

            <div className={styles.footerSection}>
              <h4>Company</h4>
              <Link href="/">About</Link>
              <Link href="/">Contact</Link>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>© 2024 Aegis AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
