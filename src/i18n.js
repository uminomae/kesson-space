// i18n.js — 言語切替（?lang=en / ?lang=ja）

const PDF_BASE = 'https://uminomae.github.io/pjdhiro/assets/pdf/';

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
        creditSignature: 'Project Designer — pjdhiro',
        nav: [
            { label: '一般向け', url: PDF_BASE + 'kesson-general.pdf' },
            { label: '設計者向け', url: PDF_BASE + 'kesson-designer.pdf' },
            { label: '学術版', url: PDF_BASE + 'kesson-academic.pdf' },
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
        creditSignature: 'Project Designer \u2014 pjdhiro',
        nav: [
            { label: 'General', url: PDF_BASE + 'kesson-general-en.pdf' },
            { label: 'For Designers', url: PDF_BASE + 'kesson-designer-en.pdf' },
            { label: 'Academic', url: PDF_BASE + 'kesson-academic-en.pdf' },
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

// --- 言語トグル（URLパラメータ切替でリロード）---
export function switchLang() {
    const current = detectLang();
    const next = current === 'ja' ? 'en' : 'ja';

    const url = new URL(window.location);
    if (next === 'ja') {
        url.searchParams.delete('lang');
    } else {
        url.searchParams.set('lang', next);
    }
    // Fix #42: リロード前に明示的にトップへ戻す（scrollRestoration は index.html <head> で初期化）
    window.scrollTo(0, 0);
    window.location.href = url.toString();
}
