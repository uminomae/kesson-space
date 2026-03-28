// about.js — About モーダル（cs repo 方式: DOM 動的生成）
// CHANGED(2026-03-28): #172 About文章を「サイトの楽しみ方ガイド」に書き換え

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
        // CHANGED(2026-03-28): #172 About文章を「サイトの楽しみ方ガイド」に書き換え
        body: [
            '「欠損駆動思考」とは、ふだん見過ごしてしまう"ずれ"や"違和感"を、問いとして拾い上げる考え方です。',
            '予想と現実のあいだに感じる小さなギャップ――それを私たちは「欠損」と呼んでいます。',
            'すぐに答えを出さず、その問いをしばらく手元に置いておくこと。この「抱える」プロセスから、新しい気づきが生まれます。',
            '現在、デザイン思考など既存の発想法との比較調査を進めながら、欠損駆動思考の特徴を整理しています。',
            '下にスクロールすると、くわしい内容をご覧いただけます。',
        ],
    },
    en: {
        title: 'About This Site',
        triggerAria: 'About this site',
        closeAria: 'Close',
        // CHANGED(2026-03-28): #172 Rewrite About text as visitor guide
        body: [
            '"Kesson-driven thinking" is a way of picking up the small mismatches and oddities we usually overlook, and treating them as questions worth asking.',
            'We call the gap you feel between what you expected and what actually happened a "kesson" (literally, a felt absence).',
            'Instead of rushing to an answer, you hold that question for a while. New insights emerge from this process of holding.',
            'We are currently comparing kesson-driven thinking with established creative methods such as design thinking to clarify what makes it distinctive.',
            'Scroll down to explore the details.',
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
