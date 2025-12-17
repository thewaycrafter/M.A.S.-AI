import React from 'react';
import styles from './GlassCard.module.css';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export default function GlassCard({ children, className = '', hover = true, onClick }: GlassCardProps) {
    return (
        <div
            className={`${styles.glassCard} ${hover ? styles.hover : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
