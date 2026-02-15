/**
 * devlog.js — Devlog Gallery (Accordion collapse)
 *
 * - メイン画面: 3件カード表示
 * - 「もっと見る」→ 残り全件をDOMに追加
 * - カードクリック → その場で詳細が展開/折りたたみ（Bootstrap collapse）
 *
 * Usage: import { initDevlogGallery } from './devlog/devlog.js';
 */

import { marked } from 'marked';
import { createReadMoreButton } from './toggle-buttons.js';

const SESSIONS_URL = './assets/devlog/sessions.json';

let sessions = [];
let isInitialized = false;
let containerEl = null;

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

  loadSessions(counterId);
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
  row.id = 'devlog-gallery-row';

  galleryContainer.appendChild(row);

  const lang = document.documentElement.lang || 'ja';
  renderSessions(row, lang, 0, 3);

  if (sessions.length > 3) {
    const readMoreContainer = document.createElement('div');
    readMoreContainer.className = 'text-center mt-4';
    readMoreContainer.id = 'read-more-container';
    const readMoreBtn = createReadMoreButton(() => {
      renderSessions(row, lang, 3, sessions.length);
      readMoreContainer.remove();
    });
    readMoreContainer.appendChild(readMoreBtn);
    galleryContainer.appendChild(readMoreContainer);
  }

  containerEl.appendChild(galleryContainer);
  console.log('[devlog] Gallery built with', Math.min(3, sessions.length), 'visible cards');
}

function renderSessions(rowEl, lang, startIndex, endIndex) {
  const slice = sessions.slice(startIndex, endIndex);
  slice.forEach((session) => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4 p-2 devlog-card visible';

    const detailId = `detail-${session.id}`;
    const card = createCardElement(session, lang, detailId);
    const detail = createDetailCollapse(session, lang, detailId);

    col.appendChild(card);
    col.appendChild(detail);
    rowEl.appendChild(col);
  });
}

/**
 * カードDOM要素を生成
 */
function createCardElement(session, lang, detailId) {
  const card = document.createElement('div');
  card.className = 'card bg-dark border-0 overflow-hidden h-100';
  card.style.cursor = 'pointer';
  card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
  card.setAttribute('data-bs-toggle', 'collapse');
  card.setAttribute('data-bs-target', `#${detailId}`);
  card.setAttribute('aria-expanded', 'false');
  card.setAttribute('aria-controls', detailId);

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

  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-4px)';
    card.style.boxShadow = '0 8px 24px rgba(100, 150, 255, 0.15)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.boxShadow = '';
  });

  return card;
}

function createDetailCollapse(session, lang, detailId) {
  const collapse = document.createElement('div');
  collapse.className = 'collapse';
  collapse.id = detailId;
  collapse.style.marginTop = '0.75rem';

  const wrapper = document.createElement('div');
  wrapper.className = 'card bg-dark border-0 p-3 devlog-detail-card';

  if (session.cover) {
    const cover = document.createElement('img');
    cover.className = 'img-fluid rounded mb-3';
    cover.alt = 'Session cover';
    cover.src = session.cover;
    cover.style.cursor = 'pointer';
    cover.onerror = () => {
      cover.onerror = null;
      cover.src = './assets/devlog/covers/default.svg';
    };
    cover.addEventListener('click', () => openLightbox(session.cover));
    wrapper.appendChild(cover);
  }

  const title = document.createElement('h5');
  title.className = 'text-light mb-1';
  title.textContent = (lang === 'en' ? session.title_en : session.title_ja) || '';

  const date = document.createElement('small');
  date.className = 'text-muted d-block mb-3';
  date.textContent = session.date_range || '';

  const content = document.createElement('div');
  content.className = 'session-content';
  content.innerHTML = session.log_content ? marked.parse(session.log_content) : '';

  wrapper.appendChild(title);
  wrapper.appendChild(date);
  wrapper.appendChild(content);
  collapse.appendChild(wrapper);

  return collapse;
}

function openLightbox(src) {
  const lightboxImg = document.getElementById('lightbox-image');
  if (lightboxImg) {
    lightboxImg.src = src;
    const lightboxModal = bootstrap.Modal.getOrCreateInstance(
      document.getElementById('imageLightboxModal')
    );
    lightboxModal.show();
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
