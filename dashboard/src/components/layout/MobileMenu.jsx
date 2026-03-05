import React from 'react';
import { X } from 'lucide-react';

/**
 * Mobile menu overlay — Liquid Glass theme with custom typography.
 */
export default function MobileMenu({ isOpen, onClose, activeTab, setActiveTab, navItems }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] lg:hidden animate-in fade-in duration-200">
            <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(11, 15, 26, 0.7)' }} onClick={onClose} />

            <div className="absolute top-0 right-0 bottom-0 w-[280px] glass-sidebar animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--clr-glass-edge-2)' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gradient-rainbow" style={{ background: 'var(--bg-glass-strong)', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>S</div>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)' }}>SmartSaver</span>
                    </div>
                    <button onClick={onClose} className="p-2" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>

                <nav className="p-6 flex-1 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); onClose(); }}
                            className={`relative w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${activeTab === item.id ? 'nav-item-active' : 'nav-item'
                                }`}
                            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
                        >
                            <item.icon size={20} />
                            {item.label}
                            {item.badge > 0 && (
                                <span className="absolute top-2 right-2 w-5 h-5 badge-glow text-[10px] rounded-full flex items-center justify-center"
                                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{item.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}
