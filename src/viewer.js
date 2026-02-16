// viewer.js — draft.md ビューアー（Markdown HTML レンダリング）
// raw.githubusercontent.com から draft.md を fetch → marked.js でパース → HTML レンダリング
// PDF はダウンロードリンクとして残す

import { injectStyles } from './dom-utils.js';

// CHANGED: marked を動的importに変更（初期ロード時の20.8KB削減）
// marked はオーブクリック時にのみ必要
let _markedParser = null;
async function getMarked() {
    if (!_markedParser) {
        const { marked } = await import('marked');
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
        _markedParser = marked;
    }
    return _markedParser;
}

let _viewer = null;
let _isOpen = false;

// --- Frontmatter パーサー（自前: YAMLライブラリ不要） ---

function parseFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: text.trim() };
    const meta = {};
    match[1].split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) {
            const key = line.slice(0, idx).trim();
            const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
            meta[key] = val;
        }
    });
    return { meta, body: match[2].trim() };
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * generated の ISO8601 日時を表示用に整形
 * "2026-02-13T00:00:00+09:00" → "2026-02-13"
 */
function formatDate(isoStr) {
    if (!isoStr) return '';
    const match = isoStr.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : isoStr;
}

// --- DOM ---

function createViewer() {
    const viewer = document.createElement('div');
    viewer.id = 'kesson-viewer';
    viewer.innerHTML = `
        <div class="viewer-glass">
            <button class="viewer-close" aria-label="閉じる">×</button>
            <div class="viewer-content"></div>
        </div>
    `;
    document.body.appendChild(viewer);

    viewer.querySelector('.viewer-close').addEventListener('click', closeViewer);
    viewer.addEventListener('click', (e) => {
        if (e.target === viewer) closeViewer();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _isOpen) closeViewer();
    });

    return viewer;
}

export function openViewer(content) {
    if (!_viewer) _viewer = createViewer();
    const contentEl = _viewer.querySelector('.viewer-content');
    contentEl.className = 'viewer-content';
    contentEl.innerHTML = content;

    requestAnimationFrame(() => {
        _viewer.classList.add('visible');
        requestAnimationFrame(() => {
            _viewer.classList.add('open');
        });
    });
    _isOpen = true;
}

let _xWidgetsPromise = null;

function loadXWidgets() {
    if (window.twttr && window.twttr.widgets) {
        return Promise.resolve(window.twttr);
    }
    if (_xWidgetsPromise) return _xWidgetsPromise;

    _xWidgetsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = () => resolve(window.twttr);
        script.onerror = () => reject(new Error('X widgets load failed'));
        document.head.appendChild(script);
    });

    return _xWidgetsPromise;
}

function getXScreenName(url) {
    if (!url) return 'pjdhiro';
    const match = url.match(/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)/i);
    return match ? match[1] : 'pjdhiro';
}

export async function openXTimeline(url, label = 'X') {
    const handle = getXScreenName(url);
    const xUrl = `https://x.com/${handle}`;
    const twitterUrl = `https://twitter.com/${handle}`;

    openViewer(`
        <div class="md-loading">
            <div class="md-loading-dot"></div>
        </div>
    `);

    try {
        await loadXWidgets();
        const container = _viewer.querySelector('.viewer-content');
        container.classList.add('viewer-content--x');
        container.innerHTML = '';

        const height = Math.max(420, Math.floor(window.innerHeight * 0.75));
        const wrap = document.createElement('div');
        wrap.className = 'x-embed-wrap';

        const timeline = document.createElement('a');
        timeline.className = 'twitter-timeline';
        timeline.href = twitterUrl;
        timeline.textContent = `Posts by ${handle}`;
        timeline.setAttribute('data-theme', 'dark');
        timeline.setAttribute('data-dnt', 'true');
        timeline.setAttribute('data-chrome', 'noheader nofooter transparent');
        timeline.setAttribute('data-height', String(height));

        wrap.appendChild(timeline);

        const footer = document.createElement('div');
        footer.className = 'x-embed-footer';
        footer.innerHTML = `
            <div class="x-embed-handle">@${handle}</div>
            <a href="${xUrl}" target="_blank" rel="noopener">${label} をXで開く</a>
        `;

        container.appendChild(wrap);
        container.appendChild(footer);

        // widgets.js による埋め込み生成
        if (window.twttr && window.twttr.widgets && window.twttr.widgets.load) {
            window.twttr.widgets.load(container);
        } else {
            throw new Error('X widgets unavailable');
        }
    } catch (err) {
        console.warn('[viewer] X timeline load failed:', err);
        openViewer(`
            <div class="md-article">
                <p>Xのタイムライン埋め込みは制限により表示できません。</p>
                <p><a href="${xUrl}" target="_blank" rel="noopener">@${handle} をXで開く</a></p>
            </div>
        `);
    }
}

export function closeViewer() {
    if (_viewer) {
        _viewer.classList.remove('open');
        setTimeout(() => {
            _viewer.classList.remove('visible');
            const contentEl = _viewer.querySelector('.viewer-content');
            contentEl.className = 'viewer-content';
            contentEl.innerHTML = '';
            _isOpen = false;
        }, 500);
    }
}

export function isViewerOpen() {
    return _isOpen;
}

/**
 * PDF URL (GitHub Pages) から raw.githubusercontent.com の draft.md URL を導出
 */
function deriveDraftUrl(pdfUrl) {
    const RAW_BASE = 'https://raw.githubusercontent.com/uminomae/pjdhiro/main/';
    const match = pdfUrl.match(/github\.io\/pjdhiro\/(.+)\.pdf$/);
    if (match) {
        return RAW_BASE + match[1] + '-draft.md';
    }
    return pdfUrl.replace(/\.pdf$/, '-draft.md');
}

/**
 * メイン: オーブクリック時に呼ばれる
 * draft.md を fetch → marked.js で HTML レンダリング → ビューアー表示
 * fetch 失敗時は PDF iframe にフォールバック
 */
export async function openPdfViewer(pdfUrl, label) {
    const draftUrl = deriveDraftUrl(pdfUrl);

    // ローディング表示
    openViewer(`
        <div class="md-loading">
            <div class="md-loading-dot"></div>
        </div>
    `);

    try {
        // CHANGED: marked を並列でロード（fetch と同時）
        const [res, marked] = await Promise.all([
            fetch(draftUrl),
            getMarked(),
        ]);

        if (!res.ok) throw new Error(`${res.status}`);
        const raw = await res.text();

        // Jekyll が HTML に変換してしまった場合のガード
        if (raw.trim().startsWith('<!') || raw.trim().startsWith('<html')) {
            throw new Error('Got HTML instead of markdown');
        }

        const { meta, body } = parseFrontmatter(raw);

        // 本文をそのまま marked.js でレンダリング（タイトルは本文の # から来る）
        const html = marked.parse(body);

        // 来歴情報（generator_model + generated）
        const model = meta.generator_model || '';
        const generated = formatDate(meta.generated);
        const provenanceParts = [];
        if (model) provenanceParts.push(`Generated by ${escapeHtml(model)}`);
        if (generated) provenanceParts.push(escapeHtml(generated));
        const provenanceHtml = provenanceParts.length > 0
            ? `<div class="md-provenance">${provenanceParts.join(' · ')}</div>`
            : '';

        openViewer(`
            <div class="md-article">
                ${provenanceHtml}
                <div class="md-body">${html}</div>
                <div class="md-footer">
                    <a href="${pdfUrl}" target="_blank" rel="noopener" class="md-pdf-link">
                        PDF版をダウンロード ↓
                    </a>
                </div>
            </div>
        `);

    } catch (err) {
        console.warn('draft.md fetch failed, falling back to PDF iframe:', err);
        openViewer(`
            <iframe src="${pdfUrl}" title="${escapeHtml(label)}"></iframe>
        `);
    }
}

// --- スタイル注入 ---

export function injectViewerStyles() {
    injectStyles('viewer-styles', `
        #kesson-viewer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 200;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(5, 10, 20, 0.0);
            transition: background 0.5s ease;
            cursor: pointer;
        }
        #kesson-viewer.visible {
            display: flex;
        }
        #kesson-viewer.open {
            background: rgba(5, 10, 20, 0.5);
        }

        .viewer-glass {
            position: relative;
            width: 90vw;
            max-width: 720px;
            height: 85vh;
            cursor: default;
            overflow: hidden;

            background: rgba(12, 18, 30, 0.88);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(100, 150, 255, 0.06);
            border-radius: 3px;
            box-shadow:
                0 0 60px rgba(0, 0, 0, 0.4),
                0 0 120px rgba(30, 60, 120, 0.1),
                inset 0 0 60px rgba(20, 40, 80, 0.05);

            opacity: 0;
            transform: scale(0.92) translateY(20px);
            transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        #kesson-viewer.open .viewer-glass {
            opacity: 1;
            transform: scale(1) translateY(0);
        }

        .viewer-close {
            position: absolute;
            top: 10px;
            right: 12px;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.25);
            font-size: 1.4rem;
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.3s;
            z-index: 10;
        }
        .viewer-close:hover {
            color: rgba(255, 255, 255, 0.6);
        }

        .viewer-content {
            width: 100%;
            height: 100%;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
        .viewer-content iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 3px;
        }
        .viewer-content--x {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .x-embed-wrap {
            flex: 1;
            display: flex;
            align-items: stretch;
        }
        .x-embed-wrap .twitter-timeline {
            width: 100%;
        }
        .x-embed-footer {
            padding: 0.5rem 1rem 0.9rem;
            text-align: center;
            font-size: 0.78rem;
        }
        .x-embed-handle {
            color: rgba(200, 215, 245, 0.7);
            font-size: 0.72rem;
            margin-bottom: 0.25rem;
            letter-spacing: 0.04em;
        }
        .x-embed-footer a {
            color: rgba(130, 170, 255, 0.85);
            text-decoration: underline;
            text-underline-offset: 2px;
        }

        /* scrollbar */
        .viewer-content::-webkit-scrollbar { width: 3px; }
        .viewer-content::-webkit-scrollbar-track { background: transparent; }
        .viewer-content::-webkit-scrollbar-thumb {
            background: rgba(100, 150, 255, 0.12);
            border-radius: 2px;
        }

        /* --- markdown article --- */
        .md-article {
            padding: 2.5rem 2rem 3rem;
            color: rgba(220, 230, 245, 0.85);
            line-height: 1.85;
            font-size: 0.92rem;
        }

        /* provenance (generator info) */
        .md-provenance {
            font-size: 0.68rem;
            color: rgba(140, 160, 200, 0.4);
            margin-bottom: 1.5rem;
            letter-spacing: 0.03em;
        }

        .md-body p {
            margin: 0 0 1.2em;
        }
        .md-body h1 {
            font-size: 1.2rem;
            color: rgba(240, 245, 255, 0.92);
            margin: 2rem 0 0.8rem;
            line-height: 1.4;
            letter-spacing: normal;
            text-shadow: none;
            border: none;
            page-break-before: unset;
        }
        .md-body h1:first-child {
            font-size: 1.3rem;
            color: rgba(240, 245, 255, 0.95);
            margin-top: 0;
            margin-bottom: 1.2rem;
        }
        .md-body h2 {
            font-size: 1.05rem;
            color: rgba(230, 240, 255, 0.88);
            margin: 1.8rem 0 0.7rem;
            line-height: 1.4;
        }
        .md-body h3 {
            font-size: 0.95rem;
            color: rgba(220, 230, 250, 0.85);
            margin: 1.4rem 0 0.5rem;
        }
        .md-body h4 {
            font-size: 0.9rem;
            color: rgba(210, 225, 245, 0.8);
            margin: 1.2rem 0 0.4rem;
        }
        .md-body hr {
            border: none;
            border-top: 1px solid rgba(100, 150, 255, 0.08);
            margin: 2rem 0;
        }
        .md-body blockquote {
            border-left: 2px solid rgba(100, 150, 255, 0.15);
            padding-left: 1em;
            margin: 1em 0;
            color: rgba(200, 215, 240, 0.7);
            font-style: italic;
        }
        .md-body a {
            color: rgba(130, 170, 255, 0.85);
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        .md-body a:hover {
            color: rgba(160, 195, 255, 1);
        }
        .md-body strong {
            color: rgba(240, 245, 255, 0.95);
            font-weight: 600;
        }
        .md-body em {
            color: rgba(200, 215, 240, 0.8);
        }

        /* --- code blocks (marked.js output) --- */
        .md-body pre {
            background: rgba(8, 12, 24, 0.6);
            border: 1px solid rgba(100, 150, 255, 0.08);
            border-radius: 3px;
            padding: 1em 1.2em;
            margin: 1.2em 0;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            line-height: 1.5;
        }
        .md-body pre code {
            font-family: 'SF Mono', 'Consolas', 'Monaco', 'Menlo', monospace;
            font-size: 0.82rem;
            color: rgba(180, 200, 230, 0.8);
            background: none;
            padding: 0;
            border: none;
            border-radius: 0;
            white-space: pre;
        }
        .md-body code {
            font-family: 'SF Mono', 'Consolas', 'Monaco', 'Menlo', monospace;
            font-size: 0.85em;
            color: rgba(180, 210, 255, 0.85);
            background: rgba(60, 90, 150, 0.12);
            padding: 0.15em 0.4em;
            border-radius: 2px;
        }

        /* --- lists (marked.js output) --- */
        .md-body ul, .md-body ol {
            padding-left: 1.5em;
            margin: 0.8em 0;
        }
        .md-body li {
            margin-bottom: 0.4em;
            line-height: 1.7;
        }
        .md-body li > ul, .md-body li > ol {
            margin: 0.3em 0;
        }

        /* --- table (marked.js GFM output) --- */
        .md-body table {
            border-collapse: collapse;
            width: 100%;
            font-size: 0.82rem;
            margin: 1.2em 0;
            overflow-x: auto;
            display: block;
        }
        .md-body thead {
            border-bottom: 1px solid rgba(100, 150, 255, 0.15);
        }
        .md-body th, .md-body td {
            padding: 0.5em 0.8em;
            border: 1px solid rgba(100, 150, 255, 0.08);
            text-align: left;
        }
        .md-body th {
            background: rgba(40, 60, 100, 0.2);
            color: rgba(220, 230, 250, 0.9);
            font-weight: 500;
        }
        .md-body td {
            color: rgba(200, 215, 240, 0.75);
        }

        /* --- images --- */
        .md-body img {
            max-width: 100%;
            height: auto;
            border-radius: 2px;
            margin: 1em 0;
        }

        /* PDF link */
        .md-footer {
            margin-top: 2.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(100, 150, 255, 0.06);
            text-align: center;
        }
        .md-pdf-link {
            display: inline-block;
            padding: 0.6em 1.5em;
            font-size: 0.78rem;
            color: rgba(160, 185, 240, 0.7);
            border: 1px solid rgba(100, 150, 255, 0.12);
            border-radius: 2px;
            text-decoration: none;
            letter-spacing: 0.05em;
            transition: all 0.3s;
        }
        .md-pdf-link:hover {
            color: rgba(200, 220, 255, 0.9);
            border-color: rgba(100, 150, 255, 0.25);
            background: rgba(60, 90, 150, 0.1);
        }

        /* loading */
        .md-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
        }
        .md-loading-dot {
            width: 6px;
            height: 6px;
            background: rgba(130, 170, 255, 0.4);
            border-radius: 50%;
            animation: md-pulse 1.2s ease-in-out infinite;
        }
        @keyframes md-pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
        }

        /* mobile */
        @media (max-width: 600px) {
            .viewer-glass {
                width: 96vw;
                height: 90vh;
                border-radius: 2px;
            }
            .md-article {
                padding: 2rem 1.2rem 2.5rem;
                font-size: 0.88rem;
                line-height: 1.8;
            }
            .md-body h1:first-child { font-size: 1.1rem; }
            .md-body h1 { font-size: 1.05rem; }
            .md-body h2 { font-size: 0.95rem; }
            .md-body table { font-size: 0.75rem; }
            .md-body pre { padding: 0.8em; }
            .md-body pre code { font-size: 0.75rem; }
        }
    `);
}
