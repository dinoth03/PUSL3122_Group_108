// auth.js — Authentication helpers

const AUTH_KEY = 'wala_session';

const DEMO_USERS = [
    { email: 'designer@designcompiler.com', password: 'Designer123!', name: 'Alex Designer' },
    { email: 'admin@designcompiler.com', password: 'Admin123!', name: 'Sam Admin' },
];

function authLogin(email, password) {
    const user = DEMO_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return false;
    sessionStorage.setItem(AUTH_KEY, JSON.stringify({ email: user.email, name: user.name }));
    return true;
}

function authLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.href = 'index.html';
}

function authGetUser() {
    const raw = sessionStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
}

function authGuard() {
    if (!authGetUser()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
