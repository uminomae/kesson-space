// lang-toggle.js — 言語切替トグルUI（右上、世界観に溶け込む控えめなテキスト）
// ISS-001: aria-label 追加

import { detectLang, t, switchLang } from './i18n.js';

export function initLangToggle() {
    const lang = detectLang();
    const strings = t(lang);

    // --- スタイル注入 ---
    const style = document.createElement('style');
    style.textContent = `
        #lang-toggle {
            position: fixed;
            top: 3%;
            right: 3%;
            z-index: 50;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.4);
            font-family: "Yu Mincho", "YuMincho", "Hiragino Mincho ProN", serif;
            font-size: clamp(0.5rem, 2.5vmin, 0.85rem);
            letter-spacing: clamp(0.08em, 0.4vmin, 0.15em);
            cursor: pointer;
            padding: 6px 0;
            transition: color 0.5s ease, text-shadow 0.5s ease, opacity 0.3s ease;
            text-shadow: 0 0 12px rgba(100, 150, 255, 0.0);
        }
        #lang-toggle:hover {
            color: rgba(255, 255, 255, 0.55);
            text-shadow: 0 0 20px rgba(100, 150, 255, 0.2);
        }
        #lang-toggle:focus {
            outline: 2px solid rgba(100, 150, 255, 0.8);
            outline-offset: 4px;
        }
    `;
    document.head.appendChild(style);

    // --- ボタン生成 ---
    const btn = document.createElement('button');
    btn.id = 'lang-toggle';
    btn.textContent = strings.toggleLabel;
    // CHANGED: aria-label 追加
    btn.setAttribute('aria-label',
        lang === 'ja' ? '言語を英語に切り替え' : 'Switch language to Japanese');
    btn.addEventListener('click', switchLang);
    document.body.appendChild(btn);
}
