// about.js — About モーダルの開閉 + Markdown コンテンツ読み込み
// CHANGED(2026-03-27)

import { detectLang, LANG_CHANGE_EVENT } from './i18n.js';

let _modal;
let _body;
let _currentLang;

const CONTENT_PATH = {
    ja: 'content/about/about.md',
    en: 'content/about/about.en.md',
};

function parseMd(md) {
    return md
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|p])(.+)/gm, '<p>$1</p>')
        .replace(/<p><\/p>/g, '');
}

async function loadContent(lang) {
    const url = CONTENT_PATH[lang] || CONTENT_PATH.ja;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status);
        const md = await res.text();
        return parseMd(md);
    } catch {
        return '<p>Content not available.</p>';
    }
}

function open() {
    if (!_modal) return;
    _modal.classList.add('open');
    _modal.setAttribute('aria-hidden', 'false');
}

function close() {
    if (!_modal) return;
    _modal.classList.remove('open');
    _modal.setAttribute('aria-hidden', 'true');
}

async function refreshContent(lang) {
    if (!_body || lang === _currentLang) return;
    _currentLang = lang;
    _body.innerHTML = await loadContent(lang);
}

export async function initAbout() {
    _modal = document.getElementById('about-modal');
    _body = document.getElementById('about-body');
    if (!_modal || !_body) return;

    const lang = detectLang();
    await refreshContent(lang);

    // Open trigger
    document.querySelectorAll('[data-about-open]').forEach((el) => {
        el.addEventListener('click', open);
    });

    // Close triggers (backdrop + close button)
    document.querySelectorAll('[data-about-close]').forEach((el) => {
        el.addEventListener('click', close);
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _modal.classList.contains('open')) close();
    });

    // Language change
    window.addEventListener(LANG_CHANGE_EVENT, (e) => {
        refreshContent(e.detail?.lang || detectLang());
    });
}
