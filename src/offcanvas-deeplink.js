const OPEN_QUERY_KEY = 'open';
const SCROLL_QUERY_KEY = 'scroll';

const PANEL_BY_TOKEN = {
    articles: 'articles',
    article: 'articles',
    readmore: 'articles',
    articlesoffcanvas: 'articles',
    devlog: 'devlog',
    devlogs: 'devlog',
    devlogoffcanvas: 'devlog',
};

const SCROLL_TARGET_BY_TOKEN = {
    articles: 'articles-heading',
    'articles-section': 'articles-heading',
    'articles-heading': 'articles-heading',
    article: 'articles-heading',
    readmore: 'articles-readmore',
    'articles-readmore': 'articles-readmore',
    devlog: 'devlog-heading',
    'devlog-gallery-section': 'devlog-heading',
    'devlog-heading': 'devlog-heading',
    'devlog-readmore': 'devlog-readmore',
};

function normalizeToken(value) {
    return String(value || '').trim().toLowerCase();
}

function tokenizeQueryValues(search, key) {
    const params = new URLSearchParams(search);
    const values = params.getAll(key);
    const tokens = [];

    values.forEach((value) => {
        value.split(',').forEach((part) => {
            const token = normalizeToken(part);
            if (token) tokens.push(token);
        });
    });

    return tokens;
}

function tokenizeHash(hash) {
    const token = normalizeToken(String(hash || '').replace(/^#/, ''));
    return token ? [token] : [];
}

function resolvePanel(tokens) {
    for (const token of tokens) {
        const panel = PANEL_BY_TOKEN[token];
        if (panel) return panel;
    }
    return null;
}

function resolveScrollTarget(tokens) {
    for (const token of tokens) {
        const target = SCROLL_TARGET_BY_TOKEN[token];
        if (target) return target;
    }
    return null;
}

function deriveDefaultScrollTargetFromPanel(panel) {
    if (panel === 'articles') return 'articles-readmore';
    if (panel === 'devlog') return 'devlog-readmore';
    return null;
}

function parseIntent() {
    const openTokens = tokenizeQueryValues(window.location.search, OPEN_QUERY_KEY);
    const openPanel = resolvePanel(openTokens);

    const scrollTokens = tokenizeQueryValues(window.location.search, SCROLL_QUERY_KEY);
    let scrollTarget = resolveScrollTarget(scrollTokens);

    // hash はスクロール先のみ解釈し、Offcanvas開閉判定には使わない。
    if (!scrollTarget) {
        scrollTarget = resolveScrollTarget(tokenizeHash(window.location.hash));
    }

    // open指定のみの場合は、対応セクションのRead More位置までスクロールしてから開く。
    if (!scrollTarget && openPanel) {
        scrollTarget = deriveDefaultScrollTargetFromPanel(openPanel);
    }

    return { openPanel, scrollTarget };
}

export function getDeepLinkIntent() {
    if (typeof window === 'undefined') return { openPanel: null, scrollTarget: null };

    if (Object.prototype.hasOwnProperty.call(window, '__kessonDeepLinkIntent')) {
        return window.__kessonDeepLinkIntent;
    }

    const intent = parseIntent();
    window.__kessonDeepLinkIntent = intent;
    return intent;
}

export function getRequestedScrollTarget() {
    return getDeepLinkIntent().scrollTarget;
}

export function shouldOpenOffcanvas(panelName) {
    return getDeepLinkIntent().openPanel === panelName;
}

export function hasDeepLinkIntent() {
    const intent = getDeepLinkIntent();
    return Boolean(intent.openPanel || intent.scrollTarget);
}
