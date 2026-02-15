/**
 * devlog.js — Devlog Gallery (Offcanvas + 無限スクロール版)
 *
 * - メイン画面: 3件カード表示
 * - Read More → Offcanvas右スライドイン（全セッション一覧）
 * - 無限スクロールで10件ずつ追加読み込み
 *
 * Usage: import { initDevlogGallery } from './devlog/devlog.js';
 */

import { marked } from 'marked';
import { createReadMoreButton } from './toggle-buttons.js';

const SESSIONS_URL = './assets/devlog/sessions.json';

let sessions = [];
let isInitialized = false;
let containerEl = null;

let galleryState = {
  sessions: [],           // 全セッションデータ
  displayedCount: 0,      // Offcanvas内の表示済み件数
  batchSize: 10,          // 1回の読み込み件数
  isLoading: false,       // 読み込み中フラグ
  offcanvas: null          // Bootstrap Offcanvasインスタンス
};

// markedの設定
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
});

function getSessionEndValue(session) {
  const end = session.end || session.start;
  const value = end ? Date.parse(end) : 0;
  return Number.isNaN(value) ? 0 : value;
}

/**
 * ギャラリーを初期化
 */
export function initDevlogGallery(containerId = 'devlog-gallery-container', counterId = 'gallery-session-count') {
  if (isInitialized) return;

  containerEl = document.getElementById(containerId);
  if (!containerEl) {
    console.warn('[devlog] Container not found:', containerId);
    return;
  }

  const modalEl = document.getElementById('devlogSessionModal');
  if (modalEl) {
    modalEl.addEventListener('hidden.bs.modal', () => {});
  }

  loadSessions(counterId);
  setupInfiniteScroll();
  isInitialized = true;
  console.log('[devlog] Gallery initialized');
}

/**
 * 個別セッションの.mdファイルを読み込み
 */
async function loadSessionContent(sessionId) {
  try {
    const res = await fetch(`./content/devlog/${sessionId}.md`);
    if (!res.ok) return null;
    const raw = await res.text();
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

    sessions.sort((a, b) => getSessionEndValue(b) - getSessionEndValue(a));

    await Promise.all(sessions.map(async (session) => {
      session.log_content = await loadSessionContent(session.id);
    }));

    if (countEl) {
      countEl.classList.remove('mb-5');
      countEl.classList.add('mb-4');
      countEl.textContent = `${sessions.length} sessions`;
    }
  } catch (e) {
    console.warn('sessions.json not found, using demo data:', e.message);
    sessions = generateDemoData();

    if (countEl) {
      countEl.classList.remove('mb-5');
      countEl.classList.add('mb-4');
      countEl.textContent = `${sessions.length} sessions (demo)`;
    }
  }

  galleryState.sessions = sessions;
  buildGallery();
}

function generateDemoData() {
  return [
    { id: 'session-001', title_ja: 'Part 1: 基盤構築', title_en: 'Part 1: Foundation', date_range: '2025/02-10 〜 02-11', cover: './assets/devlog/covers/session-001.jpg', log_content: null },
    { id: 'session-002', title_ja: 'Part 2: UX実装', title_en: 'Part 2: UX Implementation', date_range: '2025/02-12', cover: './assets/devlog/covers/session-002.jpg', log_content: null },
    { id: 'session-003', title_ja: 'Part 3: モバイル対応', title_en: 'Part 3: Mobile Support', date_range: '2025/02-13', cover: './assets/devlog/covers/session-003.jpg', log_content: null },
    { id: 'session-004', title_ja: 'Part 4: コンテンツ統合', title_en: 'Part 4: Content Integration', date_range: '2025/02-14', cover: './assets/devlog/covers/session-004.jpg', log_content: null },
    { id: 'session-005', title_ja: 'Part 5: Read More UI', title_en: 'Part 5: Read More UI', date_range: '2025/02-15', cover: './assets/devlog/covers/session-005.jpg', log_content: null },
  ];
}

/**
 * メイン画面のギャラリー構築（3件のみ表示 + Read More）
 */
function buildGallery() {
  containerEl.innerHTML = '';

  const galleryContainer = document.createElement('div');
  galleryContainer.className = 'container px-4';
  galleryContainer.style.marginTop = '5.5rem';

  const row = document.createElement('div');
  row.className = 'row g-4 justify-content-center';

  const lang = document.documentElement.lang || 'ja';
  const visibleSessions = sessions.slice(0, 3);

  visibleSessions.forEach((session) => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4 p-2 devlog-card visible';

    const card = createCardElement(session, lang);
    col.appendChild(card);
    row.appendChild(col);
  });

  galleryContainer.appendChild(row);

  // Read More ボタン（セッションが3件超ある場合）
  if (sessions.length > 3) {
    const readMoreContainer = document.createElement('div');
    readMoreContainer.className = 'text-center mt-4';
    readMoreContainer.id = 'read-more-container';
    const readMoreBtn = createReadMoreButton(openOffcanvas);
    readMoreContainer.appendChild(readMoreBtn);
    galleryContainer.appendChild(readMoreContainer);
  }

  containerEl.appendChild(galleryContainer);
  console.log('[devlog] Gallery built with', visibleSessions.length, 'visible cards');
}

/**
 * カードDOM要素を生成（メイン画面・Offcanvas共用）
 */
function createCardElement(session, lang) {
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
  img.onerror = () => {
    img.onerror = null;
    img.src = './assets/devlog/covers/default.svg';
  };

  // Card body
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

  // Hover effects
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-4px)';
    card.style.boxShadow = '0 8px 24px rgba(100, 150, 255, 0.15)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.boxShadow = '';
  });

  // Click → detail modal
  card.addEventListener('click', () => showDetail(session));

  return card;
}

// ============================================================
// Offcanvas + 無限スクロール
// ============================================================

/**
 * Offcanvasを開いて全セッション一覧を表示
 */
function openOffcanvas() {
  const offcanvasEl = document.getElementById('devlogOffcanvas');
  if (!galleryState.offcanvas) {
    galleryState.offcanvas = new bootstrap.Offcanvas(offcanvasEl);
  }

  // 初期化
  galleryState.displayedCount = 0;
  document.getElementById('offcanvas-gallery').innerHTML = '';
  loadMoreSessions();

  galleryState.offcanvas.show();
}

/**
 * 無限スクロールのセットアップ
 */
function setupInfiniteScroll() {
  const container = document.getElementById('offcanvas-gallery');
  if (!container) return;

  container.addEventListener('scroll', () => {
    if (galleryState.isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMoreSessions();
    }
  });
}

/**
 * 次のバッチを読み込み
 */
function loadMoreSessions() {
  if (galleryState.isLoading) return;
  if (galleryState.displayedCount >= galleryState.sessions.length) return;

  galleryState.isLoading = true;
  showLoading();

  const start = galleryState.displayedCount;
  const end = Math.min(start + galleryState.batchSize, galleryState.sessions.length);
  const batch = galleryState.sessions.slice(start, end);

  renderSessionCards(batch);
  galleryState.displayedCount = end;

  hideLoading();
  galleryState.isLoading = false;

  updateSessionCount();
}

/**
 * Offcanvas内にカードを描画
 */
function renderSessionCards(sessionsToRender) {
  const container = document.getElementById('offcanvas-gallery');
  let row = container.querySelector('.row');
  if (!row) {
    row = document.createElement('div');
    row.className = 'row g-3 p-3';
    container.appendChild(row);
  }

  const lang = document.documentElement.lang || 'ja';

  sessionsToRender.forEach(session => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4 p-3';
    const card = createCardElement(session, lang);
    col.appendChild(card);
    row.appendChild(col);
  });
}

function showLoading() {
  const container = document.getElementById('offcanvas-gallery');
  let loader = document.getElementById('offcanvas-loading');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'offcanvas-loading';
    loader.textContent = 'Loading...';
    container.appendChild(loader);
  }
  loader.style.display = 'block';
}

function hideLoading() {
  const loader = document.getElementById('offcanvas-loading');
  if (loader) loader.style.display = 'none';
}

function updateSessionCount() {
  const countEl = document.getElementById('offcanvas-session-count');
  if (countEl) {
    countEl.textContent = `${galleryState.displayedCount} / ${galleryState.sessions.length} sessions`;
  }
}

// ============================================================
// セッション詳細モーダル
// ============================================================

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

  // セッションコンテンツ（Markdown→HTML）
  if (contentEl) {
    if (session.log_content) {
      contentEl.innerHTML = marked.parse(session.log_content);
      contentEl.classList.remove('d-none');
    } else {
      contentEl.innerHTML = '';
      contentEl.classList.add('d-none');
    }
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
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
