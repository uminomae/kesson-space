// DECISION: language/session normalization is extracted as a pure model layer so render/offcanvas code can stay focused
// on DOM and interaction state. This split also preserves testability for locale fallbacks and URL shaping. (Phase B-2 / 2026-02-19)

export const DEVLOG_DEFAULT_COVER = './assets/devlog/covers/default.svg';
export const DEVLOG_RETURN_TTL_MS = 30 * 60 * 1000;

const SUPPORTED_LANGS = new Set(['ja', 'en']);

const DEVLOG_UI_STRINGS = {
    ja: {
        openLabel: 'Devlogを開く',
        loading: '読み込み中...',
        sessionUnit: 'セッション',
        coverFallbackNote: 'カバー画像の英語版は準備中です',
    },
    en: {
        openLabel: 'Open devlog session',
        loading: 'Loading...',
        sessionUnit: 'sessions',
        coverFallbackNote: 'English cover image pending',
    },
};

export function normalizeLang(lang) {
    return SUPPORTED_LANGS.has(lang) ? lang : 'ja';
}

export function getCurrentLang() {
    if (typeof document === 'undefined') return 'ja';
    return normalizeLang(document.documentElement.lang || 'ja');
}

export function getUiStrings(lang) {
    return DEVLOG_UI_STRINGS[normalizeLang(lang)];
}

export function getSessionText(session, key, lang) {
    if (!session || typeof session !== 'object') return '';
    const normalizedLang = normalizeLang(lang);
    const fallbackLang = normalizedLang === 'en' ? 'ja' : 'en';
    const byLangKey = `${key}_${normalizedLang}`;
    const fallbackByLangKey = `${key}_${fallbackLang}`;

    if (typeof session[byLangKey] === 'string' && session[byLangKey].trim()) {
        return session[byLangKey];
    }
    if (typeof session[fallbackByLangKey] === 'string' && session[fallbackByLangKey].trim()) {
        return session[fallbackByLangKey];
    }

    const value = session[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (value && typeof value === 'object') {
        if (typeof value[normalizedLang] === 'string' && value[normalizedLang].trim()) return value[normalizedLang];
        if (typeof value[fallbackLang] === 'string' && value[fallbackLang].trim()) return value[fallbackLang];
    }
    return '';
}

export function getSessionTitle(session, lang) {
    return getSessionText(session, 'title', lang) || session.id || '';
}

export function getSessionDateRange(session, lang) {
    return getSessionText(session, 'date_range', lang) || session.id || '';
}

export function getSessionSummary(session, lang) {
    const normalizedLang = normalizeLang(lang);
    const byLangKey = `summary_${normalizedLang}`;
    if (typeof session?.[byLangKey] === 'string' && session[byLangKey].trim()) {
        return session[byLangKey].trim();
    }
    const byLang = session?.summary_by_lang;
    if (byLang && typeof byLang === 'object' && typeof byLang[normalizedLang] === 'string' && byLang[normalizedLang].trim()) {
        return byLang[normalizedLang].trim();
    }
    return '';
}

export function buildSessionHref(sessionId, lang) {
    const params = new URLSearchParams();
    params.set('id', sessionId);
    if (normalizeLang(lang) === 'en') params.set('lang', 'en');
    return `./devlog.html?${params.toString()}`;
}

function readSessionCoverValue(session, lang) {
    if (!session || typeof session !== 'object') return '';
    const normalizedLang = normalizeLang(lang);
    const fallbackLang = normalizedLang === 'en' ? 'ja' : 'en';

    const byLang = session.cover_by_lang;
    if (byLang && typeof byLang === 'object') {
        if (typeof byLang[normalizedLang] === 'string' && byLang[normalizedLang].trim()) return byLang[normalizedLang];
        if (typeof byLang[fallbackLang] === 'string' && byLang[fallbackLang].trim()) return byLang[fallbackLang];
    }

    const key = `cover_${normalizedLang}`;
    if (typeof session[key] === 'string' && session[key].trim()) return session[key];

    const fallbackKey = `cover_${fallbackLang}`;
    if (typeof session[fallbackKey] === 'string' && session[fallbackKey].trim()) return session[fallbackKey];

    if (typeof session.cover === 'string' && session.cover.trim()) return session.cover;
    return '';
}

export function resolveSessionCover(session, lang) {
    const normalizedLang = normalizeLang(lang);

    if (normalizedLang === 'en') {
        const explicitEnCover = (() => {
            if (typeof session?.cover_en === 'string' && session.cover_en.trim()) return session.cover_en;
            const byLang = session?.cover_by_lang;
            if (byLang && typeof byLang === 'object' && typeof byLang.en === 'string' && byLang.en.trim()) {
                return byLang.en;
            }
            return '';
        })();

        if (explicitEnCover) {
            return { src: explicitEnCover, localized: true };
        }

        return { src: DEVLOG_DEFAULT_COVER, localized: false };
    }

    const localizedCover = readSessionCoverValue(session, normalizedLang);
    if (localizedCover) {
        return { src: localizedCover, localized: true };
    }

    return { src: DEVLOG_DEFAULT_COVER, localized: false };
}

export function getSessionEndValue(session) {
    const end = session.end || session.start;
    const value = end ? Date.parse(end) : 0;
    return Number.isNaN(value) ? 0 : value;
}

export function generateDemoData() {
    return [
        { id: 'session-001', title_ja: 'Part 1: 基盤構築', title_en: 'Part 1: Foundation', date_range: '2025/02-10 〜 02-11', cover: './assets/devlog/covers/session-001.jpg', log_content: null },
        { id: 'session-002', title_ja: 'Part 2: UX実装', title_en: 'Part 2: UX Implementation', date_range: '2025/02-12', cover: './assets/devlog/covers/session-002.jpg', log_content: null },
        { id: 'session-003', title_ja: 'Part 3: モバイル対応', title_en: 'Part 3: Mobile Support', date_range: '2025/02-13', cover: './assets/devlog/covers/session-003.jpg', log_content: null },
        { id: 'session-004', title_ja: 'Part 4: コンテンツ統合', title_en: 'Part 4: Content Integration', date_range: '2025/02-14', cover: './assets/devlog/covers/session-004.jpg', log_content: null },
        { id: 'session-005', title_ja: 'Part 5: Read More UI', title_en: 'Part 5: Read More UI', date_range: '2025/02-15', cover: './assets/devlog/covers/session-005.jpg', log_content: null },
    ];
}
