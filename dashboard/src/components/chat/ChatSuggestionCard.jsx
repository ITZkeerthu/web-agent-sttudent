import React from 'react';
import {
    Zap, ExternalLink, Plus, CheckCircle2,
} from 'lucide-react';

/**
 * Chat suggestion card — Liquid Glass + custom typography.
 * Receives a full offer object from the chat API response.
 */
export default function ChatSuggestionCard({ offer, trackedItems, toggleTrack }) {
    if (!offer) return null;
    const isTracked = trackedItems.includes(offer.id);

    return (
        <div className="glass-card gradient-border p-5 w-full sm:w-[280px] md:w-[320px] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-xl" style={{ background: 'rgba(0, 242, 255, 0.1)', color: 'var(--clr-cyan)' }}><Zap size={18} /></div>
                <div className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${offer.risk === 'Low' ? 'badge-low' : offer.risk === 'Medium' ? 'badge-medium' : 'badge-high'
                    }`} style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{offer.risk} Risk</div>
            </div>

            <div className="mb-4 text-left">
                <h3 className="text-base leading-tight truncate" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)' }}>{offer.provider}</h3>
                <p className="text-[10px] uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--text-muted)' }}>{offer.category}</p>
            </div>

            <div className="space-y-2 mb-4 text-left">
                <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Value</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--clr-cyan)' }}>{offer.value}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Duration</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--text-primary)' }}>{offer.duration}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <a href={offer.link} target="_blank" rel="noreferrer" className="btn-ghost flex items-center justify-center gap-1.5 py-2.5 text-[10px]">Link <ExternalLink size={10} /></a>
                <button onClick={() => toggleTrack(offer.id)} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-[1.5rem] text-[10px] transition-all ${isTracked ? 'btn-tracked' : 'btn-cyan'}`}>
                    {isTracked ? <CheckCircle2 size={12} /> : <><Plus size={12} /> Track</>}
                </button>
            </div>
        </div>
    );
}
