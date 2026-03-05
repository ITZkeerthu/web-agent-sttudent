import React, { useState } from 'react';
import { apiLogin, apiRegister } from '../../api/client';

/**
 * Auth page — Liquid Glass theme with custom typography.
 */
export default function AuthPage({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let data;
            if (isRegister) {
                data = await apiRegister(email, password);
            } else {
                data = await apiLogin(email, password);
            }
            onLoginSuccess(data.user);
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ background: 'var(--clr-cyan)' }} />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-15" style={{ background: 'var(--clr-pink)' }} />

            <div className="glass-modal gradient-border w-full max-w-md p-10 relative z-10">
                <h2 className="text-4xl mb-8 text-center tracking-tight text-gradient-cyan"
                    style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                    {isRegister ? 'Create Account' : 'Login'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="glass-input w-full p-5 mb-4 text-center text-lg"
                        placeholder="Email"
                        required
                    />

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="glass-input w-full p-5 mb-6 text-center text-lg"
                        placeholder="Password"
                        required
                        minLength={6}
                    />

                    {error && (
                        <div className="mb-4 text-center text-sm" style={{ color: 'var(--clr-coral)' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-5 text-xl rounded-2xl disabled:opacity-50"
                    >
                        {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Continue'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setIsRegister(!isRegister); setError(''); }}
                        className="text-sm underline"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                    </button>
                </div>
            </div>
        </div>
    );
}
