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

import { requestScroll, SCROLL_PRIORITY, commitNavigationIntent } from '../scroll-coordinator.js';
import { createReadMoreButton } from './toggle-buttons.js';
import { getRequestedScrollTarget, shouldOpenOffcanvas, hasDeepLinkIntent } from '../offcanvas-deeplink.js';

const SESSIONS_URL = './assets/devlog/sessions.json';
const DEVLOG_RETURN_STATE_KEY = 'kesson.devlog.return-state.v1';
const DEVLOG_RETURN_INTENT_KEY = 'kesson.devlog.return-intent.v1';
const DEVLOG_RETURN_TTL_MS = 30 * 60 * 1000;
const ARTICLES_READY_EVENT = 'kesson:articles-ready';
const TOPBAR_DEVLOG_TRIGGER_ID = 'topbar-devlog-btn';
const DEVLOG_DEFAULT_COVER = './assets/devlog/covers/default.svg';
const SUPPORTED_LANGS = new Set(['ja', 'en']);
const DEVLOG_UI_STRINGS = {
  ja: {
    openLabel: 'Devlogを開く',
    loading: '読み込み中...',
    sessionUnit: 'セッション',
    coverFallbackNote: 'カバー画像の英語版は準備中です',
  },
  en: {
    openLabel: 'Open devlog session',
    loading: 'Loading...',
    sessionUnit: 'sessions',
    coverFallbackNote: 'English cover image pending',
  },
};

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
let hasAutoOpenedDevlogOffcanvas = false;
let hasAppliedDevlogDeepLink = false;
let hasBoundTopbarTrigger = false;
let topbarOpenPending = false;

function normalizeLang(lang) {
  return SUPPORTED_LANGS.has(lang) ? lang : 'ja';
}

function getCurrentLang() {
  if (typeof document === 'undefined') return 'ja';
  return normalizeLang(document.documentElement.lang || 'ja');
}

function getUiStrings(lang) {
  return DEVLOG_UI_STRINGS[normalizeLang(lang)];
}

function getSessionText(session, key, lang) {
  if (!session || typeof session !== 'object') return '';
  const normalizedLang = normalizeLang(lang);
  const fallbackLang = normalizedLang === 'en' ? 'ja' : 'en';
  const byLangKey = `${key}_${normalizedLang}`;
  const fallbackByLangKey = `${key}_${fallbackLang}`;

  if (typeof session[byLangKey] === 'string' && session[byLangKey].trim()) {
    return session[byLangKey];
  }
  if (typeof session[fallbackByLangKey] === 'string' && session[fallbackByLangKey].trim()) {
    return session[fallbackByLangKey];
  }

  const value = session[key];
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object') {
    if (typeof value[normalizedLang] === 'string' && value[normalizedLang].trim()) return value[normalizedLang];
    if (typeof value[fallbackLang] === 'string' && value[fallbackLang].trim()) return value[fallbackLang];
  }
  return '';
}

function getSessionTitle(session, lang) {
  return getSessionText(session, 'title', lang) || session.id || '';
}

function getSessionDateRange(session, lang) {
  return getSessionText(session, 'date_range', lang) || session.id || '';
}

function buildSessionHref(sessionId, lang) {
  const params = new URLSearchParams();
  params.set('id', sessionId);
  if (normalizeLang(lang) === 'en') params.set('lang', 'en');
  return `./devlog.html?${params.toString()}`;
}

function readSessionCoverValue(session, lang) {
  if (!session || typeof session !== 'object') return '';
  const normalizedLang = normalizeLang(lang);
  const fallbackLang = normalizedLang === 'en' ? 'ja' : 'en';

  const byLang = session.cover_by_lang;
  if (byLang && typeof byLang === 'object') {
    if (typeof byLang[normalizedLang] === 'string' && byLang[normalizedLang].trim()) return byLang[normalizedLang];
    if (typeof byLang[fallbackLang] === 'string' && byLang[fallbackLang].trim()) return byLang[fallbackLang];
  }

  const key = `cover_${normalizedLang}`;
  if (typeof session[key] === 'string' && session[key].trim()) return session[key];

  const fallbackKey = `cover_${fallbackLang}`;
  if (typeof session[fallbackKey] === 'string' && session[fallbackKey].trim()) return session[fallbackKey];

  if (typeof session.cover === 'string' && session.cover.trim()) return session.cover;
  return '';
}

function resolveSessionCover(session, lang) {
  const normalizedLang = normalizeLang(lang);

  if (normalizedLang === 'en') {
    const explicitEnCover = (() => {
      if (typeof session?.cover_en === 'string' && session.cover_en.trim()) return session.cover_en;
      const byLang = session?.cover_by_lang;
      if (byLang && typeof byLang === 'object' && typeof byLang.en === 'string' && byLang.en.trim()) {
        return byLang.en;
      }
      return '';
    })();

    if (explicitEnCover) {
      return { src: explicitEnCover, localized: true };
    }

    return { src: DEVLOG_DEFAULT_COVER, localized: false };
  }

  const localizedCover = readSessionCoverValue(session, normalizedLang);
  if (localizedCover) {
    return { src: localizedCover, localized: true };
  }

  return { src: DEVLOG_DEFAULT_COVER, localized: false };
}


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

function getOffcanvasScrollNodes() {
  const offcanvasEl = document.getElementById('devlogOffcanvas');
  if (!offcanvasEl) {
    return { offcanvasEl: null, listView: null, offcanvasBody: null };
  }
  const listView = document.getElementById('offcanvas-list-view');
  const offcanvasBody = offcanvasEl.querySelector('.offcanvas-body');
  return { offcanvasEl, listView, offcanvasBody };
}

function readOffcanvasScrollState() {
  const { listView, offcanvasBody } = getOffcanvasScrollNodes();
  const listTop = listView ? listView.scrollTop : 0;
  const bodyTop = offcanvasBody ? offcanvasBody.scrollTop : 0;

  let container = 'list-view';
  let top = listTop;

  if (bodyTop > listTop) {
    container = 'offcanvas-body';
    top = bodyTop;
  } else if (listTop === 0 && bodyTop === 0 && offcanvasBody && listView) {
    const listScrollable = listView.scrollHeight > listView.clientHeight + 1;
    const bodyScrollable = offcanvasBody.scrollHeight > offcanvasBody.clientHeight + 1;
    if (bodyScrollable && !listScrollable) {
      container = 'offcanvas-body';
    }
  }

  return { top, container, listTop, bodyTop };
}

function applyOffcanvasScrollState(state) {
  const { listView, offcanvasBody } = getOffcanvasScrollNodes();
  if (!listView && !offcanvasBody) return;

  const fallbackTop = Number.isFinite(state?.offcanvasScrollTop) ? state.offcanvasScrollTop : 0;
  const container = state?.offcanvasScrollContainer;
  const listTop = Number.isFinite(state?.offcanvasListScrollTop)
    ? state.offcanvasListScrollTop
    : (container === 'list-view' ? fallbackTop : null);
  const bodyTop = Number.isFinite(state?.offcanvasBodyScrollTop)
    ? state.offcanvasBodyScrollTop
    : (container === 'offcanvas-body' ? fallbackTop : null);

  if (container === 'list-view') {
    if (listView) listView.scrollTop = Number.isFinite(listTop) ? listTop : fallbackTop;
    return;
  }
  if (container === 'offcanvas-body') {
    if (offcanvasBody) offcanvasBody.scrollTop = Number.isFinite(bodyTop) ? bodyTop : fallbackTop;
    return;
  }

  // Backward compatibility for legacy states without container metadata.
  if (listView) listView.scrollTop = fallbackTop;
  if (offcanvasBody) offcanvasBody.scrollTop = fallbackTop;
}

function persistReturnState(source, sessionId) {
  if (typeof window === 'undefined') return;

  const fromOffcanvas = source === 'offcanvas';
  const offcanvasState = fromOffcanvas ? readOffcanvasScrollState() : null;
  writeSessionJson(DEVLOG_RETURN_STATE_KEY, {
    source,
    sessionId,
    pageScrollY: window.scrollY,
    offcanvasOpen: fromOffcanvas,
    offcanvasScrollTop: offcanvasState ? offcanvasState.top : 0,
    offcanvasScrollContainer: offcanvasState ? offcanvasState.container : null,
    offcanvasListScrollTop: offcanvasState ? offcanvasState.listTop : 0,
    offcanvasBodyScrollTop: offcanvasState ? offcanvasState.bodyTop : 0,
    displayedCount: fromOffcanvas ? galleryState.displayedCount : 0,
    savedAt: Date.now(),
  });
}

function loadPendingReturnState() {
  const intent = readSessionJson(DEVLOG_RETURN_INTENT_KEY);
  const state = readSessionJson(DEVLOG_RETURN_STATE_KEY);
  if (!isReturnStateEligible(intent, state)) return null;
  return state;
}

function consumeReturnState() {
  removeSessionKey(DEVLOG_RETURN_INTENT_KEY);
  removeSessionKey(DEVLOG_RETURN_STATE_KEY);
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

function isReturnStateEligible(intent, state, now = Date.now()) {
  if (!intent || typeof intent !== 'object') return false;
  if (!state || typeof state !== 'object') return false;
  if (!Number.isFinite(state.savedAt)) return false;
  if (!Number.isFinite(state.pageScrollY)) return false;
  if ((now - state.savedAt) > DEVLOG_RETURN_TTL_MS) return false;
  if (intent.sessionId && state.sessionId && intent.sessionId !== state.sessionId) return false;
  return true;
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

async function loadSessions() {
  try {
    const res = await fetch(SESSIONS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    sessions = await res.json();

    sessions.sort((a, b) => getSessionEndValue(b) - getSessionEndValue(a));
    sessions.forEach((session) => {
      if (!Object.prototype.hasOwnProperty.call(session, 'log_content')) {
        session.log_content = null;
      }
    });
  } catch (e) {
    console.warn('sessions.json not found, using demo data:', e.message);
    sessions = generateDemoData();
  }

  galleryState.sessions = sessions;
  console.log('[devlog] Loaded', sessions.length, 'sessions');
  buildGallery();
  markDevlogReady();
  waitForImages(containerEl);
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

  const lang = getCurrentLang();
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
    const readMoreBtn = createReadMoreButton(openOffcanvas, remainingCount, lang);
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
  const sessionTitle = getSessionTitle(session, lang);
  const sessionDateRange = getSessionDateRange(session, lang);
  const sessionCover = resolveSessionCover(session, lang);
  const href = buildSessionHref(session.id, lang);
  const strings = getUiStrings(lang);

  const link = document.createElement('a');
  link.className = 'kesson-card-link text-decoration-none';
  link.href = href;
  link.addEventListener('click', () => {
    persistReturnState(source, session.id);
  });
  link.setAttribute(
    'aria-label',
    `${strings.openLabel}: ${sessionTitle}`
  );

  const card = document.createElement('div');
  card.className = 'card kesson-card h-100';

  const img = document.createElement('img');
  img.className = 'card-img-top';
  img.src = sessionCover.src;
  img.alt = sessionTitle;
  img.onerror = () => {
    img.onerror = null;
    img.src = DEVLOG_DEFAULT_COVER;
  };

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const title = document.createElement('h6');
  title.className = 'card-title mb-1';
  title.textContent = sessionTitle;

  const date = document.createElement('small');
  date.textContent = sessionDateRange;

  cardBody.appendChild(title);
  cardBody.appendChild(date);
  if (normalizeLang(lang) === 'en' && !sessionCover.localized) {
    const coverNote = document.createElement('small');
    coverNote.className = 'kesson-card-cover-note d-block mt-2';
    coverNote.textContent = strings.coverFallbackNote;
    cardBody.appendChild(coverNote);
  }
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
    const restorePageY = Number.isFinite(restoreState.pageScrollY)
      ? restoreState.pageScrollY
      : 0;
    offcanvasEl.addEventListener('shown.bs.offcanvas', function onShown() {
      offcanvasEl.removeEventListener('shown.bs.offcanvas', onShown);
      // IMPORTANT: window scroll must be owned by scroll-coordinator.
      requestScroll(restorePageY, 'devlog-return:offcanvas-page');
      applyOffcanvasScrollState(restoreState);
      waitForImages(galleryEl).then(() => {
        applyOffcanvasScrollState(restoreState);
      });
    });
  }

  galleryState.offcanvas.show();
}

function bindTopbarDevlogTrigger() {
  if (hasBoundTopbarTrigger) return;

  const trigger = document.getElementById(TOPBAR_DEVLOG_TRIGGER_ID);
  if (!(trigger instanceof HTMLButtonElement)) return;
  hasBoundTopbarTrigger = true;

  const prewarm = () => {
    if (!isInitialized) {
      initDevlogGallery();
    }
  };

  trigger.addEventListener('pointerenter', prewarm, { once: true });
  trigger.addEventListener('focus', prewarm, { once: true });
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    prewarm();

    if (devlogReadyResolved) {
      openOffcanvas();
      return;
    }

    if (topbarOpenPending) return;
    topbarOpenPending = true;
    trigger.setAttribute('aria-busy', 'true');
    devlogReadyPromise.then(() => {
      topbarOpenPending = false;
      trigger.removeAttribute('aria-busy');
      openOffcanvas();
    });
  });
}

function waitForTwoAnimationFrames() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

function requestScrollToElement(el, source, priority = SCROLL_PRIORITY.DEFAULT) {
  if (!el) return;
  const targetY = window.scrollY + el.getBoundingClientRect().top - 24;
  requestScroll(targetY, source, { behavior: 'auto', priority });
}

function findDevlogScrollTargetElement() {
  const requested = getRequestedScrollTarget();
  const heading = document.querySelector('#devlog-gallery-section .section-heading');
  const readMore = document.querySelector('#devlog-gallery-section .btn-read-more');

  if (requested === 'devlog-readmore') {
    return readMore || heading;
  }
  if (requested === 'devlog-heading') {
    return heading;
  }
  return null;
}

function openDevlogOffcanvasFromDeepLink(attempt = 0) {
  if (hasAutoOpenedDevlogOffcanvas || !shouldOpenOffcanvas('devlog')) return;

  if (typeof bootstrap === 'undefined' || !bootstrap.Offcanvas) {
    if (attempt < 30) {
      window.setTimeout(() => openDevlogOffcanvasFromDeepLink(attempt + 1), 100);
    }
    return;
  }

  hasAutoOpenedDevlogOffcanvas = true;
  openOffcanvas();
}

function applyDevlogDeepLinkIntent() {
  if (hasAppliedDevlogDeepLink) return;
  hasAppliedDevlogDeepLink = true;

  const targetEl = findDevlogScrollTargetElement();
  if (targetEl) {
    requestScrollToElement(targetEl, 'deeplink:devlog', SCROLL_PRIORITY.DEEP_LINK);
  }

  if (shouldOpenOffcanvas('devlog')) {
    waitForTwoAnimationFrames().then(() => {
      openDevlogOffcanvasFromDeepLink();
    });
  }
}

function setupInfiniteScroll() {
  const { listView, offcanvasBody } = getOffcanvasScrollNodes();
  const targets = [listView, offcanvasBody].filter(Boolean);
  if (targets.length === 0) return;

  const onScroll = (event) => {
    if (galleryState.isLoading) return;

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMoreSessions();
    }
  };

  targets.forEach((target) => {
    target.addEventListener('scroll', onScroll, { passive: true });
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

  const lang = getCurrentLang();

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
  const lang = getCurrentLang();
  const strings = getUiStrings(lang);
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'offcanvas-loading';
    container.appendChild(loader);
  }
  loader.textContent = strings.loading;
  loader.style.display = 'block';
}

function hideLoading() {
  const loader = document.getElementById('offcanvas-loading');
  if (loader) loader.style.display = 'none';
}

function updateSessionCount() {
  const countEl = document.getElementById('offcanvas-session-count');
  if (countEl) {
    const strings = getUiStrings(getCurrentLang());
    countEl.textContent = `${galleryState.displayedCount} / ${galleryState.sessions.length} ${strings.sessionUnit}`;
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
  }
  updateSessionCount();
}

export const __DEVLOG_TEST_API__ = Object.freeze({
  DEVLOG_DEFAULT_COVER,
  DEVLOG_RETURN_TTL_MS,
  normalizeLang,
  getSessionText,
  getSessionTitle,
  getSessionDateRange,
  buildSessionHref,
  resolveSessionCover,
  getSessionEndValue,
  isReturnStateEligible,
});

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
        consumeReturnState();
      });
      return;
    }

    // IMPORTANT: window scroll must have one owner (scroll-coordinator).
    requestScroll(pendingState.pageScrollY, 'devlog-return:page', {
      waitFor: Promise.all([devlogReadyPromise, waitForArticlesReady()]),
      behavior: 'auto',
      priority: SCROLL_PRIORITY.RETURN_RESTORE,
    });
    consumeReturnState();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}

// Auto-initialize and return restoration bootstrap
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTopbarDevlogTrigger, { once: true });
  } else {
    bindTopbarDevlogTrigger();
  }

  const urlHasIntent = hasDeepLinkIntent();
  const requestedScrollTarget = getRequestedScrollTarget();
  const wantsDevlogIntent = shouldOpenOffcanvas('devlog')
    || requestedScrollTarget === 'devlog-heading'
    || requestedScrollTarget === 'devlog-readmore';

  if (urlHasIntent) {
    // URL priority: ignore return state if URL intent exists.
    if (wantsDevlogIntent) {
      const start = () => {
        if (!isInitialized) {
          initDevlogGallery();
        }
        devlogReadyPromise.then(() => {
          applyDevlogDeepLinkIntent();
          commitNavigationIntent('devlog:deeplink');
        });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
      } else {
        start();
      }
    } else if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observeGallerySection, { once: true });
    } else {
      observeGallerySection();
    }
  } else {
    const pendingState = loadPendingReturnState();
    if (pendingState) {
      runPendingReturnFlow(pendingState);
    } else if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observeGallerySection, { once: true });
    } else {
      observeGallerySection();
    }
  }
}
