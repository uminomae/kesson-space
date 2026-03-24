// i18n.js — 言語切替（?lang=en / ?lang=ja）

import { armManualRestoration, lockScroll, requestScroll, unlockScroll } from './scroll-coordinator.js';

const PDF_BASE_JA = 'https://uminomae.github.io/pjdhiro/assets/kesson/guides/ja/pdf/';
const PDF_BASE_EN = 'https://uminomae.github.io/pjdhiro/assets/kesson/guides/en/pdf/';
const RAW_BASE = 'https://raw.githubusercontent.com/uminomae/pjdhiro/main';
const DRAFT_BASE_JA = `${RAW_BASE}/assets/kesson/guides/ja/md/`;
const DRAFT_BASE_EN = `${RAW_BASE}/assets/kesson/guides/en/md/`;
export const LANG_CHANGE_EVENT = 'kesson:lang-change';

const STRINGS = {
    ja: {
        title: '欠損駆動思考',
        subtitle: 'Kesson Space',
        toggleLabel: 'English',
        taglines: [
            '欠けを捨てず、問いに変える',
            '予測のズレを、抱き続ける',
        ],
        credit: 'AIとの協働で探索中',
        creditSignature: 'Project Designer: pjdhiro',
        nav: [
            { label: '一般向け', url: PDF_BASE_JA + 'kesson-general.pdf', pdfUrl: PDF_BASE_JA + 'kesson-general.pdf', draftUrl: DRAFT_BASE_JA + 'kesson-general.md' },
            { label: '設計者向け', url: PDF_BASE_JA + 'kesson-designer.pdf', pdfUrl: PDF_BASE_JA + 'kesson-designer.pdf', draftUrl: DRAFT_BASE_JA + 'kesson-designer.md' },
            { label: '学術版', url: PDF_BASE_JA + 'kesson-academic.pdf', pdfUrl: PDF_BASE_JA + 'kesson-academic.pdf', draftUrl: DRAFT_BASE_JA + 'kesson-academic.md' },
        ],
        gem: {
            label: 'Gem',
            url: 'https://gemini.google.com/gem/1KtKkuMSS95qeHBArr3-LgH4Y0XCOs-z-?usp=sharing',
        },
        xLogo: {
            label: 'X',
            url: 'https://x.com/pjdhiro',
        },
    },
    en: {
        title: 'Kesson-Driven Thinking',
        subtitle: 'Kesson Space',
        toggleLabel: '日本語',
        taglines: [
            "Don't discard what's missing \u2014 turn it into a question",
            'Embrace the drift between prediction and reality',
        ],
        credit: 'Exploring with AI collaboration',
        creditSignature: 'Project Designer: pjdhiro',
        nav: [
            { label: 'General', url: PDF_BASE_EN + 'kesson-general.pdf', pdfUrl: PDF_BASE_EN + 'kesson-general.pdf', draftUrl: DRAFT_BASE_EN + 'kesson-general.md' },
            { label: 'For Designers', url: PDF_BASE_EN + 'kesson-designer.pdf', pdfUrl: PDF_BASE_EN + 'kesson-designer.pdf', draftUrl: DRAFT_BASE_EN + 'kesson-designer.md' },
            { label: 'Academic', url: PDF_BASE_EN + 'kesson-academic.pdf', pdfUrl: PDF_BASE_EN + 'kesson-academic.pdf', draftUrl: DRAFT_BASE_EN + 'kesson-academic.md' },
        ],
        gem: {
            label: 'Gem',
            url: 'https://gemini.google.com/gem/1KtKkuMSS95qeHBArr3-LgH4Y0XCOs-z-?usp=sharing',
        },
        xLogo: {
            label: 'X',
            url: 'https://x.com/pjdhiro',
        },
    },
};

// --- 現在の言語を検出 ---
export function detectLang() {
    return new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'ja';
}

// --- 翻訳テキスト取得 ---
export function t(lang) {
    return STRINGS[lang] || STRINGS.ja;
}

function normalizeLang(lang) {
    return lang === 'en' ? 'en' : 'ja';
}

// URL・DOM・通知を一括で更新（リロードなし）
export function setLang(nextLang, { scrollToTop = true, reload = false } = {}) {
    const previous = detectLang();
    const next = normalizeLang(nextLang);

    if (previous === next) return next;

    const url = new URL(window.location);
    if (next === 'ja') {
        url.searchParams.delete('lang');
    } else {
        url.searchParams.set('lang', next);
    }

    if (reload) {
        armManualRestoration('lang-switch');
        window.location.assign(url.toString());
        return next;
    }

    lockScroll('lang-switch');
    try {
        window.history.replaceState(window.history.state, '', url.toString());
        document.documentElement.lang = next;

        window.dispatchEvent(new CustomEvent(LANG_CHANGE_EVENT, {
            detail: { lang: next, previous },
        }));

        if (scrollToTop) {
            // Scroll is requested while locked; coordinator executes once after unlock.
            requestScroll(0, 'lang-switch', { behavior: 'auto' });
        }
    } finally {
        unlockScroll('lang-switch');
    }

    return next;
}

// --- 言語トグル（URLパラメータ切替）---
export function switchLang() {
    const next = detectLang() === 'ja' ? 'en' : 'ja';
    return setLang(next);
}
