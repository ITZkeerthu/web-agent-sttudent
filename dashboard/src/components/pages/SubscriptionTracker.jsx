import React, { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { apiGetTracking } from '../../api/client';

/**
 * Subscription tracker — Liquid Glass + custom typography.
 */
export default function SubscriptionTracker({ trackedItems, toggleTrack }) {
    const [trackedOffers, setTrackedOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTracked();
    }, [trackedItems]);

    async function loadTracked() {
        try {
            const { offers } = await apiGetTracking();
            setTrackedOffers(offers || []);
        } catch (err) {
            console.error('Failed to load tracked offers:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="p-6 md:p-10 max-w-7xl mx-auto flex items-center justify-center py-20">
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--clr-purple)' }} />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto text-left">
            <h1 className="text-3xl mb-10 text-gradient-purple" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                Subscription Tracker
            </h1>

            {trackedOffers.length === 0 ? (
                <div className="glass-card p-12 text-center" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                    No trials tracked yet. Head to the Assistant or Explore tab to start tracking.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {trackedOffers.map((opp) => (
                        <div key={opp.id} className="glass-card gradient-border p-8 flex flex-col">
                            <h3 className="text-2xl" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)' }}>{opp.provider}</h3>
                            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{opp.category}</p>
                            <div className="flex justify-between mt-4 text-sm">
                                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Value</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--clr-green)' }}>{opp.value}</span>
                            </div>
                            <div className="flex justify-between mt-2 text-sm">
                                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Duration</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--text-secondary)' }}>{opp.duration}</span>
                            </div>
                            <button onClick={() => toggleTrack(opp.id)}
                                className="btn-ghost mt-8 p-4 flex items-center justify-center gap-2 hover:!border-red-500/30 hover:!text-red-400">
                                <Trash2 size={18} /> Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
