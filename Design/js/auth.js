// auth.js — Authentication helpers (backed by PHP session API)

const AUTH_KEY = 'wala_session';

/**
 * Login via PHP backend. Returns true on success.
 */
async function authLogin(email, password) {
    try {
        const data = await ApiClient.login(email, password);
        if (data.success && data.user) {
            sessionStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
            return true;
        }
        return false;
    } catch (err) {
        console.error('[auth] Login failed:', err);
        return false;
    }
}

/**
 * Register a new user via PHP backend. Returns { success, error }.
 */
async function authRegister(name, email, password) {
    try {
        const data = await ApiClient.register(name, email, password);
        if (data.success && data.user) {
            sessionStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
            return { success: true };
        }
        return { success: false, error: data.error || 'Registration failed' };
    } catch (err) {
        return { success: false, error: 'Network error' };
    }
}

/**
 * Logout — clears PHP session and local session storage.
 */
async function authLogout() {
    try { await ApiClient.logout(); } catch (_) { /* ignore */ }
    sessionStorage.removeItem(AUTH_KEY);
    window.location.href = 'index.html';
}

/**
 * Returns the cached user object from sessionStorage, or null.
 */
function authGetUser() {
    const raw = sessionStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
}

/**
 * Guards a page — redirects to index.html if not logged in.
 * Also validates against the server session to catch expired sessions.
 */
function authGuard() {
    if (!authGetUser()) {
        window.location.href = 'index.html';
        return false;
    }
    // Async server-side check — redirect if PHP session expired
    ApiClient.checkSession().then(data => {
        if (!data.authenticated) {
            sessionStorage.removeItem(AUTH_KEY);
            window.location.href = 'index.html';
        } else {
            // Keep local cache in sync with server
            sessionStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
        }
    }).catch(() => { /* network offline — allow local session to stand */ });
    return true;
}
