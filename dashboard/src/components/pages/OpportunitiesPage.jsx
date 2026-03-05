import React, { useState, useEffect } from 'react';
import { Search, Zap, Loader2 } from 'lucide-react';
import { apiGetOffers } from '../../api/client';

/**
 * Opportunities page — Liquid Glass + custom typography.
 */
export default function OpportunitiesPage({ trackedItems, toggleTrack }) {
    const [search, setSearch] = useState('');
    const [filterRisk, setFilterRisk] = useState('All');
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOffers();
    }, [search, filterRisk]);

    async function loadOffers() {
        setLoading(true);
        try {
            const data = await apiGetOffers({
                search: search || undefined,
                risk: filterRisk !== 'All' ? filterRisk : undefined,
            });
            setOffers(data.offers || []);
        } catch (err) {
            console.error('Failed to load offers:', err);
        } finally {
            setLoading(false);
        }
    }

    // Debounce search
    const [searchTimeout, setSearchTimeout] = useState(null);
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => loadOffers(), 300));
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto text-left">
            <header className="mb-10 text-left">
                <h1 className="text-3xl mb-2 text-gradient-cyan" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}>Opportunities</h1>
                <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Verified student perks and credits.</p>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-10">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={20} style={{ color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search..." value={search} onChange={handleSearchChange} className="glass-input w-full pl-12 p-4" />
                </div>
                <div className="flex gap-2">
                    {['All', 'Low', 'Medium', 'High'].map((risk) => (
                        <button key={risk} onClick={() => setFilterRisk(risk)}
                            className={`px-6 py-4 rounded-2xl text-sm transition-all ${filterRisk === risk ? 'btn-cyan' : 'btn-secondary'}`}>
                            {risk}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin" size={32} style={{ color: 'var(--clr-cyan)' }} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offers.length === 0 ? (
                        <div className="col-span-full text-center py-12" style={{ color: 'var(--text-muted)' }}>
                            No offers found. Try a different search.
                        </div>
                    ) : (
                        offers.map((opp) => (
                            <div key={opp.id} className="glass-card gradient-border p-6 flex flex-col">
                                <div className="flex justify-between mb-6">
                                    <Zap style={{ color: 'var(--clr-cyan)' }} />
                                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full ${opp.risk === 'Low' ? 'badge-low' : opp.risk === 'Medium' ? 'badge-medium' : 'badge-high'
                                        }`} style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{opp.risk}</span>
                                </div>
                                <h3 className="text-xl mb-1" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)' }}>{opp.provider}</h3>
                                <p className="text-sm mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{opp.category}</p>
                                <p className="text-sm mb-4" style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--clr-cyan)' }}>{opp.value}</p>
                                <button onClick={() => toggleTrack(opp.id)}
                                    className={`mt-auto py-3 rounded-xl ${trackedItems.includes(opp.id) ? 'btn-tracked' : 'btn-primary'}`}>
                                    {trackedItems.includes(opp.id) ? '✓ Tracked' : 'Track'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
