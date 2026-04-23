/**
 * auth.js — SchemeChecker Frontend Authentication System (Production Ready)
 * ─────────────────────────────────────────────────────────────────────────────
 * Connects to the Backend API on Render.
 */

(function () {
    'use strict';

    // ── Configuration ──────────────────────────────────────────────────────────
    const API_BASE = 'https://schemechecker.onrender.com/api';
    const SESSION_KEY = 'sc_session';
    const TOKEN_KEY = 'sc_token';

    // ── Storage Helpers ────────────────────────────────────────────────────────

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function saveSession(user, token) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        localStorage.setItem(TOKEN_KEY, token);
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
    }

    // ── Auth State ─────────────────────────────────────────────────────────────

    window.isLoggedIn = function () {
        return getToken() !== null;
    };

    window.getCurrentUser = function () {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
        catch { return null; }
    };

    window.requireAuth = function () {
        if (!window.isLoggedIn()) {
            window.location.replace('login.html');
        }
    };

    // ── Signup ─────────────────────────────────────────────────────────────────

    window.handleSignup = async function (name, email, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                return { success: true, message: 'Account created! Please login.' };
            } else {
                return { success: false, message: data.message || 'Signup failed.' };
            }
        } catch (error) {
            return { success: false, message: 'Server unreachable. Try again later.' };
        }
    };

    // ── Login ──────────────────────────────────────────────────────────────────

    window.handleLogin = async function (email, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                saveSession(data.user, data.token);
                return { success: true, message: 'Login successful!', user: data.user };
            } else {
                return { success: false, message: data.message || 'Invalid credentials.' };
            }
        } catch (error) {
            return { success: false, message: 'Server unreachable. Try again later.' };
        }
    };

    // ── Logout ─────────────────────────────────────────────────────────────────

    window.logout = function () {
        clearSession();
        window.location.replace('login.html');
    };

    // ── Bookmarks ──────────────────────────────────────────────────────────────

    window.getSavedSchemes = async function () {
        if (!window.isLoggedIn()) return [];
        try {
            const response = await fetch(`${API_BASE}/bookmark/list`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();
            return data.bookmarks || [];
        } catch (error) {
            console.error('Failed to fetch bookmarks');
            return [];
        }
    };

    window.toggleSave = async function (schemeId) {
        if (!window.isLoggedIn()) {
            if (confirm('Login required to save schemes. Go to Login?')) {
                window.location.href = 'login.html';
            }
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/bookmark/toggle`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ schemeId })
            });

            const data = await response.json();
            _showToast(data.message);
            
            // Update UI icons if necessary
            document.querySelectorAll(`.btn-save[data-id="${schemeId}"]`).forEach(btn => {
                btn.classList.toggle('active', data.status === 'added');
            });
            
            return data;
        } catch (error) {
            _showToast('❌ Failed to save bookmark');
        }
    };

    // ── UI Components ──────────────────────────────────────────────────────────

    function _showToast(msg) {
        let toast = document.getElementById('_sc_toast');
        if (!toast) {
            toast = Object.assign(document.createElement('div'), { id: '_sc_toast' });
            Object.assign(toast.style, {
                position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: '99999',
                background: '#1e293b', color: '#fff', padding: '0.7rem 1.2rem',
                borderRadius: '12px', fontSize: '0.875rem', fontWeight: '600',
                fontFamily: 'Inter, sans-serif', boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                transition: 'opacity 0.35s, transform 0.35s', pointerEvents: 'none',
                transform: 'translateY(10px)', opacity: '0'
            });
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        clearTimeout(toast._t);
        toast._t = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
        }, 2800);
    }

    function _updateNavbar() {
        const header = document.querySelector('.umang-header');
        const controls = header && header.querySelector('.header-controls');
        if (!controls) return;

        ['_sc_user_chip', '_sc_login_link'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        const user = window.getCurrentUser();

        if (user) {
            const chip = document.createElement('div');
            chip.id = '_sc_user_chip';
            chip.style.cssText = `display:flex;align-items:center;gap:0.5rem;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:999px;padding:0.3rem 0.9rem;font-weight:600;color:#1e293b;cursor:pointer;`;
            chip.innerHTML = `
                <span style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#1d4ed8,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.7rem;">${user.name.charAt(0)}</span>
                <span>${user.name.split(' ')[0]}</span>
                <i class="fas fa-sign-out-alt" id="_sc_logout_btn" style="margin-left:5px;opacity:0.5;"></i>
            `;
            chip.onclick = (e) => {
                if (e.target.id === '_sc_logout_btn') window.logout();
                else window.location.href = 'dashboard.html';
            };
            controls.insertBefore(chip, controls.firstChild);
        } else {
            const page = window.location.pathname.split('/').pop() || 'index.html';
            if (!['login.html', 'signup.html'].includes(page)) {
                const link = document.createElement('a');
                link.id = '_sc_login_link';
                link.href = 'login.html';
                link.style.cssText = `color:#1d4ed8;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:0.4rem;`;
                link.innerHTML = '<i class="fas fa-user-circle"></i> Login';
                controls.insertBefore(link, controls.firstChild);
            }
        }
    }

    document.addEventListener('DOMContentLoaded', _updateNavbar);

})();
