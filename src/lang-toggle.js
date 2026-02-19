// lang-toggle.js — 言語切替トグルUI
// Topbar内の #lang-toggle ボタンを利用

import { detectLang, LANG_CHANGE_EVENT, t, switchLang } from './i18n.js';

function applyToggleText(btn, lang) {
    const strings = t(lang);
    btn.textContent = strings.toggleLabel;
    btn.setAttribute(
        'aria-label',
        lang === 'ja' ? '言語を英語に切り替え' : 'Switch language to Japanese'
    );
}

export function initLangToggle() {
    const lang = detectLang();
    const btn = document.getElementById('lang-toggle');
    if (!(btn instanceof HTMLButtonElement)) return;

    applyToggleText(btn, lang);

    if (btn.dataset.kessonLangToggleBound !== '1') {
        btn.dataset.kessonLangToggleBound = '1';
        btn.addEventListener('click', switchLang);
    }

    if (btn.dataset.kessonLangChangeBound !== '1') {
        btn.dataset.kessonLangChangeBound = '1';
        window.addEventListener(LANG_CHANGE_EVENT, (event) => {
            const nextLang = event.detail?.lang || detectLang();
            applyToggleText(btn, nextLang);
        });
    }
}
