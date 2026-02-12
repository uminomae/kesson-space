// dev-log.js — 開発ログの描画とスクロール演出
// content/devlog-{lang}.md から読み込み

import { detectLang } from './i18n.js';

/**
 * 簡易frontmatterパーサー
 * --- で囲まれたヘッダー部分と本文を分離
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
 * 開発ログセクションを描画
 */
export async function renderDevLog() {
    const container = document.getElementById('dev-log');
    if (!container) return;

    const lang = detectLang();
    const pairLang = lang === 'ja' ? 'en' : 'ja';

    try {
        // メイン言語のmd読み込み
        const res = await fetch(`./content/devlog-${lang}.md`);
        if (!res.ok) return;
        const raw = await res.text();
        const { meta, body } = parseFrontmatter(raw);
        const paragraphs = body.split(/\n\n+/).filter(p => p.trim());

        // ペア言語（薄く表示）
        let pairParagraphs = [];
        try {
            const pairRes = await fetch(`./content/devlog-${pairLang}.md`);
            if (pairRes.ok) {
                const pairRaw = await pairRes.text();
                const pairParsed = parseFrontmatter(pairRaw);
                pairParagraphs = pairParsed.body.split(/\n\n+/).filter(p => p.trim());
            }
        } catch (_) { /* ペア言語なくてもOK */ }

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
        paragraphs.forEach((text, i) => {
            const p = document.createElement('p');
            p.className = 'log-paragraph';
            p.textContent = text;
            p.style.opacity = '0';
            p.style.transform = 'translateY(20px)';
            p.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            container.appendChild(p);

            // ペア言語を薄く表示
            if (pairParagraphs[i]) {
                const pEn = document.createElement('p');
                pEn.className = 'log-paragraph-en';
                pEn.textContent = pairParagraphs[i];
                pEn.style.opacity = '0';
                pEn.style.transform = 'translateY(20px)';
                pEn.style.transition = 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s';
                container.appendChild(pEn);
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
