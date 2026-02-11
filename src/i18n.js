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
        nav: [
            { label: '一般向け', url: PDF_BASE + 'kesson-general.pdf' },
            { label: '設計者向け', url: PDF_BASE + 'kesson-designer.pdf' },
            { label: '学術版', url: PDF_BASE + 'kesson-academic.pdf' },
        ],
    },
    en: {
        title: 'Kesson-Driven Thinking',
        subtitle: 'Kesson Space',
        toggleLabel: '日本語',
        taglines: [
            "Don't discard what's missing — turn it into a question",
            'Embrace the drift between prediction and reality',
        ],
        nav: [
            // TODO: 英語版PDF作成後にURLを差し替え
            { label: 'General', url: PDF_BASE + 'kesson-general-en.pdf' },
            { label: 'For Designers', url: PDF_BASE + 'kesson-designer-en.pdf' },
            { label: 'Academic', url: PDF_BASE + 'kesson-academic-en.pdf' },
        ],
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
    window.location.href = url.toString();
}
