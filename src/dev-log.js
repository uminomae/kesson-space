// dev-log.js — 開発ログの描画
// assets/devlog/sessions.json から読み込み（言語ごとにnarrative切替）

import { detectLang } from './i18n.js';

/**
 * 安全なHTML描画（<a> と <hr> のみ許可、他はエスケープ）
 */
function safeHTML(text) {
    // 1. 全体をエスケープ
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    // 2. <a href="...">...</a> だけ復元（https:// のみ許可）
    escaped = escaped.replace(
        /&lt;a\s+href=&quot;(https:\/\/[^&]+)&quot;&gt;([^&]*?)&lt;\/a&gt;/g,
        '<a href="$1" target="_blank" rel="noopener">$2</a>'
    );

    // 3. <hr> を復元
    escaped = escaped.replace(/&lt;hr&gt;/g, '<hr>');

    return escaped;
}

/**
 * 開発ログセクションを描画（sessions.jsonから）
 */
export async function renderDevLog() {
    const container = document.getElementById('dev-log');
    if (!container) return;

    const lang = detectLang();

    try {
        const res = await fetch('./assets/devlog/sessions.json');
        if (!res.ok) return;
        const sessions = await res.json();

        // 新しいセッションが先頭に来るよう降順ソート（startフィールドで）
        sessions.sort((a, b) => new Date(b.start) - new Date(a.start));

        sessions.forEach((session, index) => {
            const narrative = session.narrative?.[lang];
            if (!narrative) return;

            // セッション間セパレーター（最初以外）
            if (index > 0) {
                const sep = document.createElement('hr');
                sep.className = 'log-separator';
                container.appendChild(sep);
            }

            // ヘッダー
            if (narrative.header) {
                const header = document.createElement('div');
                header.className = 'log-header';
                header.textContent = narrative.header;
                container.appendChild(header);
            }

            // 日付
            if (narrative.date) {
                const date = document.createElement('div');
                date.className = 'log-date';
                date.textContent = narrative.date;
                container.appendChild(date);
            }

            // 段落
            if (narrative.paragraphs) {
                narrative.paragraphs.forEach((text) => {
                    const trimmed = text.trim();

                    // <hr> 単独段落はhr要素として描画
                    if (trimmed === '<hr>') {
                        const hr = document.createElement('hr');
                        hr.className = 'log-separator';
                        container.appendChild(hr);
                        return;
                    }

                    const p = document.createElement('p');
                    p.className = 'log-paragraph';
                    p.innerHTML = safeHTML(trimmed);
                    p.style.opacity = '0';
                    p.style.transform = 'translateY(20px)';
                    p.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                    container.appendChild(p);
                });
            }
        });

        // IntersectionObserver でフェードイン
        setupScrollReveal(container);

    } catch (err) {
        console.warn('devlog load failed:', err);
    }
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

    container.querySelectorAll('.log-paragraph').forEach((el) => {
        observer.observe(el);
    });
}
