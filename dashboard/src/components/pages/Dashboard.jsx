import React, { useState } from 'react';
import { Menu, ArrowRight, X, Sparkles, LogOut } from 'lucide-react';

import Sidebar from '../layout/Sidebar';
import MobileMenu from '../layout/MobileMenu';
import ChatInterface from '../chat/ChatInterface';
import OpportunitiesPage from './OpportunitiesPage';
import SubscriptionTracker from './SubscriptionTracker';
import AlertsCenter from './AlertsCenter';
import ProfileSettings from './ProfileSettings';
import ComparisonModal from '../modals/ComparisonModal';

/**
 * Dashboard shell — Liquid Glass theme.
 */
export default function Dashboard({
    activeTab,
    setActiveTab,
    navItems,
    trackedItems,
    toggleTrack,
    email,
    onboardingData,
    suggestions,
    handleUpgradeAction,
    onLogout,
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedUpgrade, setSelectedUpgrade] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');

    return (
        <div className="flex h-screen overflow-hidden relative" style={{ background: 'var(--grad-mesh)' }}>
            {/* Desktop sidebar */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} navItems={navItems} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile header */}
                <header className="lg:hidden flex items-center justify-between p-4 shrink-0 glass-panel">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-gradient-rainbow"
                            style={{ background: 'var(--bg-glass-strong)' }}>S</div>
                        <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>SmartSaver</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {onLogout && (
                            <button onClick={onLogout} className="p-2" style={{ color: 'var(--text-muted)' }} title="Logout">
                                <LogOut size={20} />
                            </button>
                        )}
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2" style={{ color: 'var(--text-muted)' }}>
                            <Menu />
                        </button>
                    </div>
                </header>

                {/* Tab content */}
                <div className="flex-1 overflow-hidden relative">
                    {/* Chat tab with upgrade sidebar */}
                    {activeTab === 'chat' && (
                        <div className="flex h-full overflow-hidden">
                            <div className="flex-1 flex flex-col">
                                <ChatInterface profile={onboardingData} trackedItems={trackedItems} toggleTrack={toggleTrack} />
                            </div>

                            {/* Right sidebar */}
                            <aside className="w-80 p-6 hidden xl:block overflow-y-auto text-left glass-scroll glass-sidebar"
                                style={{ borderLeft: '1px solid var(--clr-glass-edge-2)' }}>
                                {pendingSuggestions.length > 0 && pendingSuggestions[0].currentOffer && pendingSuggestions[0].betterOffer && (
                                    <div className="mb-8 animate-in slide-in-from-right duration-500">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-black text-xs uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                                                Upgrade Opp
                                            </h3>
                                            <Sparkles size={16} style={{ color: 'var(--clr-lime)' }} />
                                        </div>

                                        <div className="glass-card gradient-border p-6 relative overflow-hidden glow-purple">
                                            <div className="absolute top-0 right-0 p-3">
                                                <div className="badge-low text-[9px] font-black uppercase px-2 py-0.5 rounded">Better Alternative</div>
                                            </div>

                                            <h4 className="font-black mb-2" style={{ color: 'var(--text-primary)' }}>Switch Plan?</h4>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                                                    {pendingSuggestions[0].currentOffer.provider}
                                                </span>
                                                <ArrowRight size={12} style={{ color: 'var(--clr-cyan)' }} />
                                                <span className="text-xs font-black" style={{ color: 'var(--clr-cyan)' }}>
                                                    {pendingSuggestions[0].betterOffer.provider}
                                                </span>
                                            </div>

                                            <ul className="space-y-2 mb-6">
                                                {[
                                                    `${pendingSuggestions[0].betterOffer.value} value`,
                                                    `Duration: ${pendingSuggestions[0].betterOffer.duration}`,
                                                    `Risk: ${pendingSuggestions[0].betterOffer.risk}`,
                                                ].map((text) => (
                                                    <li key={text} className="flex items-center gap-2 text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--clr-cyan)' }} /> {text}
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setSelectedUpgrade(pendingSuggestions[0]); setIsModalOpen(true); }}
                                                    className="btn-cyan flex-1 py-3 text-[10px] rounded-xl"
                                                >
                                                    View Comparison
                                                </button>
                                                <button
                                                    onClick={() => handleUpgradeAction(pendingSuggestions[0].id, 'dismissed')}
                                                    className="btn-ghost p-3 rounded-xl"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="font-black text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>Quick Stats</h3>
                                    <div className="glass-card p-4">
                                        <div className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Items Tracked</div>
                                        <div className="text-2xl font-black" style={{ color: 'var(--clr-cyan)' }}>{trackedItems.length}</div>
                                    </div>
                                </div>

                                {onLogout && (
                                    <div className="hidden lg:block">
                                        <button onClick={onLogout} className="btn-ghost w-full py-3 flex items-center justify-center gap-2 text-xs rounded-xl">
                                            <LogOut size={14} /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </aside>
                        </div>
                    )}

                    {activeTab === 'opps' && (
                        <div className="h-full overflow-y-auto glass-scroll">
                            <OpportunitiesPage trackedItems={trackedItems} toggleTrack={toggleTrack} />
                        </div>
                    )}
                    {activeTab === 'subs' && (
                        <div className="h-full overflow-y-auto glass-scroll">
                            <SubscriptionTracker trackedItems={trackedItems} toggleTrack={toggleTrack} />
                        </div>
                    )}
                    {activeTab === 'alerts' && (
                        <div className="h-full overflow-y-auto glass-scroll">
                            <AlertsCenter
                                suggestions={pendingSuggestions}
                                onViewUpgrade={(s) => { setSelectedUpgrade(s); setIsModalOpen(true); }}
                            />
                        </div>
                    )}
                    {activeTab === 'profile' && (
                        <div className="h-full overflow-y-auto glass-scroll">
                            <ProfileSettings userEmail={email} profile={onboardingData} />
                        </div>
                    )}
                </div>
            </div>

            {/* Comparison modal */}
            <ComparisonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                suggestion={selectedUpgrade}
                onAccept={() => handleUpgradeAction(selectedUpgrade?.id, 'accepted')}
                onArchive={() => handleUpgradeAction(selectedUpgrade?.id, 'archived')}
            />

            {/* Mobile menu */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                navItems={navItems}
            />
        </div>
    );
}
