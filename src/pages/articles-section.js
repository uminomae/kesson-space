// articles-section.js
// INDEX から切り出した ARTICLES セクション初期化ロジック。

import { getRequestedScrollTarget, shouldOpenOffcanvas, hasDeepLinkIntent } from '../offcanvas-deeplink.js';
import { requestScroll, SCROLL_PRIORITY, commitNavigationIntent } from '../scroll-coordinator.js';
import { detectLang, LANG_CHANGE_EVENT } from '../i18n.js';

const API_URL = 'https://uminomae.github.io/pjdhiro/api/kesson-articles.json';
const MOCK_URL = './assets/articles/articles.json';
const INITIAL_DISPLAY = 3;
const ARTICLES_READY_EVENT = 'kesson:articles-ready';

const ARTICLE_UI = {
    ja: {
        articleLabel: '記事',
        openArticle: 'を読む',
        readMore: '▸ 続きを見る',
        viewAll: '▸ すべて表示',
        countUnit: '件',
        typeAll: 'すべて',
        typePage: 'ページ',
        typePost: '記事',
        loadingFailed: '記事データの読み込みに失敗しました。',
    },
    en: {
        articleLabel: 'article',
        openArticle: 'Read',
        readMore: '▸ Read More',
        viewAll: '▸ View All',
        countUnit: 'articles',
        typeAll: 'All',
        typePage: 'Page',
        typePost: 'Post',
        loadingFailed: 'Failed to load article data.',
    },
};

let hasNotifiedArticlesReady = false;
let hasAutoOpenedArticlesOffcanvas = false;
let hasAppliedArticlesDeepLink = false;

const articlesState = {
    articles: [],
    activeType: 'all',
    grid: null,
    errorEl: null,
    offcanvasGrid: null,
    offcanvasCount: null,
    filterButtons: [],
    filterBound: false,
    initialized: false,
};

function notifyArticlesReady(status = 'ok') {
    if (hasNotifiedArticlesReady || typeof window === 'undefined') return;
    hasNotifiedArticlesReady = true;
    window.__kessonArticlesReady = true;
    window.dispatchEvent(new CustomEvent(ARTICLES_READY_EVENT, { detail: { status } }));
}

function normalizeLang(lang) {
    return lang === 'en' ? 'en' : 'ja';
}

function getCurrentLang() {
    return normalizeLang(detectLang());
}

function getUi(lang) {
    return ARTICLE_UI[normalizeLang(lang)];
}

function normalizeType(item) {
    return item.type === 'page' ? 'page' : 'post';
}

function getTypeLabel(type, lang) {
    const ui = getUi(lang);
    if (type === 'page') return ui.typePage;
    if (type === 'post') return ui.typePost;
    return ui.typeAll;
}

function getLocalizedText(item, key, lang) {
    if (!item || typeof item !== 'object') return '';

    const normalizedLang = normalizeLang(lang);
    const fallbackLang = normalizedLang === 'en' ? 'ja' : 'en';
    const byLangKey = `${key}_${normalizedLang}`;
    const fallbackByLangKey = `${key}_${fallbackLang}`;

    if (typeof item[byLangKey] === 'string' && item[byLangKey].trim()) {
        return item[byLangKey];
    }
    if (typeof item[fallbackByLangKey] === 'string' && item[fallbackByLangKey].trim()) {
        return item[fallbackByLangKey];
    }

    const i18nValue = item[`${key}_i18n`];
    if (i18nValue && typeof i18nValue === 'object') {
        if (typeof i18nValue[normalizedLang] === 'string' && i18nValue[normalizedLang].trim()) {
            return i18nValue[normalizedLang];
        }
        if (typeof i18nValue[fallbackLang] === 'string' && i18nValue[fallbackLang].trim()) {
            return i18nValue[fallbackLang];
        }
    }

    const base = item[key];
    if (typeof base === 'string' && base.trim()) {
        return base;
    }
    if (base && typeof base === 'object') {
        if (typeof base[normalizedLang] === 'string' && base[normalizedLang].trim()) {
            return base[normalizedLang];
        }
        if (typeof base[fallbackLang] === 'string' && base[fallbackLang].trim()) {
            return base[fallbackLang];
        }
    }

    return '';
}

function formatDate(dateStr, lang) {
    if (!dateStr) return '';

    const normalizedLang = normalizeLang(lang);
    const locale = normalizedLang === 'en' ? 'en-US' : 'ja-JP';

    try {
        return new Date(dateStr).toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch {
        return '';
    }
}

function sanitizeHttpUrl(url, fallback = '#') {
    if (typeof url !== 'string') return fallback;
    const trimmed = url.trim();
    if (!trimmed) return fallback;
    return /^https?:\/\//i.test(trimmed) ? trimmed : fallback;
}

function buildArticleAriaLabel(titleText, lang) {
    const ui = getUi(lang);
    const safeTitle = titleText || ui.articleLabel;
    if (normalizeLang(lang) === 'en') {
        return `${ui.openArticle}: ${safeTitle}`;
    }
    return `${safeTitle}${ui.openArticle}`;
}

function createCard(item, lang = getCurrentLang()) {
    const normalizedLang = normalizeLang(lang);
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const normalizedType = normalizeType(item);
    const dateText = formatDate(item.date, normalizedLang);
    const safeUrl = sanitizeHttpUrl(item.url, '#');
    const safeTeaserUrl = sanitizeHttpUrl(item.teaser, '');
    const titleText = getLocalizedText(item, 'title', normalizedLang);
    const excerptText = getLocalizedText(item, 'excerpt', normalizedLang);

    const link = document.createElement('a');
    link.href = safeUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'text-decoration-none';
    link.setAttribute('aria-label', buildArticleAriaLabel(titleText, normalizedLang));

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
    badge.textContent = getTypeLabel(normalizedType, normalizedLang);

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

function createReadMoreButton(totalCount, visibleCount, lang = getCurrentLang()) {
    const normalizedLang = normalizeLang(lang);
    const ui = getUi(normalizedLang);
    const btnContainer = document.createElement('div');
    btnContainer.className = 'text-center mt-3';
    btnContainer.dataset.role = 'articles-readmore-wrap';

    const btn = document.createElement('button');
    btn.className = 'btn-read-more';
    btn.setAttribute('data-bs-toggle', 'offcanvas');
    btn.setAttribute('data-bs-target', '#articlesOffcanvas');
    btn.setAttribute('aria-controls', 'articlesOffcanvas');

    const remaining = totalCount - visibleCount;
    btn.textContent = remaining > 0
        ? `${ui.readMore} (${remaining})`
        : `${ui.viewAll} (${totalCount})`;

    btnContainer.appendChild(btn);
    return btnContainer;
}

function getFilteredArticles(articles, type) {
    if (type === 'all') return articles;
    return articles.filter((item) => normalizeType(item) === type);
}

function updateFilterButtons({ filterButtons, activeType, lang }) {
    const normalizedLang = normalizeLang(lang);
    filterButtons.forEach((btn) => {
        const type = btn.dataset.type || 'all';
        const isActive = type === activeType;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        btn.textContent = getTypeLabel(type, normalizedLang);
    });
}

function updateOffcanvasCount({ total, filtered, activeType, offcanvasCount, lang }) {
    if (!offcanvasCount) return;
    const ui = getUi(lang);

    if (activeType === 'all') {
        offcanvasCount.textContent = `${total} ${ui.countUnit}`;
        return;
    }
    offcanvasCount.textContent = `${filtered} / ${total} ${ui.countUnit}`;
}

function renderOffcanvasArticles({ articles, activeType, offcanvasGrid, offcanvasCount, lang }) {
    if (!offcanvasGrid) return;

    const filtered = getFilteredArticles(articles, activeType);
    offcanvasGrid.innerHTML = '';
    filtered.forEach((item) => offcanvasGrid.appendChild(createCard(item, lang)));
    updateOffcanvasCount({
        total: articles.length,
        filtered: filtered.length,
        activeType,
        offcanvasCount,
        lang,
    });
}

function setupFilters({ filterButtons }) {
    if (articlesState.filterBound) return;

    filterButtons.forEach((btn) => {
        if (btn.dataset.kessonFilterBound === '1') return;
        btn.dataset.kessonFilterBound = '1';

        btn.addEventListener('click', () => {
            const nextType = btn.dataset.type || 'all';
            if (nextType === articlesState.activeType) return;

            articlesState.activeType = nextType;
            const lang = getCurrentLang();
            updateFilterButtons({
                filterButtons: articlesState.filterButtons,
                activeType: articlesState.activeType,
                lang,
            });
            renderOffcanvasArticles({
                articles: articlesState.articles,
                activeType: articlesState.activeType,
                offcanvasGrid: articlesState.offcanvasGrid,
                offcanvasCount: articlesState.offcanvasCount,
                lang,
            });
        });
    });

    articlesState.filterBound = true;
}

function mergeArticleI18nFromMock(apiArticles, mockArticles) {
    if (!Array.isArray(apiArticles) || !Array.isArray(mockArticles)) return apiArticles;

    const indexByUrl = new Map();
    mockArticles.forEach((item) => {
        const key = sanitizeHttpUrl(item.url, '');
        if (key) indexByUrl.set(key, item);
    });

    return apiArticles.map((item) => {
        const key = sanitizeHttpUrl(item.url, '');
        const fallback = key ? indexByUrl.get(key) : null;
        if (!fallback) return item;

        return {
            ...item,
            title_ja: item.title_ja || fallback.title_ja,
            title_en: item.title_en || fallback.title_en,
            excerpt_ja: item.excerpt_ja || fallback.excerpt_ja,
            excerpt_en: item.excerpt_en || fallback.excerpt_en,
        };
    });
}

async function fetchArticles() {
    let apiArticles = null;
    let mockArticles = null;

    try {
        const res = await fetch(API_URL);
        if (res.ok) apiArticles = await res.json();
    } catch (e) {
        console.warn('[articles] API unavailable:', e.message);
    }

    try {
        const res = await fetch(MOCK_URL);
        if (res.ok) mockArticles = await res.json();
    } catch (e) {
        console.warn('[articles] Mock unavailable:', e.message);
    }

    if (apiArticles && mockArticles) {
        return mergeArticleI18nFromMock(apiArticles, mockArticles);
    }
    return apiArticles || mockArticles;
}

function renderMainArticles({ articles, grid, lang }) {
    if (!grid) return;

    grid.innerHTML = '';

    const initialItems = articles.slice(0, INITIAL_DISPLAY);
    initialItems.forEach((item) => grid.appendChild(createCard(item, lang)));

    const existingReadMore = grid.parentNode
        ? grid.parentNode.querySelector('[data-role="articles-readmore-wrap"]')
        : null;
    if (existingReadMore) existingReadMore.remove();

    if (articles.length > 0 && grid.parentNode) {
        const readMoreButton = createReadMoreButton(articles.length, initialItems.length, lang);
        grid.parentNode.insertBefore(readMoreButton, grid.nextSibling);
    }
}

function renderArticlesByLanguage(lang = getCurrentLang()) {
    const normalizedLang = normalizeLang(lang);

    renderMainArticles({
        articles: articlesState.articles,
        grid: articlesState.grid,
        lang: normalizedLang,
    });

    updateFilterButtons({
        filterButtons: articlesState.filterButtons,
        activeType: articlesState.activeType,
        lang: normalizedLang,
    });

    renderOffcanvasArticles({
        articles: articlesState.articles,
        activeType: articlesState.activeType,
        offcanvasGrid: articlesState.offcanvasGrid,
        offcanvasCount: articlesState.offcanvasCount,
        lang: normalizedLang,
    });
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

    articlesState.grid = grid;
    articlesState.errorEl = errorEl;
    articlesState.offcanvasGrid = offcanvasGrid;
    articlesState.offcanvasCount = offcanvasCount;
    articlesState.filterButtons = filterButtons;

    const articles = await fetchArticles();
    if (!articles || articles.length === 0) {
        if (errorEl) {
            errorEl.textContent = getUi(getCurrentLang()).loadingFailed;
            errorEl.classList.remove('d-none');
        }
        notifyArticlesReady('empty');
        return;
    }

    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    console.log('[articles] total:', articles.length, 'initial:', INITIAL_DISPLAY, 'remaining:', articles.length - INITIAL_DISPLAY);

    articlesState.articles = articles;
    articlesState.activeType = 'all';
    articlesState.initialized = true;

    setupFilters({ filterButtons });
    renderArticlesByLanguage(getCurrentLang());

    notifyArticlesReady('ok');
    applyArticlesDeepLinkIntent();
}

export function refreshArticlesLanguage() {
    if (!articlesState.initialized) return;
    renderArticlesByLanguage(getCurrentLang());
}

async function safeInitArticlesSection() {
    try {
        await initArticlesSection();
    } catch (error) {
        console.error('[articles] init failed:', error);
        notifyArticlesReady('error');
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener(LANG_CHANGE_EVENT, () => {
        refreshArticlesLanguage();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInitArticlesSection, { once: true });
} else {
    safeInitArticlesSection();
}
