// dev-hub-panel.js — Dev hub panel opened from footer dev link
// CHANGED(2026-03-25): #169 — creation-space-inspired dev panel with modal shortcuts

const PANEL_ID = 'dev-hub-panel';
const BACKDROP_ID = 'dev-hub-backdrop';

let panelOpen = false;
let initialized = false;

const MODAL_LINKS = [
    {
        id: 'dev-hub-open-overview',
        label: 'Meta Overview (Slides)',
        description: 'Rich slide viewer for meta-overview',
        action: 'slide-viewer',
    },
    {
        id: 'dev-hub-open-general',
        label: 'Guide: General',
        description: 'Markdown modal for general guide',
        action: 'guide-general',
    },
    {
        id: 'dev-hub-open-designer',
        label: 'Guide: Designer',
        description: 'Markdown modal for designer guide',
        action: 'guide-designer',
    },
    {
        id: 'dev-hub-open-academic',
        label: 'Guide: Academic',
        description: 'Markdown modal for academic guide',
        action: 'guide-academic',
    },
];

const SECTION_LINKS = [
    {
        id: 'dev-hub-jump-guides',
        label: 'GUIDES section',
        href: '#guides-section',
    },
    {
        id: 'dev-hub-jump-articles',
        label: 'ARTICLES section',
        href: '#articles-section',
    },
    {
        id: 'dev-hub-jump-devlog',
        label: 'DEVLOG section',
        href: '#devlog-gallery-section',
    },
];

function createPanel() {
    if (document.getElementById(PANEL_ID)) return;

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = BACKDROP_ID;
    backdrop.className = 'dev-hub-backdrop';
    backdrop.addEventListener('click', closePanel);
    document.body.appendChild(backdrop);

    // Panel
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'dev-hub-panel';

    let html = `
      <div class="dev-hub-header">
        <span class="dev-hub-title">DEV HUB</span>
        <button type="button" class="dev-hub-close-btn" id="dev-hub-close" aria-label="Close">&times;</button>
      </div>
      <div class="dev-hub-body">
        <div class="dev-hub-section-label">Modals / Viewers</div>
        <div class="dev-hub-link-list">
    `;

    MODAL_LINKS.forEach((link) => {
        html += `
          <button type="button" class="dev-hub-link-btn" id="${link.id}" data-action="${link.action}">
            <span class="dev-hub-link-label">${link.label}</span>
            <span class="dev-hub-link-desc">${link.description}</span>
          </button>
        `;
    });

    html += `
        </div>
        <div class="dev-hub-section-label mt-3">Page Sections</div>
        <div class="dev-hub-link-list">
    `;

    SECTION_LINKS.forEach((link) => {
        html += `
          <a class="dev-hub-link-btn" href="${link.href}" id="${link.id}">
            <span class="dev-hub-link-label">${link.label}</span>
          </a>
        `;
    });

    html += `
        </div>
        <div class="dev-hub-section-label mt-3">Page Links</div>
        <div class="dev-hub-link-list" id="dev-hub-page-links">
          <span class="dev-hub-link-desc">Loading...</span>
        </div>
        <div class="dev-hub-section-label mt-3">Dev Tools</div>
        <div class="dev-hub-link-list">
          <button type="button" class="dev-hub-link-btn" id="dev-hub-open-params" data-action="open-params">
            <span class="dev-hub-link-label">Parameter Panel (DEV)</span>
            <span class="dev-hub-link-desc">Open existing slider panel</span>
          </button>
          <button type="button" class="dev-hub-link-btn" id="dev-hub-open-links" data-action="open-links">
            <span class="dev-hub-link-label">Link Hub</span>
            <span class="dev-hub-link-desc">Open deep links offcanvas</span>
          </button>
        </div>
      </div>
    `;

    panel.innerHTML = html;
    document.body.appendChild(panel);

    // Close button
    document.getElementById('dev-hub-close').addEventListener('click', closePanel);

    // Section links close panel on click
    SECTION_LINKS.forEach((link) => {
        document.getElementById(link.id)?.addEventListener('click', closePanel);
    });

    // Modal/viewer action handlers
    panel.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        handleAction(action);
    });
}

// CHANGED(2026-03-25): #170 — Fetch page-links.json and render preset links in dev panel
async function fetchPageLinks() {
    const container = document.getElementById('dev-hub-page-links');
    if (!container) return;
    try {
        const res = await fetch('./assets/page-links.json');
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        const presets = data.presets || [];
        container.innerHTML = '';
        presets.forEach((preset) => {
            const url = new URL(window.location.href);
            url.search = preset.query;
            const a = document.createElement('a');
            a.className = 'dev-hub-link-btn';
            a.href = url.toString();
            a.innerHTML = `<span class="dev-hub-link-label">${preset.label}</span><span class="dev-hub-link-desc">?${preset.query}</span>`;
            container.appendChild(a);
        });
    } catch (err) {
        container.innerHTML = '<span class="dev-hub-link-desc">Failed to load page-links.json</span>';
        console.warn('[dev-hub] page-links.json load error:', err);
    }
}

async function handleAction(action) {
    closePanel();

    switch (action) {
        case 'slide-viewer': {
            const { openRichSlideViewer } = await import('./slide-viewer.js');
            openRichSlideViewer({
                htmlUrl: './content/guides/meta-overview.html',
                title: '\u6B20\u640D\u99C6\u52D5\u601D\u8003 \u2014 \u5168\u4F53\u50CF',
            });
            break;
        }
        case 'guide-general': {
            const { openGuideModal } = await import('./guides.js');
            openGuideModal('general');
            break;
        }
        case 'guide-designer': {
            const { openGuideModal } = await import('./guides.js');
            openGuideModal('designer');
            break;
        }
        case 'guide-academic': {
            const { openGuideModal } = await import('./guides.js');
            openGuideModal('academic');
            break;
        }
        case 'open-params': {
            // Toggle existing dev panel
            const toggle = document.getElementById('dev-toggle');
            if (toggle) toggle.click();
            break;
        }
        case 'open-links': {
            // Open existing links offcanvas
            const linksToggle = document.getElementById('dev-links-toggle');
            if (linksToggle) linksToggle.click();
            break;
        }
        default:
            console.warn('[dev-hub] Unknown action:', action);
    }
}

function openPanel() {
    const panel = document.getElementById(PANEL_ID);
    const backdrop = document.getElementById(BACKDROP_ID);
    if (!panel) return;
    panelOpen = true;
    panel.classList.add('is-open');
    if (backdrop) backdrop.classList.add('is-visible');
}

function closePanel() {
    const panel = document.getElementById(PANEL_ID);
    const backdrop = document.getElementById(BACKDROP_ID);
    if (!panel) return;
    panelOpen = false;
    panel.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-visible');
}

function togglePanel() {
    if (panelOpen) {
        closePanel();
    } else {
        openPanel();
    }
}

// CHANGED(2026-03-25): #169 — Initialize dev hub panel
export function initDevHubPanel() {
    if (initialized) return;
    initialized = true;

    // Show footer dev link
    const footerLink = document.getElementById('footer-dev-link');
    if (footerLink) {
        footerLink.style.display = '';
        footerLink.addEventListener('click', (e) => {
            e.preventDefault();
            togglePanel();
        });
    }

    createPanel();
    fetchPageLinks();
}
