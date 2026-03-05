import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { apiUpdateProfile } from '../../api/client';

/**
 * Profile & Settings — Liquid Glass + custom typography.
 */
export default function ProfileSettings({ userEmail, profile }) {
    const [country, setCountry] = useState(profile.country || 'US');
    const [role, setRole] = useState(profile.role || 'Student');
    const [field, setField] = useState(profile.field || 'CS');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiUpdateProfile({ country, role, field });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save profile:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto text-left">
            <h2 className="text-2xl mb-6 text-gradient-cyan" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                Profile &amp; Settings
            </h2>

            <div className="space-y-6">
                <div className="glass-card gradient-border flex items-center gap-4 p-6">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl uppercase hover-glow-pink"
                        style={{ background: 'var(--grad-primary)', color: 'var(--clr-white)', fontFamily: 'var(--font-heading)', fontWeight: 900 }}>
                        {userEmail ? userEmail[0] : 'U'}
                    </div>
                    <div>
                        <div className="text-2xl" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)' }}>User Account</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--clr-cyan)' }}>{userEmail || 'user@example.com'}</div>
                    </div>
                </div>

                <div className="glass-card p-8">
                    <h3 className="pb-4 mb-4" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--clr-glass-edge-2)' }}>
                        Verification Info
                    </h3>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                        <div>
                            <label className="block uppercase text-[10px] mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>Region</label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="glass-input w-full p-3"
                            />
                        </div>
                        <div>
                            <label className="block uppercase text-[10px] mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>Identity</label>
                            <input
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="glass-input w-full p-3"
                            />
                        </div>
                        <div>
                            <label className="block uppercase text-[10px] mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>Field</label>
                            <input
                                type="text"
                                value={field}
                                onChange={(e) => setField(e.target.value)}
                                className="glass-input w-full p-3"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary mt-6 px-8 py-3 flex items-center gap-2"
                    >
                        {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
