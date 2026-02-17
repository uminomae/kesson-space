const QUERY_KEY = 'open';

const ARTICLES_TOKENS = new Set([
    'articles',
    'article',
    'readmore',
    'articlesoffcanvas',
    'articles-section',
]);

const DEVLOG_TOKENS = new Set([
    'devlog',
    'devlogs',
    'devlogoffcanvas',
    'devlog-gallery',
    'devlog-gallery-section',
]);

function normalizeToken(value) {
    return String(value || '').trim().toLowerCase();
}

function tokenizeOpenParams(search) {
    const params = new URLSearchParams(search);
    const values = params.getAll(QUERY_KEY);
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
    const token = normalizeToken(hash.replace(/^#/, ''));
    return token ? [token] : [];
}

function resolvePanelFromTokens(tokens) {
    for (const token of tokens) {
        if (ARTICLES_TOKENS.has(token)) return 'articles';
        if (DEVLOG_TOKENS.has(token)) return 'devlog';
    }
    return null;
}

function parseRequestedOffcanvas() {
    const fromQuery = tokenizeOpenParams(window.location.search);
    if (fromQuery.length > 0) {
        return resolvePanelFromTokens(fromQuery);
    }

    const fromHash = tokenizeHash(window.location.hash);
    return resolvePanelFromTokens(fromHash);
}

export function getRequestedOffcanvas() {
    if (typeof window === 'undefined') return null;

    if (Object.prototype.hasOwnProperty.call(window, '__kessonRequestedOffcanvas')) {
        return window.__kessonRequestedOffcanvas;
    }

    const requested = parseRequestedOffcanvas();
    window.__kessonRequestedOffcanvas = requested;
    return requested;
}

export function shouldOpenOffcanvas(panelName) {
    return getRequestedOffcanvas() === panelName;
}
