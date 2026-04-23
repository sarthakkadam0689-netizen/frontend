document.addEventListener('DOMContentLoaded', () => {

    const globalSearchInput = document.getElementById('global-search');
    const searchBtn = document.querySelector('.search-btn');
    const dirView = document.getElementById('directory-view');
    const dirContainer = document.getElementById('directory-container');

    // ==========================================
    // Interactive Chips UI Logic
    // ==========================================
    const chips = document.querySelectorAll('.chips-list .chip-btn');
    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            // Toggle the premium visual solid blue state defined in CSS
            chip.classList.toggle('active-chip');
        });
    });

    // ==========================================
    // Filter Reset Logic
    // ==========================================
    function injectClearFilterBtn() {
        let btn = document.getElementById('clear-filter-btn');
        if (!btn) {
            // Re-uses UI variables to generate button
            const clearBtnHTML = `
                <button id="clear-filter-btn" class="btn-secondary pill-btn" style="margin-bottom: 1.5rem; display: inline-flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-times"></i> Clear Filters
                </button>
            `;
            // Insert it above the scheme cards
            const header = dirView.querySelector('h2');
            if (header) {
                header.insertAdjacentHTML('afterend', clearBtnHTML);
            }
            
            btn = document.getElementById('clear-filter-btn');
            
            if (btn) {
                btn.addEventListener('click', () => {
                    // Reset the search parameters visually
                    if (globalSearchInput) globalSearchInput.value = '';
                    chips.forEach(c => c.classList.remove('active-chip'));
                    const stateSelect = document.getElementById('user-state');
                    if (stateSelect) stateSelect.value = 'any';
                    
                    // Call global UI updater from listing.js
                    if (typeof window.renderSchemes === 'function') {
                        window.renderSchemes(window.appData.schemes);
                    }
                    
                    // Exterminate the button
                    btn.remove();
                });
            }
        }
    }

    function renderResults(results) {
        if (typeof window.renderSchemes === 'function') {
            window.renderSchemes(results);
        }
    }

    // ==========================================
    // 1. Global Search Logic (Header)
    // ==========================================
    function executeGlobalSearch() {
        if (!globalSearchInput || !window.appData?.schemes) return;
        
        const query = globalSearchInput.value.trim().toLowerCase();
        if (!query) return;

        // Perform case-insensitive match against name, description, and dynamic tags
        const filteredResults = window.appData.schemes.filter(scheme => {
            const nameMatch = scheme.name.en.toLowerCase().includes(query);
            const descMatch = scheme.description.en.toLowerCase().includes(query);
            const tagsMatch = scheme.tags.some(tag => tag.toLowerCase().includes(query));
            return nameMatch || descMatch || tagsMatch;
        });

        // Trigger SPA directory view seamlessly
        if (typeof window.MapsTo === 'function') {
            window.MapsTo('directory-view');
        }
        
        injectClearFilterBtn();
        renderResults(filteredResults);
    }

    // Attach Listeners
    if (searchBtn && globalSearchInput) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            executeGlobalSearch();
        });
        
        globalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeGlobalSearch();
            }
        });
    }

    // ==========================================
    // 2. Smart Recommendation Engine Logic (Home View)
    // ==========================================
    const recForm = document.getElementById('recommendation-form');
    if (recForm) {
        recForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!window.appData?.schemes) return;

            // Gather dynamic evaluation fields based on inputs and interactive active chips
            const stateVal = document.getElementById('user-state')?.value.toLowerCase() || 'any';
            const activeChips = Array.from(document.querySelectorAll('.chips-list .active-chip'))
                                    .map(chip => chip.getAttribute('data-value').toLowerCase());

            const filteredResults = window.appData.schemes.filter(scheme => {
                // Match State Condition checking metadata tags 
                const isStateMatch = stateVal === 'any' || 
                    scheme.tags.some(tag => tag.toLowerCase() === 'central' || tag.toLowerCase().includes(stateVal)) ||
                    scheme.description.en.toLowerCase().includes(stateVal);

                // Match dynamically active conditions if any are toggled on
                const isChipMatch = activeChips.length === 0 || activeChips.some(chipVal => 
                    scheme.tags.some(tag => tag.toLowerCase().includes(chipVal))
                );

                return isStateMatch && isChipMatch;
            });

            // Transition using architecture SPA 
            if (typeof window.MapsTo === 'function') {
                window.MapsTo('directory-view');
            }
            
            injectClearFilterBtn();
            renderResults(filteredResults);
        });
    }

});
