document.addEventListener('DOMContentLoaded', () => {

    // Safety helper for translation
    const safeT = (domain, key, fallback) => {
        if (typeof window.t === 'function') return window.t(domain, key) || fallback;
        return fallback;
    };

    // Wait for i18n + schemesData to initialise
    setTimeout(() => {
        window.renderDetails();
    }, 400);

    window.renderDetails = function() {
        const renderTarget = document.getElementById('details-render-target');
        if (!renderTarget) return;

        // Parse URL param: scheme-details.html?id=pm-kisan
        const urlParams = new URLSearchParams(window.location.search);
        const schemeId = urlParams.get('id');

        if (!schemeId) {
            renderTarget.innerHTML = `<div class="details-section" style="text-align:center; padding:3rem;">
                <i class="fas fa-exclamation-circle" style="font-size:2.5rem; color:var(--primary-orange); margin-bottom:1rem; display:block;"></i>
                <h3>${safeT('ui', 'ui_id_error', 'No scheme ID specified.')}</h3>
                <button onclick="window.location.href='schemes.html'" class="btn-primary" style="margin-top:1rem;">${safeT('ui', 'ui_show_all', 'Browse All Schemes')}</button>
            </div>`;
            return;
        }

        // Find scheme by ID across all categories
        function findSchemeById(id) {
            if (!window.schemesData) return null;
            for (const cat in window.schemesData) {
                const found = window.schemesData[cat].find(s => s.id === id);
                if (found) return found;
            }
            return null;
        }

        const scheme = findSchemeById(schemeId);

        if (!scheme) {
            renderTarget.innerHTML = `<div class="details-section" style="text-align:center; padding:3rem;">
                <h3>${safeT('ui', 'ui_not_found', 'Scheme not found.')}</h3>
                <button onclick="window.location.href='schemes.html'" class="btn-primary" style="margin-top:1rem;">${safeT('ui', 'ui_show_all', 'Browse All Schemes')}</button>
            </div>`;
            return;
        }

        // ── Unified field resolver ──
        const lang = window.currentLang || 'en';
        function resolve(field) {
            if (!field) return null;
            if (typeof field === 'object' && !Array.isArray(field)) {
                return field[lang] || field['en'] || Object.values(field)[0] || null;
            }
            return field;
        }

        const resolveCategoryName = (catId) => {
            return safeT('ui', `cat_${catId}`, catId ? catId.charAt(0).toUpperCase() + catId.slice(1) : "");
        };

        const displayName = resolve(scheme.name) || (window.t ? window.t(scheme.id, 'name') : null) || scheme.id;
        const displayDesc = resolve(scheme.description) || (window.t ? window.t(scheme.id, 'description') : null) || '';

        // Update page title and breadcrumb
        document.title = displayName + ' | SchemeChecker';
        const breadcrumb = document.getElementById('breadcrumb-name');
        if (breadcrumb) breadcrumb.textContent = displayName;

        // ── Eligibility ──
        function toListHTML(field, icon) {
            const raw = resolve(field);
            if (!raw) return '<li>' + icon + '<span>—</span></li>';

            if (Array.isArray(raw)) {
                return raw.map(item =>
                    `<li>${icon}<span>${item}</span></li>`
                ).join('');
            }
            // String — split on comma or period
            return raw.split(/(?<=[.]),?\s*|\s*,\s*/).filter(s => s.trim().length > 2).map(item =>
                `<li>${icon}<span>${item.trim().replace(/\.$/, '')}</span></li>`
            ).join('');
        }

        const eligibilityHTML = toListHTML(scheme.eligibility, '<i class="fas fa-check-circle"></i>');
        const documentsHTML = toListHTML(scheme.documents, '<i class="fas fa-file-alt" style="color:var(--primary-blue);"></i>');

        // ── Apply Steps ──
        const resolvedSteps = resolve(scheme.applySteps);
        const steps = Array.isArray(resolvedSteps) ? resolvedSteps : [];
        const stepsHTML = steps.length
            ? steps.map((step, i) => `
                <div class="step-card">
                    <div class="step-num">${i + 1}</div>
                    <div>${step}</div>
                </div>`).join('')
            : `<p style="color:var(--text-muted); margin:0;">${safeT('ui', 'ui_visit_portal', 'Visit the official portal to apply.')}</p>`;

        renderTarget.innerHTML = `
            <div class="details-hero">
                <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-bottom:1.25rem;">
                    <span class="badge">${resolveCategoryName(scheme.category)}</span>
                    ${scheme.recommended ? `<span class="recommended"><i class="fas fa-star"></i> ${safeT('ui', 'ui_recommended', 'Recommended')}</span>` : ''}
                </div>

                <h1 style="font-size:2.2rem; color:var(--text-main); margin:0 0 0.5rem; line-height:1.25;">
                    ${displayName}
                </h1>
                <p style="color:var(--text-muted); font-size:1.05rem; font-weight:500; margin:0 0 1.5rem;">
                    <i class="fas fa-landmark" style="margin-right:0.4rem;"></i>${scheme.ministry}
                </p>
                <p style="font-size:1.1rem; line-height:1.8; color:var(--text-main); margin:0 0 2rem;">
                    ${displayDesc}
                </p>
                <a href="${scheme.applyLink}" target="_blank" rel="noopener" class="btn-apply apply"
                   style="padding:0.85rem 2.5rem; font-size:1.05rem;"
                   onclick="applyNow('${scheme.applyLink}'); return false;">
                    <i class="fas fa-external-link-alt" style="margin-right:0.5rem;"></i> ${safeT('ui', 'ui_apply_portal', 'Apply on Official Portal')}
                </a>
            </div>

            <div class="details-section">
                <h3><i class="fas fa-user-check"></i> ${safeT('ui', 'ui_eligibility', 'Eligibility Criteria')}</h3>
                <ul class="check-list">${eligibilityHTML}</ul>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:1.5rem;">
                <div class="details-section" style="margin-bottom:0;">
                    <h3><i class="fas fa-folder-open"></i> ${safeT('ui', 'ui_documents', 'Required Documents')}</h3>
                    <ul class="check-list">${documentsHTML}</ul>
                </div>

                <div class="details-section" style="margin-bottom:0;">
                    <h3><i class="fas fa-list-ol"></i> ${safeT('ui', 'ui_how_to_apply', 'How to Apply')}</h3>
                    ${stepsHTML}
                </div>
            </div>
        `;
    };
});
