/**
 * app.js — Global Navigation & Utility Functions
 * Shared across index.html, schemes.html, scheme-details.html
 */

// ── 1. NAVIGATION ─────────────────────────────────────────────────────────────

function goToSchemes(category = 'all') {
    window.location.href = `schemes.html?category=${category}`;
}

function goToDetails(id) {
    window.location.href = `scheme-details.html?id=${id}`;
}

function applyNow(link) {
    window.open(link, '_blank');
}

// Dynamic Category Counts for Home Page
function updateCategoryCounts() {
    if (!window.schemesData) return;
    
    // Mapping of category ID to HTML count element ID
    const categories = [
        'agriculture', 'education', 'healthcare', 'finance', 
        'housing', 'employment', 'women', 'social', 
        'transport', 'digital'
    ];

    categories.forEach(cat => {
        const countEl = document.getElementById(`count-${cat}`);
        if (countEl && window.schemesData[cat]) {
            const count = window.schemesData[cat].length;
            const label = (typeof window.t === 'function' ? window.t('ui', 'ui_schemes') : null) || 'schemes';
            countEl.textContent = `${count} ${label}`;
        }
    });
}

// Global Field Resolver for Multilingual Data
window.resolveField = function(field) {
    const lang = window.currentLang || localStorage.getItem('appLang') || 'en';
    if (field && typeof field === 'object') {
        return field[lang] || field['en'] || Object.values(field)[0];
    }
    return field || '';
};

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('SchemeChecker initialized');
    
    // Tiny delay to ensure schemesData.js is parsed
    setTimeout(() => {
        updateCategoryCounts();
        // If we have rendering logic on the home page that isn't language-aware, 
        // we can trigger it here or in changeLanguage.
    }, 100);
});

// ── 2. LANGUAGE ────────────────────────────────────────────────────────────────

window.currentLang = localStorage.getItem('appLang') || 'en';

function changeLanguage(lang) {
    if (!lang) return;
    window.currentLang = lang;
    localStorage.setItem('appLang', lang);

    // Sync all dropdowns
    document.querySelectorAll('.lang-select, #language-switcher').forEach(el => el.value = lang);

    // Re-run static text translations
    if (window.translateUI) window.translateUI();

    // Re-render dynamic content
    if (window.lastRenderedList && window.renderSchemesFromList) {
        window.renderSchemesFromList(window.lastRenderedList);
    }
    if (window.renderDetails) {
        window.renderDetails();
    }
    if (window.renderHomeContent) {
        window.renderHomeContent();
    }
}

// ── 3. CATEGORY FILTER ALIASES (for listing.js) ───────────────────────────────

function filterCategory(cat) {
    if (window.renderSchemes) {
        window.renderSchemes(cat || 'all');
    } else {
        // Called from landing page — navigate instead
        goToSchemes(cat);
    }
}

function filterRecommended() {
    if (!window.schemesData) return;
    const all = Object.values(window.schemesData).flat();
    const filtered = all.filter(s => s.recommended);
    if (window.renderSchemesFromList) {
        window.renderSchemesFromList(filtered);
    } else {
        // On landing page, go to schemes with recommended intent
        goToSchemes('all');
    }
}

// ── 4. CATEGORY CARD WIRE-UP (data-category attribute) ────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Wire all elements with .category-card[data-category]
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            goToSchemes(category);
        });
    });

    // Sync language-switcher dropdown to saved lang on load
    const savedLang = localStorage.getItem('appLang') || 'en';
    window.currentLang = savedLang; // Initialize global lang
    document.querySelectorAll('#language-switcher').forEach(el => {
        el.value = savedLang;
        el.addEventListener('change', e => changeLanguage(e.target.value));
    });
});
