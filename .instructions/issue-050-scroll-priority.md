# Issue #50 実装指示書 — scroll priority refactor

## 概要
URL deep link 優先 + 戻り復元の正本統一。
scroll-coordinator に priority 機構を導入し、起動時のナビゲーション意図を決定論的に解決する。

Issue: https://github.com/uminomae/kesson-space/issues/50

## 作業ブランチ
`dev`

## ルール
- 既存の export API シグネチャは後方互換を維持する（priority は options 内のオプショナル）
- テスト用 console.log は `[scroll]` `[devlog]` `[articles]` プレフィックス付きで残す
- `window.scrollTo` の呼び出しは scroll-coordinator.js 内のみ（他モジュール禁止）

---

## 変更対象ファイル（6ファイル）

1. `src/scroll-coordinator.js`
2. `src/devlog/devlog.js`
3. `src/offcanvas-deeplink.js`
4. `src/pages/articles-section.js`
5. `index.html`
6. `devlog.html`

---

## 1. `src/scroll-coordinator.js` — priority + init phase 機構

### 1-1. priority 定数を追加（export する）

```js
export const SCROLL_PRIORITY = Object.freeze({
  DEEP_LINK:      100,
  RETURN_RESTORE:  50,
  INITIAL_TOP:     10,
  BFCACHE:          5,
  DEFAULT:          1,
});
```

### 1-2. init phase フラグを追加

モジュールスコープに以下を追加:

```js
let initPhase = false;  // true の間は flush を抑制し、最高優先 pending のみ蓄積
```

### 1-3. requestScroll を priority 対応に変更

`options.priority` を受け取る。init phase 中は、既存 pending より priority が高い場合のみ上書きする。

```js
export function requestScroll(targetY, source = 'unknown', options = {}) {
  const priority = Number.isFinite(options.priority) ? options.priority : SCROLL_PRIORITY.DEFAULT;

  // init phase 中: 高優先のみ上書き
  if (initPhase && pendingRequest && pendingRequest.priority >= priority) {
    return;
  }

  activeRequestId += 1;
  pendingRequest = {
    id: activeRequestId,
    targetY: normalizeY(targetY),
    source,
    behavior: normalizeBehavior(options.behavior),
    waitFor: toPromise(options.waitFor),
    priority,
  };

  // init phase 中は flush しない
  if (!initPhase) {
    flushPendingRequest();
  }
}
```

### 1-4. commitNavigationIntent を追加（export する）

init phase を終了し、蓄積された最高優先 pending を flush する。

```js
export function commitNavigationIntent(source = 'unknown') {
  if (!initPhase) return;
  initPhase = false;
  console.log('[scroll] commitNavigationIntent:', source,
    pendingRequest ? `winner=${pendingRequest.source}(p=${pendingRequest.priority})` : 'no-pending');
  flushPendingRequest();
}
```

### 1-5. initScrollCoordinator を変更

```js
export function initScrollCoordinator({ forceTopOnLoad = true } = {}) {
  if (lifecycleInitialized || !hasWindow()) return;
  lifecycleInitialized = true;
  initPhase = true;  // ← init phase 開始

  applyInitialScrollRestoration();

  const armForNextLoad = () => {
    armManualRestoration(PAGE_EXIT_ARM_SOURCE);
  };

  window.addEventListener('pagehide', armForNextLoad, { capture: true });
  window.addEventListener('beforeunload', armForNextLoad, { capture: true });

  // bfcache: init phase 外で発火するため通常 flush されるが、
  // ブラウザ復元に任せるため何もしない（requestTop 削除）
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      console.log('[scroll] bfcache pageshow — no forced scroll');
    }
  });

  if (forceTopOnLoad) {
    requestScroll(0, 'initial-load', {
      behavior: 'auto',
      waitFor: waitForTwoAnimationFrames(),
      priority: SCROLL_PRIORITY.INITIAL_TOP,
    });
  }

  // auto-commit: DOMContentLoaded + 2 rAF 後に init phase を自動終了
  // （各モジュールが明示 commit しない場合のフォールバック）
  const autoCommit = () => {
    waitForTwoAnimationFrames().then(() => {
      commitNavigationIntent('auto-commit');
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoCommit, { once: true });
  } else {
    autoCommit();
  }
}
```

### 1-6. requestTop を priority 対応に

```js
function requestTop(source = 'unknown', priority = SCROLL_PRIORITY.INITIAL_TOP) {
  requestScroll(0, source, {
    behavior: 'auto',
    waitFor: waitForTwoAnimationFrames(),
    priority,
  });
}
```

requestTop は内部関数のまま（export 不要）。

---

## 2. `src/offcanvas-deeplink.js` — hasDeepLinkIntent 追加

既存コードの末尾に以下を追加:

```js
export function hasDeepLinkIntent() {
  const intent = getDeepLinkIntent();
  return Boolean(intent.openPanel || intent.scrollTarget);
}
```

他の変更なし。

---

## 3. `src/devlog/devlog.js` — bootstrap 分岐をURL優先に + consume 後ろ倒し

### 3-1. import 追加

既存の import を変更:

```js
import { requestScroll, SCROLL_PRIORITY, commitNavigationIntent } from '../scroll-coordinator.js';
import { createReadMoreButton } from './toggle-buttons.js';
import { getRequestedScrollTarget, shouldOpenOffcanvas, hasDeepLinkIntent } from '../offcanvas-deeplink.js';
```

### 3-2. loadAndConsumePendingReturnState を分割

`loadAndConsumePendingReturnState` を以下の2関数に分割する:

```js
function loadPendingReturnState() {
  const intent = readSessionJson(DEVLOG_RETURN_INTENT_KEY);
  if (!intent) return null;

  const state = readSessionJson(DEVLOG_RETURN_STATE_KEY);

  if (!state || !Number.isFinite(state.savedAt)) return null;
  if ((Date.now() - state.savedAt) > DEVLOG_RETURN_TTL_MS) return null;
  if (!Number.isFinite(state.pageScrollY)) return null;
  if (intent.sessionId && state.sessionId && intent.sessionId !== state.sessionId) return null;

  return state;
}

function consumeReturnState() {
  removeSessionKey(DEVLOG_RETURN_INTENT_KEY);
  removeSessionKey(DEVLOG_RETURN_STATE_KEY);
}
```

旧 `loadAndConsumePendingReturnState` は削除する。

### 3-3. runPendingReturnFlow に consume コールバックを追加

`requestScroll` と `openOffcanvas` の apply 成功後に consume を呼ぶ:

```js
function runPendingReturnFlow(pendingState) {
  const start = () => {
    if (!isInitialized) {
      initDevlogGallery();
    }

    if (pendingState.offcanvasOpen) {
      devlogReadyPromise.then(() => {
        openOffcanvas({ restoreState: pendingState });
        consumeReturnState();  // apply 成功後に consume
      });
      return;
    }

    requestScroll(pendingState.pageScrollY, 'devlog-return:page', {
      waitFor: Promise.all([devlogReadyPromise, waitForArticlesReady()]),
      behavior: 'auto',
      priority: SCROLL_PRIORITY.RETURN_RESTORE,
    });
    // scroll request が受理された時点で consume
    consumeReturnState();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
```

### 3-4. applyDevlogDeepLinkIntent に priority 追加

`requestScrollToElement` の呼び出しに priority を渡す。ファイル内の `requestScrollToElement` 定義を変更:

```js
function requestScrollToElement(el, source, priority = SCROLL_PRIORITY.DEFAULT) {
  if (!el) return;
  const targetY = window.scrollY + el.getBoundingClientRect().top - 24;
  requestScroll(targetY, source, { behavior: 'auto', priority });
}
```

`applyDevlogDeepLinkIntent` 内の呼び出しを変更:

```js
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
```

### 3-5. bootstrap 分岐（ファイル末尾）を書き換え

旧コード（`if (typeof window !== 'undefined')` ブロックの中身すべて）を以下に置換:

```js
if (typeof window !== 'undefined') {
  const urlHasIntent = hasDeepLinkIntent();
  const requestedScrollTarget = getRequestedScrollTarget();
  const wantsDevlogIntent = shouldOpenOffcanvas('devlog')
    || requestedScrollTarget === 'devlog-heading'
    || requestedScrollTarget === 'devlog-readmore';

  if (urlHasIntent) {
    // URL優先: return state は無視（読まない）
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
    }
    // URL intent はあるが devlog 向けでない場合 → devlog は lazy init
    // （articles-section.js 側が commit する）
    else {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeGallerySection, { once: true });
      } else {
        observeGallerySection();
      }
    }
  } else {
    // URL intent なし → return state を試行
    const pendingState = loadPendingReturnState();
    if (pendingState) {
      runPendingReturnFlow(pendingState);
      // commit は runPendingReturnFlow 内の requestScroll/openOffcanvas 後に
      // auto-commit で拾われる
    } else {
      // 通常: lazy init
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeGallerySection, { once: true });
      } else {
        observeGallerySection();
      }
    }
  }
}
```

---

## 4. `src/pages/articles-section.js` — priority 追加

### 4-1. import 変更

```js
import { getRequestedScrollTarget, shouldOpenOffcanvas, hasDeepLinkIntent } from '../offcanvas-deeplink.js';
import { requestScroll, SCROLL_PRIORITY, commitNavigationIntent } from '../scroll-coordinator.js';
```

### 4-2. requestScrollToElement に priority 引数追加

```js
function requestScrollToElement(el, source, priority = SCROLL_PRIORITY.DEFAULT) {
    if (!el) return;
    const targetY = window.scrollY + el.getBoundingClientRect().top - 24;
    requestScroll(targetY, source, { behavior: 'auto', priority });
}
```

### 4-3. applyArticlesDeepLinkIntent に priority 追加 + commit

```js
function applyArticlesDeepLinkIntent() {
    if (hasAppliedArticlesDeepLink) return;
    hasAppliedArticlesDeepLink = true;

    const targetEl = findArticlesScrollTargetElement();
    if (targetEl) {
        requestScrollToElement(targetEl, 'deeplink:articles', SCROLL_PRIORITY.DEEP_LINK);
    }

    if (shouldOpenOffcanvas('articles')) {
        waitForTwoAnimationFrames().then(() => {
            openArticlesOffcanvasFromDeepLink();
        });
    }

    commitNavigationIntent('articles:deeplink');
}
```

---

## 5. `index.html` — 変更なし

`initScrollCoordinator()` の呼び出しは現行のまま。
auto-commit 機構が scroll-coordinator.js 内に組み込まれるため、HTML側の変更は不要。

---

## 6. `devlog.html` — 変更なし

return intent の sessionStorage 書き込みは現行フローのまま問題なし。
consume が index.html 側で apply 成功後に行われるため、二重化は発生しない。

---

## 検証チェックリスト

実装完了後、以下をすべて確認:

- [ ] `index.html` パラメータなし → 先頭表示
- [ ] `devlog.html?id=xxx` → 「一覧に戻る」 → offcanvas + scroll 位置が復元される
- [ ] `index.html?open=articles` → articles offcanvas が開く
- [ ] `index.html?scroll=devlog-readmore` → devlog Read More 位置にスクロール
- [ ] `index.html#articles-section` → articles heading にスクロール
- [ ] URL指定 + return state が sessionStorage に同時存在 → URL が勝つ
- [ ] ブラウザ戻る → bfcache 復帰時にスクロール位置が壊れない
- [ ] 別タブで index.html を開く → return state が他タブに影響しない
- [ ] `console.log` で `[scroll] commitNavigationIntent: ... winner=` が表示される

---

## 注意事項

- `requestScroll` の第3引数 `options` に `priority` を追加する形なので、既存の呼び出し（priority 未指定）は `SCROLL_PRIORITY.DEFAULT = 1` として動作し、後方互換を維持する。
- `commitNavigationIntent` は複数回呼ばれても初回のみ有効（`initPhase` が false になった後は no-op）。
- auto-commit のタイミング（DOMContentLoaded + 2 rAF）は、modules の非同期 init が完了する十分な猶予。ただし sessions.json の fetch が遅い場合は devlog.js 側の `devlogReadyPromise.then(() => commit)` が先に走る設計。
