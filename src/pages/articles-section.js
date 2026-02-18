// articles-section.js
// INDEX から切り出した ARTICLES セクション初期化ロジック。

import { getRequestedScrollTarget, shouldOpenOffcanvas, hasDeepLinkIntent } from '../offcanvas-deeplink.js';
import { requestScroll, SCROLL_PRIORITY, commitNavigationIntent } from '../scroll-coordinator.js';

const API_URL = 'https://uminomae.github.io/pjdhiro/api/kesson-articles.json';
const MOCK_URL = './assets/articles/articles.json';
const INITIAL_DISPLAY = 3;
const ARTICLES_READY_EVENT = 'kesson:articles-ready';

let hasNotifiedArticlesReady = false;
let hasAutoOpenedArticlesOffcanvas = false;
let hasAppliedArticlesDeepLink = false;

function notifyArticlesReady(status = 'ok') {
    if (hasNotifiedArticlesReady || typeof window === 'undefined') return;
    hasNotifiedArticlesReady = true;
    window.__kessonArticlesReady = true;
    window.dispatchEvent(new CustomEvent(ARTICLES_READY_EVENT, { detail: { status } }));
}

function normalizeType(item) {
    return item.type === 'page' ? 'page' : 'post';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

function sanitizeHttpUrl(url, fallback = '#') {
    if (typeof url !== 'string') return fallback;
    const trimmed = url.trim();
    if (!trimmed) return fallback;
    return /^https?:\/\//i.test(trimmed) ? trimmed : fallback;
}

function createCard(item) {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const normalizedType = normalizeType(item);
    const dateText = formatDate(item.date);
    const safeUrl = sanitizeHttpUrl(item.url, '#');
    const safeTeaserUrl = sanitizeHttpUrl(item.teaser, '');
    const titleText = typeof item.title === 'string' ? item.title : '';
    const excerptText = typeof item.excerpt === 'string' ? item.excerpt : '';

    const link = document.createElement('a');
    link.href = safeUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'text-decoration-none';
    link.setAttribute('aria-label', `${titleText || '記事'} を読む`);

    const card = document.createElement('div');
    card.className = 'card kesson-card h-100';

    if (safeTeaserUrl) {
        const teaserImg = document.createElement('img');
        teaserImg.src = safeTeaserUrl;
        teaserImg.className = 'card-img-top';
        teaserImg.alt = '';
        teaserImg.addEventListener('error', () => {
            teaserImg.style.display = 'none';
        });
        card.appendChild(teaserImg);
    }

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const badge = document.createElement('span');
    badge.className = 'badge bg-secondary mb-2 badge-article-type';
    badge.textContent = normalizedType;

    const title = document.createElement('h6');
    title.className = 'card-title mb-1';
    title.textContent = titleText;

    const date = document.createElement('small');
    date.textContent = dateText;

    cardBody.appendChild(badge);
    cardBody.appendChild(title);

    if (excerptText) {
        const excerpt = document.createElement('p');
        excerpt.className = 'card-text';
        excerpt.textContent = excerptText;
        cardBody.appendChild(excerpt);
    }

    cardBody.appendChild(date);
    card.appendChild(cardBody);
    link.appendChild(card);
    col.appendChild(link);

    return col;
}

function createReadMoreButton(totalCount, visibleCount) {
    const btnContainer = document.createElement('div');
    btnContainer.className = 'text-center mt-3';

    const btn = document.createElement('button');
    btn.className = 'btn-read-more';
    btn.setAttribute('data-bs-toggle', 'offcanvas');
    btn.setAttribute('data-bs-target', '#articlesOffcanvas');
    btn.setAttribute('aria-controls', 'articlesOffcanvas');

    const remaining = totalCount - visibleCount;
    btn.textContent = remaining > 0
        ? `▸ Read More (${remaining})`
        : `▸ View All (${totalCount})`;

    btnContainer.appendChild(btn);
    return btnContainer;
}

async function fetchArticles() {
    try {
        const res = await fetch(API_URL);
        if (res.ok) return await res.json();
    } catch (e) {
        console.warn('[articles] API unavailable:', e.message);
    }

    try {
        const res = await fetch(MOCK_URL);
        if (res.ok) return await res.json();
    } catch (e) {
        console.error('[articles] Mock also failed:', e.message);
    }

    return null;
}

function setupFilters({ articles, filterButtons, offcanvasGrid, offcanvasCount }) {
    let activeType = 'all';

    function getFilteredArticles(type) {
        if (type === 'all') return articles;
        return articles.filter((item) => normalizeType(item) === type);
    }

    function updateFilterButtons() {
        filterButtons.forEach((btn) => {
            const isActive = btn.dataset.type === activeType;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function updateOffcanvasCount(filteredCount) {
        if (!offcanvasCount) return;
        if (activeType === 'all') {
            offcanvasCount.textContent = `${articles.length} articles`;
            return;
        }
        offcanvasCount.textContent = `${filteredCount} / ${articles.length} articles`;
    }

    function renderOffcanvasArticles(type) {
        if (!offcanvasGrid) return;
        const filtered = getFilteredArticles(type);
        offcanvasGrid.innerHTML = '';
        filtered.forEach((item) => offcanvasGrid.appendChild(createCard(item)));
        updateOffcanvasCount(filtered.length);
    }

    filterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const nextType = btn.dataset.type || 'all';
            if (nextType === activeType) return;
            activeType = nextType;
            updateFilterButtons();
            renderOffcanvasArticles(activeType);
        });
    });

    updateFilterButtons();
    renderOffcanvasArticles(activeType);
}

function waitForTwoAnimationFrames() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
}

function requestScrollToElement(el, source, priority = SCROLL_PRIORITY.DEFAULT) {
    if (!el) return;
    const targetY = window.scrollY + el.getBoundingClientRect().top - 24;
    requestScroll(targetY, source, { behavior: 'auto', priority });
}

function findArticlesScrollTargetElement() {
    const requested = getRequestedScrollTarget();
    const heading = document.querySelector('#articles-section .section-heading-link');
    const readMore = document.querySelector('#articles-section .btn-read-more');

    if (requested === 'articles-readmore') {
        return readMore || heading;
    }
    if (requested === 'articles-heading') {
        return heading;
    }
    return null;
}

function openArticlesOffcanvasFromDeepLink(attempt = 0) {
    if (hasAutoOpenedArticlesOffcanvas || !shouldOpenOffcanvas('articles')) return;

    const offcanvasEl = document.getElementById('articlesOffcanvas');
    if (!offcanvasEl) return;

    if (typeof bootstrap === 'undefined' || !bootstrap.Offcanvas) {
        if (attempt < 30) {
            window.setTimeout(() => openArticlesOffcanvasFromDeepLink(attempt + 1), 100);
        }
        return;
    }

    hasAutoOpenedArticlesOffcanvas = true;
    const instance = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
    instance.show();
}

function applyArticlesDeepLinkIntent() {
    if (!hasDeepLinkIntent()) return;
    if (hasAppliedArticlesDeepLink) return;
    hasAppliedArticlesDeepLink = true;

    const targetEl = findArticlesScrollTargetElement();
    if (targetEl) {
        requestScrollToElement(targetEl, 'deeplink:articles', SCROLL_PRIORITY.DEEP_LINK);
    }

    if (shouldOpenOffcanvas('articles')) {
        waitForTwoAnimationFrames().then(() => {
            openArticlesOffcanvasFromDeepLink();
        });
    }

    commitNavigationIntent('articles:deeplink');
}

async function initArticlesSection() {
    const grid = document.getElementById('articles-grid');
    const errorEl = document.getElementById('articles-error');
    const offcanvasGrid = document.getElementById('offcanvas-articles-grid');
    const offcanvasCount = document.getElementById('offcanvas-articles-count');
    const filterGroup = document.getElementById('articles-filter-group');
    const filterButtons = filterGroup
        ? Array.from(filterGroup.querySelectorAll('.articles-filter-btn'))
        : [];

    if (!grid) {
        notifyArticlesReady('no-grid');
        return;
    }

    const articles = await fetchArticles();
    if (!articles || articles.length === 0) {
        if (errorEl) {
            errorEl.textContent = '記事データの読み込みに失敗しました。';
            errorEl.classList.remove('d-none');
        }
        notifyArticlesReady('empty');
        return;
    }

    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    console.log('[articles] total:', articles.length, 'initial:', INITIAL_DISPLAY, 'remaining:', articles.length - INITIAL_DISPLAY);

    const initialItems = articles.slice(0, INITIAL_DISPLAY);
    initialItems.forEach((item) => grid.appendChild(createCard(item)));

    if (articles.length > 0 && grid.parentNode) {
        const readMoreButton = createReadMoreButton(articles.length, initialItems.length);
        grid.parentNode.insertBefore(readMoreButton, grid.nextSibling);
    }

    if (offcanvasGrid) {
        setupFilters({ articles, filterButtons, offcanvasGrid, offcanvasCount });
    }

    notifyArticlesReady('ok');
    applyArticlesDeepLinkIntent();
}

async function safeInitArticlesSection() {
    try {
        await initArticlesSection();
    } catch (error) {
        console.error('[articles] init failed:', error);
        notifyArticlesReady('error');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInitArticlesSection, { once: true });
} else {
    safeInitArticlesSection();
}
