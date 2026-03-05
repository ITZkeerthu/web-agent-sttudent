import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * Hero landing page — Liquid Glass theme with custom typography.
 */
export default function LandingPage({ onStart }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Ambient glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ background: 'var(--clr-purple)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-15" style={{ background: 'var(--clr-cyan)' }} />
            <div className="absolute top-1/2 right-1/3 w-60 h-60 rounded-full blur-[80px] opacity-10" style={{ background: 'var(--clr-pink)' }} />

            {/* Logo */}
            <div className="glass-card gradient-border w-24 h-24 flex items-center justify-center mb-10 hover-glow-purple">
                <span className="text-4xl font-heading text-gradient-rainbow" style={{ fontFamily: 'var(--font-heading)', fontWeight: 900 }}>S</span>
            </div>

            {/* Title */}
            <h1 className="text-6xl md:text-8xl leading-tight mb-4 tracking-tighter text-gradient-rainbow"
                style={{ fontFamily: 'var(--font-heading)', fontWeight: 900 }}>
                SmartSaver
            </h1>

            <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                Trial tracking and perk discovery via AI assistant.
            </p>

            {/* CTA */}
            <button
                onClick={onStart}
                className="btn-primary px-12 py-6 text-2xl flex items-center gap-4 rounded-[2rem]"
            >
                <Sparkles size={24} />
                Start Saving
                <ArrowRight size={24} />
            </button>
        </div>
    );
}
