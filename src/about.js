// about.js — About モーダル（cs repo 方式: DOM 動的生成）
// CHANGED(2026-03-27): #172

import { detectLang, LANG_CHANGE_EVENT } from './i18n.js';

let overlayEl;
let titleEl;
let bodyEl;
let triggerBtnEl;
let closeBtnEl;

const STRINGS = {
    ja: {
        title: 'このサイトについて',
        triggerAria: 'このサイトについて',
        closeAria: '閉じる',
        body: [
            '人と AI の協働から生まれる、実験的なデジタル空間です。',
            'Three.js によるインタラクティブな 3D シーンと、制作プロセスを記録した devlog で構成されています。',
            '「間（けっそん）」—— 欠けているからこそ生まれる余白と可能性を探求します。',
        ],
    },
    en: {
        title: 'About This Site',
        triggerAria: 'About this site',
        closeAria: 'Close',
        body: [
            'An experimental digital space born from human–AI collaboration.',
            'Built with interactive 3D scenes powered by Three.js and a devlog documenting the creative process.',
            '"Kesson" (間) — exploring the space and possibility that emerges from what is absent.',
        ],
    },
};

function t(lang) {
    return STRINGS[lang] || STRINGS.ja;
}

function getCurrentLang() {
    return detectLang();
}

function createAboutButton() {
    const overlay = document.getElementById('overlay');
    if (!overlay) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'about-trigger';
    btn.innerHTML = '<span class="about-trigger__letter">i</span>';

    btn.style.marginTop = '0.8rem';
    btn.addEventListener('click', () => openAbout());
    overlay.appendChild(btn);
    triggerBtnEl = btn;
    setAboutLanguage(getCurrentLang());
}

function createAboutOverlay() {
    const el = document.createElement('div');
    el.id = 'about-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.tabIndex = -1;

    const glass = document.createElement('div');
    glass.className = 'about-glass';

    closeBtnEl = document.createElement('button');
    closeBtnEl.type = 'button';
    closeBtnEl.className = 'about-close';
    closeBtnEl.textContent = '✕';

    titleEl = document.createElement('h2');
    titleEl.className = 'about-title';

    bodyEl = document.createElement('div');
    bodyEl.className = 'about-body';

    glass.appendChild(closeBtnEl);
    glass.appendChild(titleEl);
    glass.appendChild(bodyEl);
    el.appendChild(glass);
    document.body.appendChild(el);

    closeBtnEl.addEventListener('click', () => closeAbout());
    el.addEventListener('click', (e) => {
        if (e.target === el) closeAbout();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlayEl?.classList.contains('visible')) closeAbout();
    });

    overlayEl = el;
}

function renderContent(lang) {
    const d = t(lang);
    titleEl.textContent = d.title;
    bodyEl.innerHTML = '';
    for (const text of d.body) {
        const p = document.createElement('p');
        p.textContent = text;
        bodyEl.appendChild(p);
    }
}

function openAbout() {
    if (!overlayEl) return;
    const lang = getCurrentLang();
    renderContent(lang);

    overlayEl.classList.add('visible');
    overlayEl.setAttribute('aria-label', t(lang).title);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlayEl.classList.add('open');
        });
    });

    overlayEl.focus();
}

function closeAbout() {
    if (!overlayEl) return;
    overlayEl.classList.remove('open');

    const onEnd = () => {
        overlayEl.classList.remove('visible');
        document.body.style.overflow = '';
        overlayEl.removeEventListener('transitionend', onEnd);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        onEnd();
    } else {
        overlayEl.addEventListener('transitionend', onEnd, { once: true });
        setTimeout(onEnd, 600);
    }
}

export function setAboutLanguage(lang) {
    const aboutStrings = t(lang);
    if (triggerBtnEl) {
        triggerBtnEl.setAttribute('aria-label', aboutStrings.triggerAria);
    }
    if (closeBtnEl) {
        closeBtnEl.setAttribute('aria-label', aboutStrings.closeAria);
    }
    if (overlayEl?.classList.contains('visible')) {
        renderContent(lang);
        overlayEl.setAttribute('aria-label', aboutStrings.title);
    }
}

export function initAbout() {
    createAboutButton();
    createAboutOverlay();

    window.addEventListener(LANG_CHANGE_EVENT, (e) => {
        setAboutLanguage(e.detail?.lang || getCurrentLang());
    });
}
