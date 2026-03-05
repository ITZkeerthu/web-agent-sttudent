import React from 'react';
import { X, ArrowRight, Sparkles } from 'lucide-react';

/**
 * Comparison modal — Liquid Glass + custom typography.
 */
export default function ComparisonModal({ isOpen, onClose, suggestion, onAccept, onArchive }) {
    if (!isOpen || !suggestion) return null;

    const current = suggestion.currentOffer;
    const better = suggestion.betterOffer;
    if (!current || !better) return null;

    const Row = ({ label, currentVal, betterVal, isImproved }) => (
        <div className="grid grid-cols-3 py-4 items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</div>
            <div className="text-sm px-2" style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--text-secondary)' }}>{currentVal}</div>
            <div className="text-sm px-2" style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: isImproved ? 'var(--clr-green)' : 'var(--text-primary)' }}>{betterVal}</div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 backdrop-blur-xl" style={{ background: 'rgba(11,15,26,0.6)' }} onClick={onClose} />

            <div className="glass-modal gradient-border relative w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 relative" style={{ background: 'var(--grad-purple)' }}>
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full transition-colors"
                        style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}><X size={20} /></button>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="badge-info px-3 py-1 rounded-full text-[10px] uppercase tracking-widest"
                            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>Upgrade Recommendation</div>
                        <div className="flex items-center gap-1 text-sm" style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--clr-lime)' }}>
                            <Sparkles size={16} /> {suggestion.score}/100
                        </div>
                    </div>
                    <h2 className="text-3xl text-white" style={{ fontFamily: 'var(--font-heading)', fontWeight: 900 }}>Better Alternative Found</h2>
                    <p className="mt-2" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)' }}>
                        Switching to {better.provider} could save you significant overhead.
                    </p>
                </div>

                <div className="p-8" style={{ background: 'var(--bg-surface)' }}>
                    <div className="grid grid-cols-3 mb-4 pb-2" style={{ borderBottom: '2px solid rgba(255,255,255,0.05)' }}>
                        <div className="text-[10px] uppercase" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-muted)' }}>Feature</div>
                        <div className="text-[10px] uppercase" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--clr-coral)' }}>{current.provider}</div>
                        <div className="text-[10px] uppercase" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--clr-cyan)' }}>{better.provider}</div>
                    </div>

                    <div className="max-h-[40vh] overflow-y-auto pr-2 glass-scroll">
                        <Row label="Credits / Value" currentVal={current.value} betterVal={better.value} isImproved />
                        <Row label="Trial Duration" currentVal={current.duration} betterVal={better.duration} isImproved />
                        <Row label="Risk Level" currentVal={current.risk} betterVal={better.risk} isImproved={better.risk === 'Low'} />
                        <Row label="Auto-Renew" currentVal={current.autoRenew} betterVal={better.autoRenew} isImproved={better.autoRenew === 'No'} />
                        <Row label="Cancel Ease" currentVal={current.cancelEase} betterVal={better.cancelEase} isImproved />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-10">
                        <button onClick={() => onAccept(suggestion.id)}
                            className="btn-cyan py-4 rounded-2xl flex items-center justify-center gap-2 text-sm">
                            Switch to {better.provider} <ArrowRight size={18} />
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => onArchive(suggestion.id)} className="btn-ghost py-4 text-xs rounded-2xl">Keep Current</button>
                            <button onClick={() => onAccept(suggestion.id)} className="btn-secondary py-4 text-xs rounded-2xl" style={{ color: 'var(--clr-cyan)' }}>Track Both</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
