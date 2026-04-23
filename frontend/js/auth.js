/**
 * auth.js — SchemeChecker Frontend Authentication System
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure Vanilla JS | No backend | No libraries | Works directly in the browser.
 *
 * localStorage Keys:
 *   "sc_users"      → JSON array of all registered user objects
 *   "sc_session"    → JSON object of the currently logged-in user
 *   "sc_bm_<email>" → JSON array of bookmarked scheme IDs per user
 *
 * Global API (available on window):
 *   window.isLoggedIn()          → boolean
 *   window.getCurrentUser()      → { name, email } | null
 *   window.requireAuth()         → redirects to login.html if not logged in
 *   window.handleSignup(n,e,p)   → { success, message }
 *   window.handleLogin(e,p)      → { success, message, user? }
 *   window.logout()              → clears session, redirects to login.html
 *   window.getSavedSchemes()     → string[] of bookmarked scheme IDs
 *   window.toggleSave(schemeId)  → add/remove bookmark for current user
 *   window.isSaved(schemeId)     → boolean
 */

(function () {
    'use strict';

    // ── Storage Keys ───────────────────────────────────────────────────────────
    const USERS_KEY   = 'sc_users';
    const SESSION_KEY = 'sc_session';
    const BM_PREFIX   = 'sc_bm_';

    // ── Storage Helpers ────────────────────────────────────────────────────────

    /** Retrieve all registered users */
    function getUsers() {
        try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
        catch (_) { return []; }
    }

    /** Persist users array */
    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    /** Retrieve active session or null */
    function getSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
        catch (_) { return null; }
    }

    /** Persist active session */
    function saveSession(user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            name: user.name,
            email: user.email
        }));
    }

    // ── Validation ─────────────────────────────────────────────────────────────

    /** True if email format looks valid */
    function isValidEmail(email) {
        return /^\S+@\S+\.\S+$/.test(email);
    }

    /**
     * A small deterministic hash — not cryptographic, only used so we
     * aren't storing plaintext passwords. (For a real app, use bcrypt on a server.)
     */
    function hashPassword(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
        }
        return 'h_' + Math.abs(h).toString(36) + '_' + str.length;
    }

    // ── Auth State ─────────────────────────────────────────────────────────────

    /** Returns true if a user session exists */
    window.isLoggedIn = function () {
        return getSession() !== null;
    };

    /** Returns the current user { name, email } or null */
    window.getCurrentUser = function () {
        return getSession();
    };

    /**
     * Redirect to login.html if the user is NOT logged in.
     * Call this at the top of any protected page:
     *   window.requireAuth();
     */
    window.requireAuth = function () {
        if (!getSession()) {
            window.location.replace('login.html');
        }
    };

    // ── Signup ─────────────────────────────────────────────────────────────────

    /**
     * Register a new user.
     * @param {string} name
     * @param {string} email
     * @param {string} password
     * @returns {{ success: boolean, message: string }}
     */
    window.handleSignup = function (name, email, password) {
        // Validate inputs
        if (!name.trim()) {
            return { success: false, message: 'Full name is required.' };
        }
        if (!email.trim() || !isValidEmail(email)) {
            return { success: false, message: 'Please enter a valid email address.' };
        }
        if (!password || password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters.' };
        }

        const users = getUsers();
        const normalizedEmail = email.trim().toLowerCase();

        // Prevent duplicate account
        if (users.some(u => u.email === normalizedEmail)) {
            return { success: false, message: 'An account with this email already exists.' };
        }

        // Save new user
        const newUser = {
            name: name.trim(),
            email: normalizedEmail,
            passwordHash: hashPassword(password),
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers(users);

        return { success: true, message: 'Account created successfully.' };
    };

    // ── Login ──────────────────────────────────────────────────────────────────

    /**
     * Authenticate a user and create a session.
     * @param {string} email
     * @param {string} password
     * @returns {{ success: boolean, message: string, user?: object }}
     */
    window.handleLogin = function (email, password) {
        if (!email.trim() || !password) {
            return { success: false, message: 'Please enter your email and password.' };
        }

        if (!isValidEmail(email)) {
            return { success: false, message: 'Please enter a valid email address.' };
        }

        const normalizedEmail = email.trim().toLowerCase();
        const users = getUsers();
        const user  = users.find(u => u.email === normalizedEmail);

        // Check user exists and password matches
        if (!user || user.passwordHash !== hashPassword(password)) {
            return { success: false, message: 'Invalid email or password. Please try again.' };
        }

        // Store session
        saveSession(user);

        return { success: true, message: 'Login successful.', user };
    };

    // ── Logout ─────────────────────────────────────────────────────────────────

    /** Clear the session and redirect to login */
    window.logout = function () {
        localStorage.removeItem(SESSION_KEY);
        window.location.replace('login.html');
    };

    // ── Bookmark System (user-specific) ───────────────────────────────────────

    /** Get the bookmark storage key for the logged-in user */
    function bookmarkKey() {
        const s = getSession();
        return s ? BM_PREFIX + s.email : null;
    }

    /**
     * Get all bookmarked scheme IDs for the current user.
     * Returns [] if not logged in.
     */
    window.getSavedSchemes = function () {
        const key = bookmarkKey();
        if (!key) return [];
        try { return JSON.parse(localStorage.getItem(key) || '[]'); }
        catch (_) { return []; }
    };

    /** Returns true if the given schemeId is bookmarked by the current user */
    window.isSaved = function (schemeId) {
        return window.getSavedSchemes().includes(schemeId);
    };

    /**
     * Toggle bookmark for a scheme.
     * Prompts login if user is not authenticated.
     */
    window.toggleSave = function (schemeId) {
        if (!window.isLoggedIn()) {
            if (confirm('You need to be logged in to save schemes.\nGo to Login page?')) {
                window.location.href = 'login.html';
            }
            return;
        }

        const key    = bookmarkKey();
        const saved  = window.getSavedSchemes();
        const idx    = saved.indexOf(schemeId);
        const adding = idx === -1;

        if (adding) { saved.push(schemeId); }
        else        { saved.splice(idx, 1); }

        localStorage.setItem(key, JSON.stringify(saved));

        // Update all bookmark icon buttons for this scheme on the page
        document.querySelectorAll(`.icon-btn[onclick*="toggleSave('${schemeId}')"]`).forEach(btn => {
            btn.classList.toggle('saved', adding);
        });

        _showToast(adding ? '✅ Scheme saved to bookmarks!' : '🗑️ Bookmark removed');
    };

    // ── Toast ──────────────────────────────────────────────────────────────────

    /** Show a brief non-blocking notification */
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
        // Animate in
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

    // ── Navbar: Inject User Chip ───────────────────────────────────────────────

    /** After DOM is ready, inject login state into the site header */
    function _updateNavbar() {
        const header   = document.querySelector('.umang-header');
        const controls = header && header.querySelector('.header-controls');
        if (!controls) return;

        // Remove any stale chip/link we injected previously
        ['_sc_user_chip', '_sc_login_link'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        const session = getSession();

        if (session) {
            // ── User avatar chip ───────────────────────────────────────────────
            const chip = document.createElement('div');
            chip.id = '_sc_user_chip';
            chip.style.cssText = `
                display:flex; align-items:center; gap:0.5rem;
                background:#f1f5f9; border:1px solid #e2e8f0;
                border-radius:999px; padding:0.3rem 0.9rem 0.3rem 0.4rem;
                font-family:Inter,sans-serif; font-size:0.875rem; font-weight:600;
                color:#1e293b;
            `;
            chip.innerHTML = `
                <span style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#1d4ed8,#7c3aed);
                    color:#fff;display:flex;align-items:center;justify-content:center;
                    font-size:0.75rem;font-weight:800;flex-shrink:0;">
                    ${session.name.charAt(0).toUpperCase()}
                </span>
                <span>${session.name.split(' ')[0]}</span>
                <button id="_sc_logout_btn" title="Logout"
                    style="background:none;border:none;cursor:pointer;color:#94a3b8;
                    font-size:0.8rem;padding:0;margin-left:2px;line-height:1;">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            `;
            
            // Allow clicking the chip (except logout button) to go to dashboard
            chip.style.cursor = 'pointer';
            chip.addEventListener('click', (e) => {
                if (e.target.closest('#_sc_logout_btn')) return;
                window.location.href = 'dashboard.html';
            });

            controls.insertBefore(chip, controls.firstChild);

            document.getElementById('_sc_logout_btn').addEventListener('click', function (e) {
                e.stopPropagation();
                window.logout();
            });

        } else {
            // ── Login link ─────────────────────────────────────────────────────
            // Don't show on auth pages themselves
            const page = window.location.pathname.split('/').pop() || 'index.html';
            if (!['login.html', 'signup.html', 'auth.html'].includes(page)) {
                const link = document.createElement('a');
                link.id = '_sc_login_link';
                link.href = 'login.html';
                link.style.cssText = `
                    color:#1d4ed8;font-weight:600;text-decoration:none;
                    font-size:0.875rem;font-family:Inter,sans-serif;
                    display:flex;align-items:center;gap:0.35rem;
                `;
                link.innerHTML = '<i class="fas fa-user"></i>Login';
                controls.insertBefore(link, controls.firstChild);
            }
        }
    }

    // ── Page Guards ────────────────────────────────────────────────────────────

    /** Auto-redirect saved.html if not logged in */
    function _guardSavedPage() {
        const page = window.location.pathname.split('/').pop() || '';
        if (page === 'saved.html' && !getSession()) {
            window.location.replace('login.html');
        }
    }

    // ── Init ───────────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        _updateNavbar();
        _guardSavedPage();
    });

})();
