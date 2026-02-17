// articles-section.js
// INDEX から切り出した ARTICLES セクション初期化ロジック。

import { shouldOpenOffcanvas } from '../offcanvas-deeplink.js';

const API_URL = 'https://uminomae.github.io/pjdhiro/api/kesson-articles.json';
const MOCK_URL = './assets/articles/articles.json';
const INITIAL_DISPLAY = 3;
const ARTICLES_READY_EVENT = 'kesson:articles-ready';

let hasNotifiedArticlesReady = false;
let hasAutoOpenedArticlesOffcanvas = false;

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

function createCard(item) {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const normalizedType = normalizeType(item);
    const dateText = formatDate(item.date);
    const teaserHtml = item.teaser
        ? `<img src="${item.teaser}" class="card-img-top" alt="" onerror="this.style.display='none'">`
        : '';
    const excerptHtml = item.excerpt ? `<p class="card-text">${item.excerpt}</p>` : '';

    col.innerHTML = `
      <a href="${item.url}" target="_blank" rel="noopener"
         class="text-decoration-none"
         aria-label="${item.title} を読む">
        <div class="card kesson-card h-100">
          ${teaserHtml}
          <div class="card-body">
            <span class="badge bg-secondary mb-2 badge-article-type">
              ${normalizedType}
            </span>
            <h6 class="card-title mb-1">${item.title}</h6>
            ${excerptHtml}
            <small>${dateText}</small>
          </div>
        </div>
      </a>`;

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
    openArticlesOffcanvasFromDeepLink();
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
