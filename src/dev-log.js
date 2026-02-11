// dev-log.js — 開発ログの描画とスクロール演出

import { detectLang, t } from './i18n.js';

/**
 * 開発ログセクションを描画
 */
export function renderDevLog() {
    const container = document.getElementById('dev-log');
    if (!container) return;

    const lang = detectLang();
    const strings = t(lang);
    const log = strings.devLog;
    if (!log) return;

    // ヘッダー
    const header = document.createElement('div');
    header.className = 'log-header';
    header.textContent = log.header;
    container.appendChild(header);

    // 日付
    const date = document.createElement('div');
    date.className = 'log-date';
    date.textContent = log.date;
    container.appendChild(date);

    // 段落（日本語メイン）
    const jaLog = strings.devLog;
    const enStrings = t(lang === 'ja' ? 'en' : 'ja');
    const enLog = enStrings.devLog;

    jaLog.paragraphs.forEach((text, i) => {
        const p = document.createElement('p');
        p.className = 'log-paragraph';
        p.textContent = text;
        p.style.opacity = '0';
        p.style.transform = 'translateY(20px)';
        p.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        container.appendChild(p);

        // 言語が日本語の場合、英訳も薄く表示
        if (lang === 'ja' && enLog && enLog.paragraphs[i]) {
            const pEn = document.createElement('p');
            pEn.className = 'log-paragraph-en';
            pEn.textContent = enLog.paragraphs[i];
            pEn.style.opacity = '0';
            pEn.style.transform = 'translateY(20px)';
            pEn.style.transition = 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s';
            container.appendChild(pEn);
        }
    });

    // IntersectionObserver でフェードイン
    setupScrollReveal(container);
}

/**
 * スクロール連動のフェードイン
 */
function setupScrollReveal(container) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    container.querySelectorAll('.log-paragraph, .log-paragraph-en').forEach((el) => {
        observer.observe(el);
    });
}

/**
 * スクロール案内の自動非表示
 */
export function setupScrollHint() {
    const hint = document.getElementById('scroll-hint');
    if (!hint) return;

    const hideOnScroll = () => {
        if (window.scrollY > 80) {
            hint.style.transition = 'opacity 0.6s ease';
            hint.style.opacity = '0';
            window.removeEventListener('scroll', hideOnScroll);
        }
    };
    window.addEventListener('scroll', hideOnScroll, { passive: true });
}
