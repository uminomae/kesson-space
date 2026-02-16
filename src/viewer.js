// viewer.js — draft.md ビューアー（Markdown HTML レンダリング）
// raw.githubusercontent.com から draft.md を fetch → marked.js でパース → HTML レンダリング
// PDF はダウンロードリンクとして残す

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

// CHANGED(2026-02-16): T-018 — CSS moved to src/styles/main.css
export function injectViewerStyles() {
    // no-op: styles now in main.css
}
