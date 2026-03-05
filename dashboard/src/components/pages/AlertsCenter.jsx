import React from 'react';
import { Bell, Sparkles } from 'lucide-react';

/**
 * Alerts center — Liquid Glass + custom typography.
 */
export default function AlertsCenter({ suggestions, onViewUpgrade }) {
    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto text-left">
            <h2 className="text-3xl mb-6 text-gradient-primary" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                Alerts Center
            </h2>

            <div className="space-y-4">
                {suggestions.map((s) => {
                    const current = s.currentOffer;
                    const better = s.betterOffer;
                    if (!current || !better) return null;

                    return (
                        <div key={s.id} className="glass-card gradient-border p-6 flex gap-5 items-start hover-glow-purple">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                                style={{ background: 'rgba(126, 87, 194, 0.15)', color: 'var(--clr-lavender)' }}>
                                <Sparkles size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="badge-purple text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
                                        style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                                        Upgrade Recommendation
                                    </span>
                                    <span className="text-[10px] uppercase" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>JUST NOW</span>
                                </div>
                                <h3 className="text-lg" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    Better Alternative Found for {current.provider}
                                </h3>
                                <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                                    Switching to {better.provider} increases your score by
                                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--clr-cyan)' }}> {s.score} </span>
                                    points.
                                </p>
                                <button onClick={() => onViewUpgrade(s)} className="btn-accent px-6 py-2.5 text-xs rounded-xl">
                                    View Comparison
                                </button>
                            </div>
                        </div>
                    );
                })}

                {suggestions.length === 0 && (
                    <div className="glass-card p-12 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                        No upgrade recommendations right now. Track more offers to get suggestions.
                    </div>
                )}

                <div className="glass-card p-6 flex gap-4" style={{ borderColor: 'rgba(255, 142, 97, 0.2)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm shrink-0"
                        style={{ background: 'rgba(255, 142, 97, 0.12)', color: 'var(--clr-coral)' }}>
                        <Bell />
                    </div>
                    <div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--clr-coral)' }}>Price Watch Active</div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                            We'll alert you when tracked offers change pricing or availability.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
