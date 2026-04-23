(function() {
    function initSavedPage() {
        // 1. Get all saved IDs
        const savedIds = window.getSavedSchemes ? window.getSavedSchemes() : JSON.parse(localStorage.getItem('savedSchemes')) || [];
        
        // 2. Get all schemes from data
        const allSchemes = Object.values(window.schemesData || {}).flat();
        
        // 3. Filter
        const savedSchemes = allSchemes.filter(s => savedIds.includes(s.id));
        
        // 4. Update Badge
        const countBadge = document.getElementById('saved-count-badge');
        if (countBadge) {
            countBadge.textContent = `${savedSchemes.length} scheme${savedSchemes.length !== 1 ? 's' : ''} saved`;
        }

        // 5. Render using shared listing logic
        const container = document.getElementById('saved-schemes-grid');
        if (!container) return;

        if (savedSchemes.length === 0) {
            container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 5rem 2rem; background: var(--bg-card); border-radius: 12px; box-shadow: var(--shadow-soft);">
                <i class="far fa-bookmark" style="font-size: 3.5rem; color: var(--border-color); margin-bottom: 1.5rem; display:block;"></i>
                <h3 style="color:var(--text-main); margin:0 0 0.5rem;">Your bookmark list is empty</h3>
                <p style="color:var(--text-muted); margin:0 0 2rem;">Save schemes while browsing to see them here.</p>
                <button onclick="window.location.href='schemes.html'" class="btn-primary">Explore Schemes</button>
            </div>`;
            return;
        }

        // Use the common render function if available
        if (window.renderSchemesFromList) {
            window.renderSchemesFromList(savedSchemes, 'saved-schemes-grid');
        }
    }

    // Initialize on load
    document.addEventListener('DOMContentLoaded', initSavedPage);

    // Overwrite window.toggleSave behavior slightly for the saved page to refresh the view
    const originalToggleSave = window.toggleSave;
    window.toggleSave = function(id) {
        if (originalToggleSave) originalToggleSave(id);
        
        // If we are on saved.html, we should re-filter and re-render
        if (window.location.pathname.includes('saved.html')) {
            initSavedPage();
        }
    };

})();
