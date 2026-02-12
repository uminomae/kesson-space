// viewer.js — draft.md ビューアー（PDF iframe → Markdown HTML）
// GitHub Pages の draft.md を fetch → パース → HTML レンダリング
// PDF はダウンロードリンクとして残す

let _viewer = null;
let _isOpen = false;

// --- Markdown → HTML 軽量パーサー ---

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

function inlineMarkdown(text) {
    let s = escapeHtml(text);
    // bold
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // italic
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // links
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
}

function markdownToHtml(body) {
    const lines = body.split('\n');
    const out = [];
    let inTable = false;
    let tableRows = [];
    let inParagraph = false;
    let paraLines = [];

    function flushParagraph() {
        if (paraLines.length > 0) {
            out.push(`<p>${inlineMarkdown(paraLines.join(' '))}</p>`);
            paraLines = [];
        }
        inParagraph = false;
    }

    function flushTable() {
        if (tableRows.length < 2) return;
        let html = '<div class="md-table-wrap"><table>';
        tableRows.forEach((row, i) => {
            // skip separator row (|---|---|)
            if (/^\|[\s\-:|]+\|$/.test(row)) return;
            const cells = row.split('|').filter((_, idx, arr) =>
                idx > 0 && idx < arr.length - 1
            ).map(c => c.trim());
            const tag = i === 0 ? 'th' : 'td';
            html += '<tr>' + cells.map(c =>
                `<${tag}>${inlineMarkdown(c)}</${tag}>`
            ).join('') + '</tr>';
        });
        html += '</table></div>';
        out.push(html);
        tableRows = [];
        inTable = false;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // table
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            flushParagraph();
            inTable = true;
            tableRows.push(trimmed);
            continue;
        }
        if (inTable) flushTable();

        // empty line
        if (trimmed === '') {
            flushParagraph();
            continue;
        }

        // hr
        if (/^[-*_]{3,}$/.test(trimmed)) {
            flushParagraph();
            out.push('<hr class="md-hr">');
            continue;
        }

        // headers
        const hMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
        if (hMatch) {
            flushParagraph();
            const level = hMatch[1].length;
            out.push(`<h${level} class="md-h${level}">${inlineMarkdown(hMatch[2])}</h${level}>`);
            continue;
        }

        // blockquote
        if (trimmed.startsWith('>')) {
            flushParagraph();
            const content = trimmed.replace(/^>\s*/, '');
            out.push(`<blockquote class="md-quote">${inlineMarkdown(content)}</blockquote>`);
            continue;
        }

        // paragraph continuation
        paraLines.push(trimmed);
        inParagraph = true;
    }

    if (inTable) flushTable();
    flushParagraph();

    return out.join('\n');
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
    _viewer.querySelector('.viewer-content').innerHTML = content;

    requestAnimationFrame(() => {
        _viewer.classList.add('visible');
        requestAnimationFrame(() => {
            _viewer.classList.add('open');
        });
    });
    _isOpen = true;
}

export function closeViewer() {
    if (_viewer) {
        _viewer.classList.remove('open');
        setTimeout(() => {
            _viewer.classList.remove('visible');
            _viewer.querySelector('.viewer-content').innerHTML = '';
            _isOpen = false;
        }, 500);
    }
}

export function isViewerOpen() {
    return _isOpen;
}

/**
 * PDF URL から draft.md URL を導出
 * kesson-general.pdf → kesson-general-draft.md
 * kesson-general-en.pdf → kesson-general-en-draft.md
 */
function deriveDraftUrl(pdfUrl) {
    return pdfUrl.replace(/\.pdf$/, '-draft.md');
}

/**
 * メイン: オーブクリック時に呼ばれる
 * draft.md を fetch → HTML レンダリング → ビューアー表示
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
        const res = await fetch(draftUrl);
        if (!res.ok) throw new Error(`${res.status}`);
        const raw = await res.text();

        // Jekyll が HTML に変換してしまう場合のチェック
        if (raw.trim().startsWith('<!') || raw.trim().startsWith('<html')) {
            throw new Error('Got HTML instead of markdown');
        }

        const { meta, body } = parseFrontmatter(raw);
        const html = markdownToHtml(body);

        const title = meta.title || label || '';
        const audience = meta.audience || '';
        const status = meta.status || '';

        const headerHtml = title
            ? `<div class="md-title">${escapeHtml(title)}</div>`
            : '';

        const metaHtml = (audience || status)
            ? `<div class="md-meta">${
                audience ? `<span class="md-audience">${escapeHtml(audience)}</span>` : ''
            }${
                status ? `<span class="md-status">${escapeHtml(status)}</span>` : ''
            }</div>`
            : '';

        openViewer(`
            <div class="md-article">
                ${headerHtml}
                ${metaHtml}
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
            <iframe src="${pdfUrl}" title="${label}"></iframe>
        `);
    }
}

// --- スタイル注入 ---

export function injectViewerStyles() {
    const style = document.createElement('style');
    style.textContent = `
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
        .md-title {
            font-size: 1.3rem;
            color: rgba(240, 245, 255, 0.95);
            margin-bottom: 0.6rem;
            line-height: 1.5;
        }
        .md-meta {
            font-size: 0.72rem;
            color: rgba(160, 180, 220, 0.5);
            margin-bottom: 2rem;
            letter-spacing: 0.03em;
        }
        .md-meta .md-audience { margin-right: 1em; }
        .md-meta .md-status { font-style: italic; }

        .md-body p {
            margin: 0 0 1.2em;
        }
        .md-body .md-h1 {
            font-size: 1.2rem;
            color: rgba(240, 245, 255, 0.92);
            margin: 2rem 0 0.8rem;
            line-height: 1.4;
        }
        .md-body .md-h2 {
            font-size: 1.05rem;
            color: rgba(230, 240, 255, 0.88);
            margin: 1.8rem 0 0.7rem;
            line-height: 1.4;
        }
        .md-body .md-h3 {
            font-size: 0.95rem;
            color: rgba(220, 230, 250, 0.85);
            margin: 1.4rem 0 0.5rem;
        }
        .md-body .md-hr {
            border: none;
            border-top: 1px solid rgba(100, 150, 255, 0.08);
            margin: 2rem 0;
        }
        .md-body .md-quote {
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

        /* table */
        .md-table-wrap {
            overflow-x: auto;
            margin: 1.2em 0;
            -webkit-overflow-scrolling: touch;
        }
        .md-body table {
            border-collapse: collapse;
            width: 100%;
            font-size: 0.82rem;
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
            .md-title {
                font-size: 1.1rem;
            }
            .md-body .md-h1 { font-size: 1.05rem; }
            .md-body .md-h2 { font-size: 0.95rem; }
            .md-body table { font-size: 0.75rem; }
        }
    `;
    document.head.appendChild(style);
}
