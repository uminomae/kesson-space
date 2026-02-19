import { DEVLOG_RETURN_TTL_MS } from './devlog-model.js';

// DECISION: return/deeplink restoration state is isolated from UI rendering so storage semantics and
// eligibility rules stay centralized and can be evolved without touching card/offcanvas rendering code. (Phase B-2 / 2026-02-19)

const DEVLOG_RETURN_STATE_KEY = 'kesson.devlog.return-state.v1';
const DEVLOG_RETURN_INTENT_KEY = 'kesson.devlog.return-intent.v1';
const ARTICLES_READY_EVENT = 'kesson:articles-ready';

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

export function applyOffcanvasScrollState(state) {
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

export function persistReturnState(source, sessionId, displayedCount) {
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
        displayedCount: fromOffcanvas ? displayedCount : 0,
        savedAt: Date.now(),
    });
}

export function isReturnStateEligible(intent, state, now = Date.now()) {
    if (!intent || typeof intent !== 'object') return false;
    if (!state || typeof state !== 'object') return false;
    if (!Number.isFinite(state.savedAt)) return false;
    if (!Number.isFinite(state.pageScrollY)) return false;
    if ((now - state.savedAt) > DEVLOG_RETURN_TTL_MS) return false;
    if (intent.sessionId && state.sessionId && intent.sessionId !== state.sessionId) return false;
    return true;
}

export function loadPendingReturnState() {
    const intent = readSessionJson(DEVLOG_RETURN_INTENT_KEY);
    const state = readSessionJson(DEVLOG_RETURN_STATE_KEY);
    if (!isReturnStateEligible(intent, state)) return null;
    return state;
}

export function consumeReturnState() {
    removeSessionKey(DEVLOG_RETURN_INTENT_KEY);
    removeSessionKey(DEVLOG_RETURN_STATE_KEY);
}

export function waitForArticlesReady(timeoutMs = 3000) {
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
