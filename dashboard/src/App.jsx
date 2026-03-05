import React, { useState, useEffect } from 'react';
import { MessageSquare, Lightbulb, CreditCard, Bell } from 'lucide-react';

import LandingPage from './components/pages/LandingPage';
import AuthPage from './components/pages/AuthPage';
import Dashboard from './components/pages/Dashboard';
import {
    getStoredUser,
    clearAuth,
    apiGetTracking,
    apiTrackOffer,
    apiUntrackOffer,
    apiGetSuggestions,
} from './api/client';

/**
 * Root application — Liquid Glass theme.
 */
export default function App() {
    const [screen, setScreen] = useState('landing');
    const [activeTab, setActiveTab] = useState('chat');
    const [trackedItems, setTrackedItems] = useState([]);
    const [offers, setOffers] = useState([]);

    const [email, setEmail] = useState('');
    const [onboardingData, setOnboardingData] = useState({
        country: 'US',
        role: 'Student',
        field: 'CS',
        interests: ['AI', 'Cloud'],
    });

    const [suggestions, setSuggestions] = useState([]);

    // Check for existing session on mount
    useEffect(() => {
        const user = getStoredUser();
        if (user) {
            setEmail(user.email);
            setOnboardingData({
                country: user.country || 'US',
                role: user.role || 'Student',
                field: user.field || 'CS',
                interests: user.interests || ['AI', 'Cloud'],
            });
            setScreen('dashboard');
            loadUserData();
        }
    }, []);

    // Listen for auth expiration
    useEffect(() => {
        const handleExpired = () => {
            clearAuth();
            setScreen('auth');
        };
        window.addEventListener('auth:expired', handleExpired);
        return () => window.removeEventListener('auth:expired', handleExpired);
    }, []);

    useEffect(() => {
        const handleTabChange = (e) => setActiveTab(e.detail);
        window.addEventListener('changeTab', handleTabChange);
        return () => window.removeEventListener('changeTab', handleTabChange);
    }, []);

    // Load tracked items and suggestions from backend
    async function loadUserData() {
        try {
            const [trackingData, suggestionsData] = await Promise.all([
                apiGetTracking().catch(() => ({ trackedIds: [], offers: [] })),
                apiGetSuggestions().catch(() => ({ suggestions: [] })),
            ]);
            setTrackedItems(trackingData.trackedIds || []);
            setOffers(trackingData.offers || []);
            setSuggestions(suggestionsData.suggestions || []);
        } catch (err) {
            console.error('Failed to load user data:', err);
        }
    }

    const handleLoginSuccess = (userData) => {
        setEmail(userData.email);
        setOnboardingData({
            country: userData.country || 'US',
            role: userData.role || 'Student',
            field: userData.field || 'CS',
            interests: userData.interests || ['AI', 'Cloud'],
        });
        setScreen('dashboard');
        loadUserData();
    };

    const toggleTrack = async (id) => {
        const isTracked = trackedItems.includes(id);
        try {
            if (isTracked) {
                await apiUntrackOffer(id);
                setTrackedItems((prev) => prev.filter((i) => i !== id));
            } else {
                await apiTrackOffer(id);
                setTrackedItems((prev) => [...prev, id]);
            }
        } catch (err) {
            console.error('Track/untrack failed:', err);
            // Fallback: toggle locally
            setTrackedItems((prev) =>
                prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
            );
        }
    };

    const handleUpgradeAction = (id, status) => {
        setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    };

    const handleLogout = () => {
        clearAuth();
        setEmail('');
        setTrackedItems([]);
        setSuggestions([]);
        setScreen('landing');
    };

    const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');

    const navItems = [
        { id: 'chat', label: 'Assistant', icon: MessageSquare },
        { id: 'opps', label: 'Explore', icon: Lightbulb },
        { id: 'subs', label: 'Tracker', icon: CreditCard },
        { id: 'alerts', label: 'Alerts', icon: Bell, badge: pendingSuggestions.length },
    ];

    const renderScreen = () => {
        switch (screen) {
            case 'landing':
                return <LandingPage onStart={() => setScreen('auth')} />;
            case 'auth':
                return <AuthPage onLoginSuccess={handleLoginSuccess} />;
            case 'dashboard':
                return (
                    <Dashboard
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        navItems={navItems}
                        trackedItems={trackedItems}
                        toggleTrack={toggleTrack}
                        email={email}
                        onboardingData={onboardingData}
                        suggestions={suggestions}
                        handleUpgradeAction={handleUpgradeAction}
                        onLogout={handleLogout}
                    />
                );
            default:
                return <div>Error</div>;
        }
    };

    return (
        <div className="antialiased font-sans selection:bg-indigo-100/20" style={{ color: 'var(--text-primary)' }}>
            {renderScreen()}
        </div>
    );
}
