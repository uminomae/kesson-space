/**
 * devlog.js — Devlog Gallery (Offcanvas + 無限スクロール版)
 *
 * - メイン画面: 3件カード表示
 * - Read More → Offcanvas右スライドイン（全セッション一覧）
 * - カードクリック → devlog.html?id=xxx に遷移
 * - 無限スクロールで10件ずつ追加読み込み
 *
 * Usage: import { initDevlogGallery } from './devlog/devlog.js';
 */

import { createReadMoreButton } from './toggle-buttons.js';

const SESSIONS_URL = './assets/devlog/sessions.json';
const DEVLOG_RETURN_STATE_KEY = 'kesson.devlog.return-state.v1';
const DEVLOG_RETURN_INTENT_KEY = 'kesson.devlog.return-intent.v1';
const DEVLOG_RETURN_TTL_MS = 30 * 60 * 1000;
const ARTICLES_READY_EVENT = 'kesson:articles-ready';

let sessions = [];
let isInitialized = false;
let containerEl = null;
let devlogReadyResolved = false;
let resolveDevlogReady = null;
const devlogReadyPromise = new Promise((resolve) => {
  resolveDevlogReady = resolve;
});

let galleryState = {
  sessions: [],           // 全セッションデータ
  displayedCount: 0,      // Offcanvas内の表示済み件数
  batchSize: 10,          // 1回の読み込み件数
  isLoading: false,       // 読み込み中フラグ
  offcanvas: null          // Bootstrap Offcanvasインスタンス
};


function getSessionEndValue(session) {
  const end = session.end || session.start;
  const value = end ? Date.parse(end) : 0;
  return Number.isNaN(value) ? 0 : value;
}

function markDevlogReady() {
  if (devlogReadyResolved) return;
  devlogReadyResolved = true;
  if (resolveDevlogReady) resolveDevlogReady();
}

function waitForImages(rootEl, timeoutMs = 1500) {
  if (!rootEl) return Promise.resolve();
  const pendingImages = Array.from(rootEl.querySelectorAll('img')).filter((img) => !img.complete);
  if (pendingImages.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let resolved = false;
    let remaining = pendingImages.length;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      resolve();
    };

    const timer = setTimeout(finish, timeoutMs);
    const onImageDone = () => {
      remaining -= 1;
      if (remaining <= 0) {
        clearTimeout(timer);
        finish();
      }
    };

    pendingImages.forEach((img) => {
      img.addEventListener('load', onImageDone, { once: true });
      img.addEventListener('error', onImageDone, { once: true });
    });
  });
}

function readSessionJson(key) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[devlog] Failed to parse sessionStorage key: ${key}`, error);
    return null;
  }
}

function writeSessionJson(key, value) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[devlog] Failed to write sessionStorage key: ${key}`, error);
  }
}

function removeSessionKey(key) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.warn(`[devlog] Failed to remove sessionStorage key: ${key}`, error);
  }
}

function persistReturnState(source, sessionId) {
  if (typeof window === 'undefined') return;

  const listView = document.getElementById('offcanvas-list-view');
  const fromOffcanvas = source === 'offcanvas';
  writeSessionJson(DEVLOG_RETURN_STATE_KEY, {
    source,
    sessionId,
    pageScrollY: window.scrollY,
    offcanvasOpen: fromOffcanvas,
    offcanvasScrollTop: fromOffcanvas && listView ? listView.scrollTop : 0,
    displayedCount: fromOffcanvas ? galleryState.displayedCount : 0,
    savedAt: Date.now(),
  });
}

function loadAndConsumePendingReturnState() {
  const intent = readSessionJson(DEVLOG_RETURN_INTENT_KEY);
  if (!intent) return null;

  const state = readSessionJson(DEVLOG_RETURN_STATE_KEY);
  removeSessionKey(DEVLOG_RETURN_INTENT_KEY);
  removeSessionKey(DEVLOG_RETURN_STATE_KEY);

  if (!state || !Number.isFinite(state.savedAt)) return null;
  if ((Date.now() - state.savedAt) > DEVLOG_RETURN_TTL_MS) return null;
  if (!Number.isFinite(state.pageScrollY)) return null;

  return state;
}

function waitForArticlesReady(timeoutMs = 3000) {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.__kessonArticlesReady === true) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener(ARTICLES_READY_EVENT, onReady);
      clearTimeout(timer);
      resolve();
    };
    const onReady = () => finish();
    const timer = setTimeout(finish, timeoutMs);
    window.addEventListener(ARTICLES_READY_EVENT, onReady, { once: true });
  });
}

function restoreMainPageScroll(state) {
  const restoreY = Number.isFinite(state?.pageScrollY) ? state.pageScrollY : 0;
  requestAnimationFrame(() => {
    window.scrollTo(0, restoreY);
  });
}

/**
 * ギャラリーを初期化
 */
export function initDevlogGallery(containerId = 'devlog-gallery-container') {
  if (isInitialized) return;

  containerEl = document.getElementById(containerId);
  if (!containerEl) {
    console.warn('[devlog] Container not found:', containerId);
    return;
  }

  loadSessions();
  setupInfiniteScroll();
  setupBackButton();
  setupOffcanvasReset();
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

async function loadSessions() {
  try {
    const res = await fetch(SESSIONS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    sessions = await res.json();

    sessions.sort((a, b) => getSessionEndValue(b) - getSessionEndValue(a));

    await Promise.all(sessions.map(async (session) => {
      session.log_content = await loadSessionContent(session.id);
    }));
  } catch (e) {
    console.warn('sessions.json not found, using demo data:', e.message);
    sessions = generateDemoData();
  }

  galleryState.sessions = sessions;
  console.log('[devlog] Loaded', sessions.length, 'sessions');
  buildGallery();
  await waitForImages(containerEl);
  markDevlogReady();
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

  const row = document.createElement('div');
  row.className = 'row g-3';

  const lang = document.documentElement.lang || 'ja';
  const visibleSessions = sessions.slice(0, 3);

  visibleSessions.forEach((session) => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const card = createCardElement(session, lang, 'main');
    col.appendChild(card);
    row.appendChild(col);
  });

  galleryContainer.appendChild(row);

  if (sessions.length > 3) {
    const readMoreContainer = document.createElement('div');
    readMoreContainer.className = 'text-center mt-4';
    readMoreContainer.id = 'read-more-container';
    const remainingCount = sessions.length - visibleSessions.length;
    const readMoreBtn = createReadMoreButton(openOffcanvas, remainingCount);
    readMoreContainer.appendChild(readMoreBtn);
    galleryContainer.appendChild(readMoreContainer);
  }

  containerEl.appendChild(galleryContainer);
  console.log('[devlog] Gallery built with', visibleSessions.length, 'visible cards');
}

/**
 * カードDOM要素を生成（メイン画面・Offcanvas共用）
 * カードクリックで devlog.html?id=xxx に遷移
 */
function createCardElement(session, lang, source = 'main') {
  const href = `./devlog.html?id=${session.id}`;

  const link = document.createElement('a');
  link.className = 'kesson-card-link text-decoration-none';
  link.href = href;
  link.addEventListener('click', () => {
    persistReturnState(source, session.id);
  });
  link.setAttribute(
    'aria-label',
    lang === 'en'
      ? `Open devlog session: ${session.title_en || session.title_ja}`
      : `Devlogを開く: ${session.title_ja || session.title_en}`
  );

  const card = document.createElement('div');
  card.className = 'card kesson-card h-100';

  const img = document.createElement('img');
  img.className = 'card-img-top';
  img.src = session.cover;
  img.alt = session.title_ja;
  img.onerror = () => {
    img.onerror = null;
    img.src = './assets/devlog/covers/default.svg';
  };

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const title = document.createElement('h6');
  title.className = 'card-title mb-1';
  title.textContent = lang === 'en' ? session.title_en : session.title_ja;

  const date = document.createElement('small');
  date.textContent = session.date_range;

  cardBody.appendChild(title);
  cardBody.appendChild(date);
  card.appendChild(img);
  card.appendChild(cardBody);
  link.appendChild(card);
  return link;
}

// ============================================================
// Offcanvas + 無限スクロール
// ============================================================

function openOffcanvas({ restoreState = null } = {}) {
  const offcanvasEl = document.getElementById('devlogOffcanvas');
  if (!offcanvasEl || typeof bootstrap === 'undefined') {
    console.warn('[devlog] Offcanvas is not ready');
    return;
  }

  if (!galleryState.offcanvas) {
    galleryState.offcanvas = new bootstrap.Offcanvas(offcanvasEl);
  }

  galleryState.displayedCount = 0;
  const galleryEl = document.getElementById('offcanvas-gallery');
  if (galleryEl) galleryEl.innerHTML = '';
  showListView();

  const requestedCount = restoreState && restoreState.offcanvasOpen
    ? restoreState.displayedCount
    : galleryState.batchSize;
  const targetCount = Math.min(
    galleryState.sessions.length,
    Math.max(
      galleryState.batchSize,
      Number.isFinite(requestedCount) ? requestedCount : galleryState.batchSize
    )
  );

  while (galleryState.displayedCount < targetCount) {
    loadMoreSessions();
  }

  if (restoreState && restoreState.offcanvasOpen) {
    const restoreScrollTop = Number.isFinite(restoreState.offcanvasScrollTop)
      ? restoreState.offcanvasScrollTop
      : 0;
    const restorePageY = Number.isFinite(restoreState.pageScrollY)
      ? restoreState.pageScrollY
      : 0;
    offcanvasEl.addEventListener('shown.bs.offcanvas', function onShown() {
      offcanvasEl.removeEventListener('shown.bs.offcanvas', onShown);
      const listView = document.getElementById('offcanvas-list-view');
      window.scrollTo(0, restorePageY);
      if (listView) {
        listView.scrollTop = restoreScrollTop;
        waitForImages(galleryEl).then(() => {
          listView.scrollTop = restoreScrollTop;
        });
      }
    });
  }

  galleryState.offcanvas.show();
}

function setupInfiniteScroll() {
  const container = document.getElementById('offcanvas-list-view');
  if (!container) return;

  container.addEventListener('scroll', () => {
    if (galleryState.isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMoreSessions();
    }
  });
}

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
    col.className = 'col-12 col-md-6 col-lg-4';
    const card = createCardElement(session, lang, 'offcanvas');
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

function showListView() {
  const listView = document.getElementById('offcanvas-list-view');
  const detailView = document.getElementById('offcanvas-detail-view');
  const backBtn = document.getElementById('offcanvas-back-btn');

  if (detailView) detailView.classList.add('d-none');
  if (listView) listView.classList.remove('d-none');
  if (backBtn) backBtn.classList.add('d-none');
}

function setupBackButton() {
  const backBtn = document.getElementById('offcanvas-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', showListView);
  }
}

function setupOffcanvasReset() {
  const offcanvasEl = document.getElementById('devlogOffcanvas');
  if (offcanvasEl) {
    offcanvasEl.addEventListener('hidden.bs.offcanvas', () => {
      showListView();
    });
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

export function refreshDevlogLanguage() {
  if (!isInitialized) return;

  buildGallery();

  const offcanvasContainer = document.getElementById('offcanvas-gallery');
  if (!offcanvasContainer) return;

  const shown = galleryState.displayedCount;
  offcanvasContainer.innerHTML = '';
  if (shown > 0) {
    renderSessionCards(galleryState.sessions.slice(0, shown));
    updateSessionCount();
  }
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

function observeGallerySection() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !isInitialized) {
        console.log('[devlog] Section visible, initializing gallery');
        initDevlogGallery();
        observer.disconnect();
      }
    });
  }, { threshold: 0.1 });

  const section = document.getElementById('devlog-gallery-section');
  if (section) {
    console.log('[devlog] Observing gallery section');
    observer.observe(section);
  } else {
    console.warn('[devlog] Gallery section not found');
  }
}

function runPendingReturnFlow(pendingState) {
  const start = () => {
    if (!isInitialized) {
      initDevlogGallery();
    }

    if (pendingState.offcanvasOpen) {
      devlogReadyPromise.then(() => {
        openOffcanvas({ restoreState: pendingState });
      });
      return;
    }

    Promise.all([devlogReadyPromise, waitForArticlesReady()]).then(() => {
      restoreMainPageScroll(pendingState);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}

// Auto-initialize and return restoration bootstrap
if (typeof window !== 'undefined') {
  const pendingState = loadAndConsumePendingReturnState();
  if (pendingState) {
    runPendingReturnFlow(pendingState);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeGallerySection, { once: true });
  } else {
    observeGallerySection();
  }
}
