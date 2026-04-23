/**
 * i18n.js — Translation Engine
 * Owns: loading translations.json, window.t(), window.translateUI()
 * Does NOT own: language-switcher events (handled by changeLanguage() in app.js)
 */
document.addEventListener('DOMContentLoaded', async () => {

    // Initialise current language from localStorage (set by app.js / changeLanguage)
    window.currentLang = localStorage.getItem('appLang') || 'en';
    window.translations = {};

    // Sync dropdown to current language (app.js may not have run yet)
    const langSwitcher = document.getElementById('language-switcher');
    if (langSwitcher) langSwitcher.value = window.currentLang;

    // Load the inverted translation dictionary: { "scheme-id": { "name": { "en":…, "hi":… } } }
    try {
        const response = await fetch('translations/translations.json');
        window.translations = await response.json();
    } catch (err) {
        // Silent fallback — works fine without a server when all text is inline
        console.info('i18n: translations.json not loaded (requires HTTP server). Using inline text.');
    }

    /**
     * Translate a single key.
     * Usage: t('pm-kisan', 'name')  → "PM Kisan Samman Nidhi"
     *        t('ui', 'ui_apply_now') → "Apply Now"
     * Falls back to null if key is missing.
     */
    window.t = function(domain, attr) {
        if (!window.translations) return null;
        const domainObj = window.translations[domain];
        if (!domainObj) return null;
        const attrObj = domainObj[attr];
        if (!attrObj) return null;
        return attrObj[window.currentLang] || attrObj['en'] || null;
    };

    /**
     * Walk the DOM and replace innerText of [data-i18n] elements.
     * Supports both "key" (uses 'ui' domain) and "domain.key" format.
     */
    window.translateUI = function() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const raw = el.getAttribute('data-i18n');
            let domain = 'ui', attr = raw;
            if (raw.includes('.')) {
                [domain, attr] = raw.split('.');
            }
            const text = window.t(domain, attr);
            if (text) el.innerText = text;
        });
    };

    // Initial pass
    window.translateUI();
});
