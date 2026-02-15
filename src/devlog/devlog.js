/**
 * devlog.js — Devlog Gallery (index.html統合版)
 *
 * シンプルなBootstrapカードでコミットセッションを表示する。
 * Usage: import { initDevlogGallery } from './devlog/devlog.js';
 */

const SESSIONS_URL = './assets/devlog/sessions.json';

let sessions = [];
let isInitialized = false;
let containerEl = null;

/**
 * ギャラリーを初期化
 * @param {string} containerId - gallery container の ID
 * @param {string} counterId - session count 表示要素の ID
 */
export function initDevlogGallery(containerId = 'devlog-gallery-container', counterId = 'gallery-session-count') {
    if (isInitialized) return;

    containerEl = document.getElementById(containerId);
    if (!containerEl) {
        console.warn('[devlog] Container not found:', containerId);
        return;
    }

    // Bootstrap Modal: keep listener for future hooks
    const modalEl = document.getElementById('devlogSessionModal');
    if (modalEl) {
        modalEl.addEventListener('hidden.bs.modal', () => {
            // No-op: listener kept for compatibility
        });
    }

    loadSessions(counterId);
    isInitialized = true;
    console.log('[devlog] Gallery initialized');
}

/**
 * 個別セッションの.mdファイルを読み込み
 * @param {string} sessionId - セッションID（例: "session-001"）
 * @returns {Promise<string|null>} - 本文またはnull
 */
async function loadSessionContent(sessionId) {
    try {
        const res = await fetch(`./content/devlog/${sessionId}.md`);
        if (!res.ok) return null;
        const raw = await res.text();
        // frontmatter除去（---で囲まれた部分をスキップ）
        const match = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
        return match ? match[1].trim() : raw.trim();
    } catch (e) {
        console.warn(`[devlog] Failed to load ${sessionId}.md:`, e);
        return null;
    }
}

async function loadSessions(counterId) {
    const countEl = document.getElementById(counterId);

    try {
        const res = await fetch(SESSIONS_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        sessions = await res.json();

        // 各セッションの.mdを並列読み込み
        await Promise.all(sessions.map(async (session) => {
            session.log_content = await loadSessionContent(session.id);
        }));

        if (countEl) countEl.textContent = `${sessions.length} sessions`;
        buildGallery();
    } catch (e) {
        console.warn('sessions.json not found, using demo data:', e.message);
        sessions = generateDemoData();

        if (countEl) countEl.textContent = `${sessions.length} sessions (demo)`;
        buildGallery();
    }
}

function generateDemoData() {
    return [
        {
            id: 'session-001',
            title_ja: 'Part 1: 基盤構築',
            title_en: 'Part 1: Foundation',
            date_range: '02-10 〜 02-11',
            cover: './assets/devlog/covers/session-001.jpg',
            log_content: null
        },
        {
            id: 'session-002',
            title_ja: 'Part 2: UX実装',
            title_en: 'Part 2: UX Implementation',
            date_range: '02-12 〜 02-13',
            cover: './assets/devlog/covers/session-002.jpg',
            log_content: null
        },
        {
            id: 'session-003',
            title_ja: 'Part 3: コンテンツ統合',
            title_en: 'Part 3: Content Integration',
            date_range: '02-14 〜 02-15',
            cover: './assets/devlog/covers/session-003.jpg',
            log_content: null
        }
    ];
}

function buildGallery() {
    containerEl.innerHTML = '';

    // Bootstrap container for horizontal padding
    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'container px-4 mt-4';

    // Bootstrap row with responsive columns
    const row = document.createElement('div');
    row.className = 'row g-4 justify-content-center';

    const lang = document.documentElement.lang || 'ja';

    sessions.forEach(session => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4 p-2';

        const card = document.createElement('div');
        card.className = 'card bg-dark border-0 overflow-hidden h-100';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';

        // Cover image
        const img = document.createElement('img');
        img.className = 'card-img-top';
        img.src = session.cover;
        img.alt = session.title_ja;
        img.style.aspectRatio = '16/9';
        img.style.objectFit = 'cover';
        // Fallback for missing images
        img.onerror = () => {
            img.style.background = 'linear-gradient(135deg, #0a0e1a 0%, #1a237e40 50%, #0a0e1a 100%)';
            img.style.minHeight = '180px';
            img.src = '';
        };

        // Overlay bar at bottom — 70% transparent black
        const overlay = document.createElement('div');
        overlay.className = 'card-img-overlay d-flex flex-column justify-content-end p-0';

        const bar = document.createElement('div');
        bar.style.background = 'rgba(0, 0, 0, 0.7)';
        bar.style.backdropFilter = 'blur(8px)';
        bar.style.padding = '12px 16px';

        const title = document.createElement('div');
        title.style.color = 'rgba(255, 255, 255, 0.9)';
        title.style.fontSize = '0.85rem';
        title.style.fontWeight = '500';
        title.textContent = lang === 'en' ? session.title_en : session.title_ja;

        const date = document.createElement('div');
        date.style.color = 'rgba(180, 200, 230, 0.5)';
        date.style.fontSize = '0.7rem';
        date.style.marginTop = '4px';
        date.textContent = session.date_range;

        bar.appendChild(title);
        bar.appendChild(date);
        overlay.appendChild(bar);

        card.appendChild(img);
        card.appendChild(overlay);
        col.appendChild(card);
        row.appendChild(col);

        // Hover effects
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
            card.style.boxShadow = '0 8px 24px rgba(100, 150, 255, 0.15)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });

        // Click to show detail
        card.addEventListener('click', () => showDetail(session));
    });

    galleryContainer.appendChild(row);
    containerEl.appendChild(galleryContainer);
    console.log('[devlog] Gallery built with', sessions.length, 'cards');
}

/**
 * 安全なHTML描画（<a> と <hr> のみ許可）
 */
function safeHTML(text) {
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    // <a href="...">...</a> だけ復元（https:// のみ許可）
    escaped = escaped.replace(
        /&lt;a\s+href=&quot;(https:\/\/[^&]+)&quot;&gt;([^&]*?)&lt;\/a&gt;/g,
        '<a href="$1" target="_blank" rel="noopener">$2</a>'
    );

    // <hr> を復元
    escaped = escaped.replace(/&lt;hr&gt;/g, '<hr>');

    return escaped;
}

function showDetail(session) {
    const modalEl = document.getElementById('devlogSessionModal');
    if (!modalEl) return;

    const dateEl = document.getElementById('session-date');
    const idEl = document.getElementById('session-id');
    const coverEl = document.getElementById('session-cover');
    const contentEl = document.getElementById('session-content');
    const statsEl = document.getElementById('session-stats');

    const lang = document.documentElement.lang || 'ja';
    if (dateEl) dateEl.textContent = (lang === 'en' ? session.title_en : session.title_ja) || '';
    if (idEl) idEl.textContent = session.date_range || '';

    if (statsEl) statsEl.classList.add('d-none');

    // カバー画像
    if (coverEl) {
        const coverImg = document.getElementById('session-cover-img');
        if (session.cover && coverImg) {
            coverImg.src = session.cover;
            coverEl.classList.remove('d-none');
        } else {
            coverEl.classList.add('d-none');
        }
    }

    // セッションコンテンツ（log_content を描画）
    if (contentEl) {
        if (session.log_content) {
            const paragraphs = session.log_content.split(/\n\n+/).filter(p => p.trim());
            const html = paragraphs.map(p => {
                const trimmed = p.trim();
                if (trimmed === '<hr>') return '<hr class="log-separator">';
                return `<p>${safeHTML(trimmed)}</p>`;
            }).join('');
            contentEl.innerHTML = html;
            contentEl.classList.remove('d-none');
        } else {
            contentEl.innerHTML = '';
            contentEl.classList.add('d-none');
        }
    }

    // Bootstrap Modal を表示
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

function hideDetail() {
    const modalEl = document.getElementById('devlogSessionModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
}

/**
 * ギャラリーを破棄
 */
export function destroyDevlogGallery() {
    if (!isInitialized) return;

    if (containerEl) containerEl.innerHTML = '';

    isInitialized = false;
}

// Auto-initialize when gallery section is visible (IntersectionObserver)
if (typeof window !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isInitialized) {
                console.log('[devlog] Section visible, initializing gallery');
                initDevlogGallery();
                observer.disconnect();
            }
        });
    }, { threshold: 0.1 });

    // Defer observation until DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const section = document.getElementById('devlog-gallery-section');
            if (section) {
                console.log('[devlog] Observing gallery section');
                observer.observe(section);
            } else {
                console.warn('[devlog] Gallery section not found');
            }
        });
    } else {
        const section = document.getElementById('devlog-gallery-section');
        if (section) {
            console.log('[devlog] Observing gallery section');
            observer.observe(section);
        } else {
            console.warn('[devlog] Gallery section not found');
        }
    }
}
