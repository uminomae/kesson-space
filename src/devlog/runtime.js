/**
 * devlog/runtime.js — orchestration for Devlog gallery/offcanvas/deeplink flow.
 */

import { requestScroll, SCROLL_PRIORITY, commitNavigationIntent } from '../scroll-coordinator.js';
import { getRequestedScrollTarget, shouldOpenOffcanvas, hasDeepLinkIntent } from '../offcanvas-deeplink.js';
import {
    DEVLOG_DEFAULT_COVER,
    DEVLOG_RETURN_TTL_MS,
    buildSessionHref,
    generateDemoData,
    getSessionDateRange,
    getSessionEndValue,
    getSessionSummary,
    getSessionText,
    getSessionTitle,
    normalizeLang,
    resolveSessionCover,
} from './devlog-model.js';
import {
    applyOffcanvasScrollState,
    consumeReturnState,
    isReturnStateEligible,
    loadPendingReturnState,
    persistReturnState,
    waitForArticlesReady,
} from './devlog-return-state.js';
import {
    buildGallery,
    hideLoading,
    renderSessionCards,
    showListView,
    showLoading,
    updateSessionCount,
    waitForImages,
} from './devlog-render.js';

const SESSIONS_URL = './assets/devlog/sessions.json';
const TOPBAR_DEVLOG_TRIGGER_ID = 'topbar-devlog-btn';

let sessions = [];
let isInitialized = false;
let containerEl = null;
let devlogReadyResolved = false;
let resolveDevlogReady = null;
const devlogReadyPromise = new Promise((resolve) => {
    resolveDevlogReady = resolve;
});

let galleryState = {
    sessions: [],
    displayedCount: 0,
    batchSize: 10,
    isLoading: false,
    offcanvas: null,
};
let hasAutoOpenedDevlogOffcanvas = false;
let hasAppliedDevlogDeepLink = false;
let hasBoundTopbarTrigger = false;
let topbarOpenPending = false;

function markDevlogReady() {
    if (devlogReadyResolved) return;
    devlogReadyResolved = true;
    if (resolveDevlogReady) resolveDevlogReady();
}

function persistReturnStateForGallery(source, sessionId) {
    persistReturnState(source, sessionId, galleryState.displayedCount);
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

    buildGallery({
        containerEl,
        sessions,
        openOffcanvas,
        persistReturnStateFn: persistReturnStateForGallery,
    });
    markDevlogReady();
    waitForImages(containerEl);
}

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
    const offcanvasEl = document.getElementById('devlogOffcanvas');
    const listView = document.getElementById('offcanvas-list-view');
    const offcanvasBody = offcanvasEl ? offcanvasEl.querySelector('.offcanvas-body') : null;
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

    renderSessionCards(batch, persistReturnStateForGallery);
    galleryState.displayedCount = end;

    hideLoading();
    galleryState.isLoading = false;

    updateSessionCount(galleryState.displayedCount, galleryState.sessions.length);
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

    buildGallery({
        containerEl,
        sessions,
        openOffcanvas,
        persistReturnStateFn: persistReturnStateForGallery,
    });

    const offcanvasContainer = document.getElementById('offcanvas-gallery');
    if (!offcanvasContainer) return;

    const shown = galleryState.displayedCount;
    offcanvasContainer.innerHTML = '';
    if (shown > 0) {
        renderSessionCards(galleryState.sessions.slice(0, shown), persistReturnStateForGallery);
    }
    updateSessionCount(galleryState.displayedCount, galleryState.sessions.length);
}

export const __DEVLOG_TEST_API__ = Object.freeze({
    DEVLOG_DEFAULT_COVER,
    DEVLOG_RETURN_TTL_MS,
    normalizeLang,
    getSessionText,
    getSessionTitle,
    getSessionDateRange,
    getSessionSummary,
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
