export function initMobileNavAutoCollapse() {
    const nav = document.getElementById('kessonTopbarNav');
    if (!nav) return;

    nav.querySelectorAll('.nav-link, [data-bs-toggle="offcanvas"]').forEach((el) => {
        el.addEventListener('click', () => {
            if (window.innerWidth >= 1200) return;
            const collapseApi = window.bootstrap?.Collapse;
            if (!collapseApi) return;
            const collapse = collapseApi.getOrCreateInstance(nav, { toggle: false });
            collapse.hide();
        });
    });

    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.classList.contains('show')) return;
        const topbar = document.getElementById('kesson-topbar');
        if (topbar && topbar.contains(e.target)) return;
        const collapseApi = window.bootstrap?.Collapse;
        if (!collapseApi) return;
        const collapse = collapseApi.getOrCreateInstance(nav, { toggle: false });
        collapse.hide();
    });
}
