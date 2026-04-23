(function() {
    // Shared State Management
    window.activeCategory = 'all';
    window.lastRenderedList = [];

    // Safety helper for translation
    const safeT = (domain, key, fallback) => {
        try {
            if (typeof window.t === 'function') return window.t(domain, key) || fallback;
        } catch(e) {
            console.error('safeT error:', e);
        }
        return fallback;
    };

    const resolveCategoryName = (catId) => {
        if (!catId) return "";
        const fallback = catId.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return safeT('ui', `cat_${catId}`, fallback);
    };

    // Helper: Multilingual field resolver
    const resolve = (field) => {
        try {
            if (typeof window.resolveField === 'function') return window.resolveField(field);
            const lang = window.currentLang || localStorage.getItem('appLang') || 'en';
            if (field && typeof field === 'object') {
                return field[lang] || field['en'] || Object.values(field)[0];
            }
        } catch(e) {
            console.error('resolve error:', e);
        }
        return field || "";
    };

    // Render Master Controller
    window.renderSchemes = function(category) {
        window.activeCategory = category || 'all';
        if (!window.schemesData) {
            console.warn('renderSchemes: window.schemesData is null');
            return;
        }
        const allSchemes = Object.values(window.schemesData).flat();
        let targetList = window.activeCategory === 'all' ? allSchemes : (window.schemesData[window.activeCategory] || []);
        
        window.renderSchemesFromList(targetList);
        
        // UI State Update: Cat Chips
        document.querySelectorAll('.cat-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.cat === window.activeCategory);
        });
    };

    window.renderSchemesFromList = function(schemesArray, containerId = 'schemes-grid') {
        const container = document.getElementById(containerId);
        if (!container) return;

        window.lastRenderedList = schemesArray || [];

        // Update results count label
        const countEl = document.getElementById('results-count');
        if (countEl) {
            countEl.textContent = `${window.lastRenderedList.length} scheme${window.lastRenderedList.length !== 1 ? 's' : ''} found`;
        }

        // Update compare bar visibility
        const compareBar = document.getElementById('compare-bar');
        if (compareBar) {
            const compareList = JSON.parse(localStorage.getItem('compare')) || [];
            compareBar.style.display = compareList.length > 0 ? 'flex' : 'none';
            const compareLabel = document.getElementById('compare-label');
            if (compareLabel) compareLabel.textContent = `${compareList.length} scheme${compareList.length !== 1 ? 's' : ''} selected for comparison`;
        }

        try {
            if (window.lastRenderedList.length === 0) {
                container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; background: var(--bg-card); border-radius: 12px; box-shadow: var(--shadow-soft);">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem; display:block;"></i>
                    <h3 style="color:var(--text-main); margin:0 0 0.5rem;">${safeT('ui', 'ui_no_schemes_found', 'No schemes found')}</h3>
                    <p style="color:var(--text-muted); margin:0 0 1.5rem;">${safeT('ui', 'ui_try_different', 'Try a different search term or category.')}</p>
                    <button onclick="window.renderSchemes('all')" class="btn-primary">${safeT('ui', 'ui_show_all', 'Show All Schemes')}</button>
                </div>`;
                return;
            }

            const saved = window.getSavedSchemes();
            const cmpList = JSON.parse(localStorage.getItem('compare')) || [];

            container.innerHTML = window.lastRenderedList.map(scheme => {
                const isSaved = saved.includes(scheme.id);
                const isCompared = cmpList.includes(scheme.id);

                return `
                <div class="scheme-card fade-in">
                    <div class="card-header">
                        <div class="badge">${resolveCategoryName(scheme.category)}</div>
                        <div class="card-tools">
                            <button class="icon-btn ${isCompared ? 'saved' : ''}" onclick="window.addToCompare('${scheme.id}')" title="Compare">
                                <i class="fas fa-exchange-alt"></i>
                            </button>
                            <button class="icon-btn ${isSaved ? 'saved' : ''}" onclick="window.toggleSave('${scheme.id}')" title="Bookmark">
                                <i class="fas fa-bookmark"></i>
                            </button>
                        </div>
                    </div>
                    <div class="ministry"><i class="fas fa-landmark" style="margin-right:0.35rem; opacity:0.6;"></i>${scheme.ministry || ""}</div>

                    <h3 class="scheme-title">${resolve(scheme.name)}</h3>
                    <p class="scheme-desc" style="margin-bottom: 0.75rem;">${resolve(scheme.description)}</p>

                    <div class="scheme-meta-info" style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1.25rem; background: var(--bg-main); padding: 0.75rem; border-radius: 8px;">
                        <p style="margin: 0 0 0.4rem;"><strong><i class="fas fa-check-circle" style="color: #10b981; margin-right: 0.3rem;"></i> Eligibility:</strong> ${resolve(scheme.eligibility)}</p>
                        <p style="margin: 0;"><strong><i class="fas fa-file-alt" style="color: #3b82f6; margin-right: 0.3rem;"></i> Documents:</strong> ${resolve(scheme.documents)}</p>
                    </div>

                    <div class="card-actions">
                        <button class="btn-outline" onclick="window.goToDetails('${scheme.id}')">${safeT('ui', 'ui_view_details', 'View Details')}</button>
                        <a href="${scheme.applyLink}" target="_blank" rel="noopener" class="btn-apply apply" onclick="event.stopPropagation()">${safeT('ui', 'ui_apply_now', 'Apply Now')}</a>
                    </div>
                </div>`;
            }).join('');
        } catch (err) {
            console.error('renderSchemesFromList failed:', err);
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: red;">Error rendering schemes. Please try again.</div>`;
        }
    };

    // SEARCH IMPLEMENTATION
    window.searchSchemes = function(query) {
        if (!query) {
            window.renderSchemes(window.activeCategory);
            return;
        }

        const q = query.toLowerCase();
        if (!window.schemesData) return;
        const all = Object.values(window.schemesData).flat();
        
        const filtered = all.filter(s => {
            const nameMatch = Object.values(s.name || {}).some(val => typeof val === 'string' && val.toLowerCase().includes(q));
            const descMatch = Object.values(s.description || {}).some(val => typeof val === 'string' && val.toLowerCase().includes(q));
            const metaMatch = (s.ministry || "").toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q);
            return nameMatch || descMatch || metaMatch;
        });

        window.renderSchemesFromList(filtered);
    };

    // Helper: Get Saved Schemes
    window.getSavedSchemes = function() {
        try {
            return JSON.parse(localStorage.getItem("savedSchemes")) || [];
        } catch(e) {
            return [];
        }
    };

    // BOOKMARK ENGINE
    window.toggleSave = function(id) {
        let saved = window.getSavedSchemes();
        if (saved.includes(id)) {
            saved = saved.filter(s => s !== id);
        } else {
            saved.push(id);
        }
        localStorage.setItem("savedSchemes", JSON.stringify(saved));
        window.renderSchemesFromList(window.lastRenderedList);
    };

    // COMPARE ENGINE
    window.addToCompare = function(id) {
        let list = JSON.parse(localStorage.getItem('compare')) || [];
        if (list.includes(id)) {
            list = list.filter(item => item !== id);
        } else {
            if (list.length >= 3) {
                alert("You can compare up to 3 schemes at once.");
                return;
            }
            list.push(id);
        }
        localStorage.setItem('compare', JSON.stringify(list));
        window.renderSchemesFromList(window.lastRenderedList);
    };

    window.clearCompare = function() {
        localStorage.removeItem('compare');
        window.renderSchemesFromList(window.lastRenderedList);
    };

    window.viewCompare = function() {
        window.location.href = 'compare.html';
    };

    // INITIALIZATION
    document.addEventListener('DOMContentLoaded', () => {
        // Handle URL Params
        const params = new URLSearchParams(window.location.search);
        const cat = params.get('category') || 'all';

        // 1. Immediately sync UI active state
        document.querySelectorAll('.cat-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.cat === cat);
            
            // 2. Setup Chip Events
            chip.addEventListener('click', () => {
                window.renderSchemes(chip.dataset.cat);
            });
        });

        // Setup Search Event
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => window.searchSchemes(e.target.value));
        }
        
        // 3. Render schemes with a slight delay for data/i18n safety
        setTimeout(() => {
            window.renderSchemes(cat);
        }, 200);
    });

})();
