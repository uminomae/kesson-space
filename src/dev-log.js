// dev-log.js — 開発ログの描画
// content/devlog-{lang}.md から読み込み（言語ごとに片方のみ表示）

import { detectLang } from './i18n.js';

/**
 * 簡易frontmatterパーサー
 */
function parseFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: text.trim() };

    const meta = {};
    match[1].split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) {
            const key = line.slice(0, idx).trim();
            const val = line.slice(idx + 1).trim();
            meta[key] = val;
        }
    });

    return { meta, body: match[2].trim() };
}

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
 * 開発ログセクションを描画（現在言語のみ）
 */
export async function renderDevLog() {
    const container = document.getElementById('dev-log');
    if (!container) return;

    const lang = detectLang();

    try {
        const res = await fetch(`./content/devlog-${lang}.md`);
        if (!res.ok) return;
        const raw = await res.text();
        const { meta, body } = parseFrontmatter(raw);
        const paragraphs = body.split(/\n\n+/).filter(p => p.trim());

        // ヘッダー
        if (meta.header) {
            const header = document.createElement('div');
            header.className = 'log-header';
            header.textContent = meta.header;
            container.appendChild(header);
        }

        // 日付
        if (meta.date) {
            const date = document.createElement('div');
            date.className = 'log-date';
            date.textContent = meta.date;
            container.appendChild(date);
        }

        // 段落
        paragraphs.forEach((text) => {
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
