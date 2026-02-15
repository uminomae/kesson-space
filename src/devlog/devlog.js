/**
 * devlog.js — Devlog Gallery (index.html統合版)
 *
 * シンプルなBootstrapカードでコミットセッションを表示する。
 * Usage: import { initDevlogGallery } from './devlog/devlog.js';
 */

import { marked } from 'marked';
import { slideInCards, slideOutCards } from './animations.js';
import { createReadMoreButton, createShowLessButton } from './toggle-buttons.js';

const SESSIONS_URL = './assets/devlog/sessions.json';

let sessions = [];
let isInitialized = false;
let galleryState = {
    isExpanded: false,
    totalSessions: 0
};
let containerEl = null;

// markedの設定（セキュリティ・スタイル）
marked.setOptions({
    breaks: true,      // 改行を<br>に変換
    gfm: true,         // GitHub Flavored Markdown
    headerIds: false,  // ヘッダーにID付与しない（シンプルに）
});

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

        if (countEl) {
            countEl.classList.remove('mb-5');
            countEl.classList.add('mb-4');
            countEl.textContent = `${sessions.length} sessions`;
        }
        buildGallery();
    } catch (e) {
        console.warn('sessions.json not found, using demo data:', e.message);
        sessions = generateDemoData();

        if (countEl) {
            countEl.classList.remove('mb-5');
            countEl.classList.add('mb-4');
            countEl.textContent = `${sessions.length} sessions (demo)`;
        }
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
    galleryContainer.className = 'container px-4';
    galleryContainer.style.marginTop = '5.5rem';

    // Bootstrap row with responsive columns
    const row = document.createElement('div');
    row.className = 'row g-4 justify-content-center';

    const lang = document.documentElement.lang || 'ja';

    sessions.forEach((session, index) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4 p-2';
        if (index < 3) {
            col.classList.add('devlog-card', 'visible');
        } else {
            col.classList.add('devlog-card', 'expandable');
        }

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
            img.onerror = null;
            img.src = './assets/devlog/covers/default.svg';
        };

        // Card body below image
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body p-0';

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
        cardBody.appendChild(bar);

        card.appendChild(img);
        card.appendChild(cardBody);
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
    if (sessions.length > 3) {
        galleryState.totalSessions = sessions.length;

        const readMoreContainer = document.createElement('div');
        readMoreContainer.className = 'text-center mt-4';
        readMoreContainer.id = 'read-more-container';
        const readMoreBtn = createReadMoreButton(expandGallery);
        readMoreContainer.appendChild(readMoreBtn);
        galleryContainer.appendChild(readMoreContainer);

        const headerEl = document.getElementById('devlog-gallery-header');
        if (headerEl) {
            const showLessBtn = createShowLessButton(collapseGallery);
            showLessBtn.classList.add('d-none');
            headerEl.appendChild(showLessBtn);
        }
    }
    containerEl.appendChild(galleryContainer);
    console.log('[devlog] Gallery built with', sessions.length, 'cards');
}

async function expandGallery() {
    const expandableCards = document.querySelectorAll('.devlog-card.expandable');
    await slideInCards(expandableCards);
    document.getElementById('read-more-container').classList.add('d-none');
    const showLessBtn = document.getElementById('show-less-btn');
    showLessBtn.classList.remove('d-none');
    showLessBtn.setAttribute('aria-expanded', 'true');
    const countEl = document.getElementById('gallery-session-count');
    if (countEl) countEl.textContent = `${galleryState.totalSessions} sessions`;
    galleryState.isExpanded = true;
}

async function collapseGallery() {
    const expandableCards = document.querySelectorAll('.devlog-card.expandable');
    await slideOutCards(expandableCards);
    const showLessBtn = document.getElementById('show-less-btn');
    showLessBtn.classList.add('d-none');
    showLessBtn.setAttribute('aria-expanded', 'false');
    document.getElementById('read-more-container').classList.remove('d-none');
    const countEl = document.getElementById('gallery-session-count');
    if (countEl) countEl.textContent = '3 sessions';
    const gallerySection = document.getElementById('devlog-gallery-section');
    if (gallerySection) gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    galleryState.isExpanded = false;
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
            coverImg.onerror = () => {
                coverImg.src = './assets/devlog/covers/default.svg';
            };
            coverEl.classList.remove('d-none');
            // カバー画像クリックで拡大
            coverImg.style.cursor = 'pointer';
            coverImg.onclick = () => {
                const lightboxImg = document.getElementById('lightbox-image');
                if (lightboxImg) {
                    lightboxImg.src = coverImg.src;
                    const lightboxModal = bootstrap.Modal.getOrCreateInstance(
                        document.getElementById('imageLightboxModal')
                    );
                    lightboxModal.show();
                }
            };
        } else {
            coverEl.classList.add('d-none');
        }
    }

    // セッションコンテンツ（Markdownをパースして描画）
    if (contentEl) {
        if (session.log_content) {
            // markedでMarkdownをHTMLに変換
            contentEl.innerHTML = marked.parse(session.log_content);
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

// ライトボックス画像クリックで閉じる
if (typeof window !== 'undefined') {
    const lbImg = document.getElementById('lightbox-image');
    if (lbImg) {
        lbImg.addEventListener('click', () => {
            const m = bootstrap.Modal.getInstance(document.getElementById('imageLightboxModal'));
            if (m) m.hide();
        });
    }
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
