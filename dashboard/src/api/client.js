const API_BASE = 'http://localhost:3001/api';

/**
 * Get stored auth token.
 */
function getToken() {
    return localStorage.getItem('smartsaver_token');
}

/**
 * Set auth token.
 */
export function setToken(token) {
    if (token) {
        localStorage.setItem('smartsaver_token', token);
    } else {
        localStorage.removeItem('smartsaver_token');
    }
}

/**
 * Get stored user data.
 */
export function getStoredUser() {
    const raw = localStorage.getItem('smartsaver_user');
    return raw ? JSON.parse(raw) : null;
}

/**
 * Set stored user data.
 */
export function setStoredUser(user) {
    if (user) {
        localStorage.setItem('smartsaver_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('smartsaver_user');
    }
}

/**
 * Clear all auth data (logout).
 */
export function clearAuth() {
    localStorage.removeItem('smartsaver_token');
    localStorage.removeItem('smartsaver_user');
}

/**
 * Make an authenticated API request.
 */
async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        clearAuth();
        window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.error || `API error: ${res.status}`);
    }

    return data;
}

// ── Auth ────────────────────────────────────────────────────

export async function apiRegister(email, password, profile = {}) {
    const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, ...profile }),
    });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
}

export async function apiLogin(email, password) {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
}

export async function apiGetSession() {
    return apiFetch('/auth/session');
}

export function apiLogout() {
    clearAuth();
}

// ── Offers ──────────────────────────────────────────────────

export async function apiGetOffers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.risk) query.set('risk', params.risk);
    if (params.limit) query.set('limit', params.limit);
    if (params.offset) query.set('offset', params.offset);

    const qs = query.toString();
    return apiFetch(`/offers${qs ? `?${qs}` : ''}`);
}

export async function apiSearchOffers(q) {
    return apiFetch(`/offers/search?q=${encodeURIComponent(q)}`);
}

export async function apiGetOffer(id) {
    return apiFetch(`/offers/${id}`);
}

// ── Tracking ────────────────────────────────────────────────

export async function apiGetTracking() {
    return apiFetch('/tracking');
}

export async function apiTrackOffer(offerId) {
    return apiFetch(`/tracking/${offerId}`, { method: 'POST' });
}

export async function apiUntrackOffer(offerId) {
    return apiFetch(`/tracking/${offerId}`, { method: 'DELETE' });
}

// ── Chat ────────────────────────────────────────────────────

export async function apiSendChat(message) {
    return apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

export async function apiGetChatHistory(limit = 50) {
    return apiFetch(`/chat/history?limit=${limit}`);
}

export async function apiClearChat() {
    return apiFetch('/chat/history', { method: 'DELETE' });
}

// ── Profile ─────────────────────────────────────────────────

export async function apiGetProfile() {
    return apiFetch('/profile');
}

export async function apiUpdateProfile(updates) {
    return apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

// ── Suggestions ─────────────────────────────────────────────

export async function apiGetSuggestions() {
    return apiFetch('/suggestions');
}

// ── Stats ───────────────────────────────────────────────────

export async function apiGetStats() {
    return apiFetch('/stats');
}

// ── Health ──────────────────────────────────────────────────

export async function apiHealthCheck() {
    return apiFetch('/health');
}
