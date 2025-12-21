'use client';

import { useState, useEffect } from 'react';
import styles from './ConsentBanner.module.css';

interface ConsentBannerProps {
    onAccept?: () => void;
}

export default function ConsentBanner({ onAccept }: ConsentBannerProps) {
    const [showBanner, setShowBanner] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const hasConsented = localStorage.getItem('singhal_consent');
        if (!hasConsented) {
            setShowBanner(true);
        }
    }, []);

    const handleAccept = () => {
        const consentData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            accepted: true,
        };
        localStorage.setItem('singhal_consent', JSON.stringify(consentData));
        setShowBanner(false);
        onAccept?.();
    };

    const handleDecline = () => {
        alert('You must accept the terms to use this application.');
    };

    if (!showBanner) return null;

    return (
        <>
            <div className={styles.banner}>
                <div className={styles.content}>
                    <div className={styles.text}>
                        <h3>⚠️ Authorized Use Only</h3>
                        <p>
                            By using M.A.S. AI, you agree to conduct security testing ONLY on systems you own or have explicit permission to test.
                            Unauthorized penetration testing is illegal.
                        </p>
                    </div>
                    <div className={styles.actions}>
                        <button onClick={() => setShowModal(true)} className={styles.link}>
                            Read Terms
                        </button>
                        <button onClick={handleDecline} className={styles.declineBtn}>
                            Decline
                        </button>
                        <button onClick={handleAccept} className={styles.acceptBtn}>
                            I Accept
                        </button>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Terms of Service & Privacy Policy</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <section>
                                <h3>1. Acceptable Use</h3>
                                <p>You agree to:</p>
                                <ul>
                                    <li>Test ONLY systems you own or have written authorization to test</li>
                                    <li>Comply with all applicable laws and regulations</li>
                                    <li>Not use this tool for malicious purposes</li>
                                    <li>Respect rate limits and authorized target restrictions</li>
                                </ul>
                            </section>

                            <section>
                                <h3>2. Legal Disclaimer</h3>
                                <p>
                                    Unauthorized access to computer systems is illegal under laws including the Computer Fraud and Abuse Act (CFAA)
                                    and similar international legislation. You are solely responsible for ensuring you have proper authorization.
                                </p>
                            </section>

                            <section>
                                <h3>3. Data Collection</h3>
                                <p>We collect:</p>
                                <ul>
                                    <li>Scan targets and results (stored locally)</li>
                                    <li>Audit logs of all actions (immutable, HMAC-signed)</li>
                                    <li>Technical logs for debugging</li>
                                </ul>
                                <p>We do NOT:</p>
                                <ul>
                                    <li>Share your data with third parties</li>
                                    <li>Use scan results for any purpose beyond providing the service</li>
                                    <li>Track you across other websites</li>
                                </ul>
                            </section>

                            <section>
                                <h3>4. Limitations of Liability</h3>
                                <p>
                                    This tool is provided "AS IS" without warranties. We are not liable for any damages resulting from use or misuse
                                    of this software.
                                </p>
                            </section>

                            <section>
                                <h3>5. Audit Trail</h3>
                                <p>
                                    All scanning activities are logged with HMAC signatures for accountability. These logs are immutable and may be
                                    used in compliance audits or legal proceedings.
                                </p>
                            </section>

                            <section>
                                <h3>6. Changes to Terms</h3>
                                <p>
                                    We may update these terms. Continued use after changes constitutes acceptance of new terms.
                                </p>
                            </section>
                        </div>
                        <div className={styles.modalFooter}>
                            <button onClick={() => setShowModal(false)} className={styles.closeModalBtn}>
                                Close
                            </button>
                            <button onClick={() => {
                                setShowModal(false);
                                handleAccept();
                            }} className={styles.acceptModalBtn}>
                                I Accept These Terms
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
