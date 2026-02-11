// lang-toggle.js — 言語切替トグルUI（右上、世界観に溶け込む控えめなテキスト）

import { detectLang, t, switchLang } from './i18n.js';

export function initLangToggle() {
    const lang = detectLang();
    const strings = t(lang);

    // --- スタイル注入 ---
    const style = document.createElement('style');
    style.textContent = `
        #lang-toggle {
            position: fixed;
            top: 28px;
            right: 32px;
            z-index: 50;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.2);
            font-family: "Yu Mincho", "YuMincho", "Hiragino Mincho ProN", serif;
            font-size: 0.85rem;
            letter-spacing: 0.15em;
            cursor: pointer;
            padding: 6px 0;
            transition: color 0.5s ease, text-shadow 0.5s ease;
            text-shadow: 0 0 12px rgba(100, 150, 255, 0.0);
        }
        #lang-toggle:hover {
            color: rgba(255, 255, 255, 0.55);
            text-shadow: 0 0 20px rgba(100, 150, 255, 0.2);
        }
    `;
    document.head.appendChild(style);

    // --- ボタン生成 ---
    const btn = document.createElement('button');
    btn.id = 'lang-toggle';
    btn.textContent = strings.toggleLabel;
    btn.addEventListener('click', switchLang);
    document.body.appendChild(btn);
}
