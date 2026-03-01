import { detectLang } from '../i18n.js';

const DATA_URL = './assets/creation-cards.json';

const UI_STRINGS = {
    ja: {
        open: '▸ 開く',
        noImage: 'NO IMAGE',
        local: 'ローカル',
        external: '外部',
        comingSoon: 'COMING SOON',
        comingSoonMeta: '公開準備中',
        comingSoonThumb: 'COMING SOON',
        loadingFailed: 'カードデータの読み込みに失敗しました。',
    },
    en: {
        open: '▸ Open',
        noImage: 'NO IMAGE',
        local: 'Local',
        external: 'External',
        comingSoon: 'COMING SOON',
        comingSoonMeta: 'In preparation',
        comingSoonThumb: 'COMING SOON',
        loadingFailed: 'Failed to load card data.',
    },
};

const cardsState = {
    cards: [],
    initialized: false,
    grid: null,
    errorEl: null,
};

function normalizeLang(lang) {
    return lang === 'en' ? 'en' : 'ja';
}

function getCurrentLang() {
    return normalizeLang(detectLang());
}

function getUi(lang) {
    return UI_STRINGS[normalizeLang(lang)];
}

function getLocalizedText(item, key, lang) {
    if (!item || typeof item !== 'object') return '';

    const normalizedLang = normalizeLang(lang);
    const fallbackLang = normalizedLang === 'en' ? 'ja' : 'en';
    const byLangKey = `${key}_${normalizedLang}`;
    const fallbackByLangKey = `${key}_${fallbackLang}`;

    if (typeof item[byLangKey] === 'string' && item[byLangKey].trim()) {
        return item[byLangKey].trim();
    }
    if (typeof item[fallbackByLangKey] === 'string' && item[fallbackByLangKey].trim()) {
        return item[fallbackByLangKey].trim();
    }
    if (typeof item[key] === 'string' && item[key].trim()) {
        return item[key].trim();
    }

    return '';
}

function resolveUrl(basePath, rawValue) {
    if (typeof rawValue !== 'string') return '';
    const value = rawValue.trim();
    if (!value) return '';

    try {
        if (/^https?:\/\//i.test(value)) {
            return value;
        }
        const safeBase = typeof basePath === 'string' && basePath.trim() ? basePath.trim() : './';
        return new URL(value, new URL(safeBase, window.location.href)).toString();
    } catch {
        return '';
    }
}

function fallbackDescription(url, lang) {
    try {
        const pathname = new URL(url).pathname;
        if (pathname && pathname !== '/') return pathname;
    } catch {
        // noop
    }
    return normalizeLang(lang) === 'ja' ? 'リンク先ページ' : 'Linked page';
}

function normalizeCard(id, item, basePath) {
    const isComingSoon = item?.status === 'coming_soon' || item?.comingSoon === true;
    const url = resolveUrl(basePath, item?.path);
    if (!url && !isComingSoon) return null;

    const thumbnail = resolveUrl(basePath, item?.thumbnail);
    let isExternal = true;
    if (!url) {
        isExternal = true;
    } else {
        try {
            isExternal = new URL(url).origin !== window.location.origin;
        } catch {
            isExternal = true;
        }
    }

    return {
        id,
        url,
        thumbnail,
        isExternal,
        isComingSoon,
        raw: item,
    };
}

function applyThumbnailFallback(thumbWrap, label) {
    thumbWrap.classList.add('creation-card-placeholder-thumb');
    thumbWrap.setAttribute('data-label', label);
}

function createCard(item, lang) {
    const ui = getUi(lang);
    const titleText = getLocalizedText(item.raw, 'label', lang) || item.id;
    const descriptionText = getLocalizedText(item.raw, 'description', lang) || fallbackDescription(item.url || '', lang);

    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const card = document.createElement(item.isComingSoon ? 'div' : 'a');
    card.className = 'card kesson-card creation-link-card h-100 text-decoration-none';
    if (item.isComingSoon) {
        card.classList.add('is-coming-soon');
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `${titleText} (${ui.comingSoon})`);
    } else {
        card.href = item.url;
        card.setAttribute('aria-label', `${titleText} (${ui.open})`);
        // Always open in new tab as per user request
        card.target = '_blank';
        card.rel = 'noopener';
    }

    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'creation-card-thumb';
    if (item.thumbnail) {
        const thumbImg = document.createElement('img');
        thumbImg.className = 'creation-card-thumb-image';
        thumbImg.src = item.thumbnail;
        thumbImg.alt = '';
        thumbImg.loading = 'lazy';
        thumbImg.decoding = 'async';
        thumbImg.addEventListener('error', () => {
            thumbImg.remove();
            applyThumbnailFallback(thumbWrap, ui.noImage);
        }, { once: true });
        thumbWrap.appendChild(thumbImg);
    } else {
        applyThumbnailFallback(thumbWrap, item.isComingSoon ? ui.comingSoonThumb : ui.noImage);
    }

    const body = document.createElement('div');
    body.className = 'card-body d-flex flex-column';

    const title = document.createElement('h6');
    title.className = 'card-title mb-2';
    title.textContent = titleText;

    const desc = document.createElement('p');
    desc.className = 'card-text mb-3 flex-grow-1';
    desc.textContent = descriptionText;

    // CTA button removed as per user request

    // Meta label removed as per user request
    // const meta = document.createElement('small');
    // meta.textContent = item.isComingSoon ? ui.comingSoonMeta : (item.isExternal ? ui.external : ui.local);

    body.appendChild(title);
    body.appendChild(desc);
    // body.appendChild(meta); // Removed
    card.appendChild(thumbWrap);
    card.appendChild(body);
    col.appendChild(card);
    return col;
}

function renderCards(lang = getCurrentLang()) {
    if (!cardsState.grid) return;

    cardsState.grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    cardsState.cards.forEach((item) => {
        frag.appendChild(createCard(item, lang));
    });
    cardsState.grid.appendChild(frag);
}

function setError(message = '') {
    if (!cardsState.errorEl) return;
    if (!message) {
        cardsState.errorEl.textContent = '';
        cardsState.errorEl.classList.add('d-none');
        return;
    }
    cardsState.errorEl.textContent = message;
    cardsState.errorEl.classList.remove('d-none');
}

async function fetchCards() {
    const response = await fetch(DATA_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const basePath = typeof data?.basePath === 'string' ? data.basePath : './';
    const presets = data?.presets && typeof data.presets === 'object' ? data.presets : {};

    return Object.entries(presets)
        .map(([id, item]) => normalizeCard(id, item, basePath))
        .filter(Boolean)
        .sort((a, b) => a.id.localeCompare(b.id));
}

async function initCreationCardsSection() {
    cardsState.grid = document.getElementById('creation-cards-grid');
    cardsState.errorEl = document.getElementById('creation-cards-error');
    if (!cardsState.grid) return;

    try {
        cardsState.cards = await fetchCards();
        setError('');
        renderCards();
        cardsState.initialized = true;
    } catch (error) {
        cardsState.cards = [];
        cardsState.initialized = false;
        setError(getUi(getCurrentLang()).loadingFailed);
        console.warn('[creation-cards] init failed:', error);
    }
}

export function refreshCreationCardsLanguage() {
    const lang = getCurrentLang();
    if (cardsState.errorEl && !cardsState.initialized) {
        setError(getUi(lang).loadingFailed);
        return;
    }
    if (!cardsState.initialized) return;
    renderCards(lang);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initCreationCardsSection().catch(() => {});
    }, { once: true });
} else {
    initCreationCardsSection().catch(() => {});
}
