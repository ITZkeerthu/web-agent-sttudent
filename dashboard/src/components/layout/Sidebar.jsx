import React from 'react';

/**
 * Desktop sidebar — Liquid Glass theme with custom typography.
 */
export default function Sidebar({ activeTab, setActiveTab, navItems }) {
    return (
        <aside className="hidden lg:flex flex-col w-64 glass-sidebar p-8 shrink-0">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center hover-glow-cyan gradient-border" style={{ background: 'var(--bg-glass-strong)' }}>
                    <span className="text-gradient-rainbow" style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.25rem' }}>S</span>
                </div>
                <span className="text-2xl tracking-tight" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)' }}>
                    SmartSaver
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`relative w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-sm ${activeTab === item.id ? 'nav-item-active' : 'nav-item'
                            }`}
                        style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
                    >
                        <item.icon size={20} />
                        {item.label}
                        {item.badge > 0 && (
                            <span className="absolute top-2 right-2 w-5 h-5 badge-glow text-[10px] rounded-full flex items-center justify-center"
                                style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                                {item.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
        </aside>
    );
}
