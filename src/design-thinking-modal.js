// design-thinking-modal.js — Design Thinking modal (about.js pattern: dynamic DOM)
// CHANGED(2026-03-28): #180

import { detectLang, LANG_CHANGE_EVENT } from './i18n.js';

let overlayEl;
let titleEl;
let bodyEl;
let closeBtnEl;

const PROJECT_DESIGN_URL = 'https://uminomae.github.io/project-design/?knowledge=design-thinking';

const STRINGS = {
    ja: {
        title: 'デザイン思考とは',
        closeAria: '閉じる',
        body: [
            'デザイン思考は、ユーザーへの共感を起点に、課題の定義、アイデアの創出、プロトタイプの検証を繰り返す問題解決のアプローチです。',
            'しかし、その普及のなかで「5ステップを順に踏めばいい」という形骸化が進みました。共感ワークショップやポストイット・ブレストが目的化し、実装や組織変革につながらないケースが指摘されています。',
            'このプロジェクトでは、デザイン思考の有効な核（abduction、frame creation、反復的プロトタイピング）と、失われやすい本質を学術文献の横断調査から整理しました。',
            '欠損駆動思考は、デザイン思考の「共感」だけでは拾いきれない違和感や欠けを、問いとして保持するための補助線です。',
        ],
        linkText: '詳しい調査ノートは Project Design サイトで公開しています。',
    },
    en: {
        title: 'What is Design Thinking?',
        closeAria: 'Close',
        body: [
            'Design thinking is a problem-solving approach that starts from empathy with users, then iterates through problem definition, ideation, and prototype testing.',
            'As the approach spread, it often became reduced to "follow five steps in order." Empathy workshops and Post-it brainstorms turned into ends in themselves, frequently failing to lead to implementation or organizational change.',
            'This project surveyed academic literature to identify the valid core of design thinking — abduction, frame creation, and iterative prototyping — and the essence that tends to be lost.',
            'Kesson-Driven Thinking offers a complementary lens: it holds the discomfort and gaps that empathy alone cannot capture, treating them as questions worth keeping.',
        ],
        linkText: 'Detailed research notes are available on the Project Design site.',
    },
};

function t(lang) {
    return STRINGS[lang] || STRINGS.ja;
}

function getCurrentLang() {
    return detectLang();
}

function createOverlay() {
    const el = document.createElement('div');
    el.id = 'dt-modal-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.tabIndex = -1;

    const glass = document.createElement('div');
    glass.className = 'about-glass';

    closeBtnEl = document.createElement('button');
    closeBtnEl.type = 'button';
    closeBtnEl.className = 'about-close';
    closeBtnEl.textContent = '\u2715';

    titleEl = document.createElement('h2');
    titleEl.className = 'about-title';

    bodyEl = document.createElement('div');
    bodyEl.className = 'about-body';

    glass.appendChild(closeBtnEl);
    glass.appendChild(titleEl);
    glass.appendChild(bodyEl);
    el.appendChild(glass);
    document.body.appendChild(el);

    closeBtnEl.addEventListener('click', () => closeModal());
    el.addEventListener('click', (e) => {
        if (e.target === el) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlayEl?.classList.contains('visible')) closeModal();
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
    // Last paragraph with link
    const linkP = document.createElement('p');
    const a = document.createElement('a');
    a.href = PROJECT_DESIGN_URL;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = d.linkText;
    a.style.color = 'rgba(165, 202, 255, 0.92)';
    a.style.textDecoration = 'underline';
    a.style.textDecorationColor = 'rgba(165, 202, 255, 0.3)';
    linkP.appendChild(a);
    bodyEl.appendChild(linkP);
}

function openModal() {
    if (\!overlayEl) return;
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

function closeModal() {
    if (\!overlayEl) return;
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

function setLanguage(lang) {
    if (closeBtnEl) {
        closeBtnEl.setAttribute('aria-label', t(lang).closeAria);
    }
    if (overlayEl?.classList.contains('visible')) {
        renderContent(lang);
        overlayEl.setAttribute('aria-label', t(lang).title);
    }
}

export function initDesignThinkingModal() {
    createOverlay();

    // Attach click handlers to cards with data-open-dt-modal
    document.addEventListener('click', (e) => {
        const card = e.target.closest('[data-open-dt-modal]');
        if (card) openModal();
    });

    // Also handle keyboard activation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const card = e.target.closest('[data-open-dt-modal]');
            if (card) {
                e.preventDefault();
                openModal();
            }
        }
    });

    window.addEventListener(LANG_CHANGE_EVENT, (e) => {
        setLanguage(e.detail?.lang || getCurrentLang());
    });
}
