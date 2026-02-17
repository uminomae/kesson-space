// scroll-coordinator.js
// IMPORTANT: window.scrollTo must be owned by this module only.
// Other modules must request scrolling through requestScroll().

export const SCROLL_RESTORATION_ONCE_KEY = 'kesson.scroll-restoration-once.v1';

let lockDepth = 0;
let activeRequestId = 0;
let pendingRequest = null;
let isFlushing = false;

function normalizeY(targetY) {
  if (!Number.isFinite(targetY)) return 0;
  return Math.max(0, Math.round(targetY));
}

function normalizeBehavior(behavior) {
  return behavior === 'smooth' ? 'smooth' : 'auto';
}

function toPromise(waitFor) {
  if (!waitFor) return Promise.resolve();
  return Promise.resolve(waitFor).catch(() => {});
}

function flushPendingRequest() {
  if (isFlushing || lockDepth > 0 || !pendingRequest) return;
  isFlushing = true;

  const req = pendingRequest;
  req.waitFor.then(() => {
    if (!pendingRequest || pendingRequest.id !== req.id || lockDepth > 0) return;
    pendingRequest = null;
    window.scrollTo({ top: req.targetY, behavior: req.behavior });
  }).finally(() => {
    isFlushing = false;
    if (pendingRequest && lockDepth === 0) {
      flushPendingRequest();
    }
  });
}

export function requestScroll(targetY, source = 'unknown', options = {}) {
  activeRequestId += 1;
  pendingRequest = {
    id: activeRequestId,
    targetY: normalizeY(targetY),
    source,
    behavior: normalizeBehavior(options.behavior),
    waitFor: toPromise(options.waitFor),
  };
  flushPendingRequest();
}

export function lockScroll(source = 'unknown') {
  lockDepth += 1;
  return source;
}

export function unlockScroll(source = 'unknown') {
  if (lockDepth > 0) {
    lockDepth -= 1;
  }
  if (lockDepth === 0) {
    flushPendingRequest();
  }
  return source;
}

export function armManualRestoration(source = 'unknown') {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SCROLL_RESTORATION_ONCE_KEY, JSON.stringify({
      armedAt: Date.now(),
      source,
    }));
  } catch (error) {
    // Ignore sessionStorage failures in restrictive environments.
  }
}
