import { createReadMoreButton } from './toggle-buttons.js';
import {
    DEVLOG_DEFAULT_COVER,
    buildSessionHref,
    getCurrentLang,
    getSessionDateRange,
    getSessionSummary,
    getSessionTitle,
    getUiStrings,
    normalizeLang,
    resolveSessionCover,
} from './devlog-model.js';

// DECISION: gallery/offcanvas DOM generation is moved to a dedicated render module so data/deeplink state
// can change independently from card markup and accessibility attributes. (Phase B-2 / 2026-02-19)

export function waitForImages(rootEl, timeoutMs = 1500) {
    if (!rootEl) return Promise.resolve();
    const pendingImages = Array.from(rootEl.querySelectorAll('img')).filter((img) => !img.complete);
    if (pendingImages.length === 0) return Promise.resolve();

    return new Promise((resolve) => {
        let resolved = false;
        let remaining = pendingImages.length;

        const finish = () => {
            if (resolved) return;
            resolved = true;
            resolve();
        };

        const timer = setTimeout(finish, timeoutMs);
        const onImageDone = () => {
            remaining -= 1;
            if (remaining <= 0) {
                clearTimeout(timer);
                finish();
            }
        };

        pendingImages.forEach((img) => {
            img.addEventListener('load', onImageDone, { once: true });
            img.addEventListener('error', onImageDone, { once: true });
        });
    });
}

export function createCardElement(session, lang, source, persistReturnStateFn) {
    const sessionTitle = getSessionTitle(session, lang);
    const sessionDateRange = getSessionDateRange(session, lang);
    const sessionSummary = getSessionSummary(session, lang);
    const sessionCover = resolveSessionCover(session, lang);
    const href = buildSessionHref(session.id, lang);
    const strings = getUiStrings(lang);

    const link = document.createElement('a');
    link.className = 'kesson-card-link text-decoration-none';
    link.href = href;
    link.addEventListener('click', () => {
        persistReturnStateFn(source, session.id);
    });
    link.setAttribute('aria-label', `${strings.openLabel}: ${sessionTitle}`);

    const card = document.createElement('div');
    card.className = 'card kesson-card h-100';

    const img = document.createElement('img');
    img.className = 'card-img-top';
    img.src = sessionCover.src;
    img.alt = sessionTitle;
    img.onerror = () => {
        img.onerror = null;
        img.src = DEVLOG_DEFAULT_COVER;
    };

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const title = document.createElement('h6');
    title.className = 'card-title mb-1';
    title.textContent = sessionTitle;

    const date = document.createElement('small');
    date.textContent = sessionDateRange;

    cardBody.appendChild(title);
    cardBody.appendChild(date);
    if (sessionSummary) {
        const summary = document.createElement('p');
        summary.className = 'card-text kesson-card-summary mb-0 mt-2';
        summary.textContent = sessionSummary;
        cardBody.appendChild(summary);
    }
    if (normalizeLang(lang) === 'en' && !sessionCover.localized) {
        const coverNote = document.createElement('small');
        coverNote.className = 'kesson-card-cover-note d-block mt-2';
        coverNote.textContent = strings.coverFallbackNote;
        cardBody.appendChild(coverNote);
    }

    card.appendChild(img);
    card.appendChild(cardBody);
    link.appendChild(card);
    return link;
}

export function buildGallery({ containerEl, sessions, openOffcanvas, persistReturnStateFn }) {
    containerEl.innerHTML = '';

    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'container px-4';

    const row = document.createElement('div');
    row.className = 'row g-3';

    const lang = getCurrentLang();
    const visibleSessions = sessions.slice(0, 3);

    visibleSessions.forEach((session) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';

        const card = createCardElement(session, lang, 'main', persistReturnStateFn);
        col.appendChild(card);
        row.appendChild(col);
    });

    galleryContainer.appendChild(row);

    if (sessions.length > 3) {
        const readMoreContainer = document.createElement('div');
        readMoreContainer.className = 'text-center mt-4';
        readMoreContainer.id = 'read-more-container';
        const remainingCount = sessions.length - visibleSessions.length;
        const readMoreBtn = createReadMoreButton(openOffcanvas, remainingCount, lang);
        readMoreContainer.appendChild(readMoreBtn);
        galleryContainer.appendChild(readMoreContainer);
    }

    containerEl.appendChild(galleryContainer);
    console.log('[devlog] Gallery built with', visibleSessions.length, 'visible cards');
}

export function renderSessionCards(sessionsToRender, persistReturnStateFn) {
    const container = document.getElementById('offcanvas-gallery');
    let row = container.querySelector('.row');
    if (!row) {
        row = document.createElement('div');
        row.className = 'row g-3 p-3';
        container.appendChild(row);
    }

    const lang = getCurrentLang();

    sessionsToRender.forEach((session) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';
        const card = createCardElement(session, lang, 'offcanvas', persistReturnStateFn);
        col.appendChild(card);
        row.appendChild(col);
    });
}

export function showLoading() {
    const container = document.getElementById('offcanvas-gallery');
    let loader = document.getElementById('offcanvas-loading');
    const lang = getCurrentLang();
    const strings = getUiStrings(lang);
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'offcanvas-loading';
        container.appendChild(loader);
    }
    loader.textContent = strings.loading;
    loader.style.display = 'block';
}

export function hideLoading() {
    const loader = document.getElementById('offcanvas-loading');
    if (loader) loader.style.display = 'none';
}

export function updateSessionCount(displayedCount, totalCount) {
    const countEl = document.getElementById('offcanvas-session-count');
    if (countEl) {
        const strings = getUiStrings(getCurrentLang());
        countEl.textContent = `${displayedCount} / ${totalCount} ${strings.sessionUnit}`;
    }
}

export function showListView() {
    const listView = document.getElementById('offcanvas-list-view');
    const detailView = document.getElementById('offcanvas-detail-view');
    const backBtn = document.getElementById('offcanvas-back-btn');

    if (detailView) detailView.classList.add('d-none');
    if (listView) listView.classList.remove('d-none');
    if (backBtn) backBtn.classList.add('d-none');
}
