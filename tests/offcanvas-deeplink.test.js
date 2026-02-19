/**
 * offcanvas-deeplink.test.js
 *
 * Deep link 意図解釈の回帰テスト。
 * 実行:
 *   node tests/offcanvas-deeplink.test.js
 */

import {
  getDeepLinkIntent,
  getRequestedScrollTarget,
  shouldOpenOffcanvas,
  hasDeepLinkIntent,
} from '../src/offcanvas-deeplink.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed += 1;
    return;
  }
  failed += 1;
  failures.push(message);
  console.error(`  ✗ ${message}`);
}

function section(name) {
  console.log(`\n── ${name} ──`);
}

function withLocation({ search = '', hash = '' }, fn) {
  const previousWindow = globalThis.window;
  const mockWindow = {
    location: {
      search,
      hash,
    },
  };

  globalThis.window = mockWindow;
  try {
    return fn();
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
  }
}

function resetIntentCache() {
  if (typeof window !== 'undefined') {
    delete window.__kessonDeepLinkIntent;
  }
}

section('1. open parameter parsing');

withLocation({ search: '?open=devlog' }, () => {
  resetIntentCache();
  const intent = getDeepLinkIntent();
  assert(intent.openPanel === 'devlog', 'open=devlog -> devlog panel');
  assert(intent.scrollTarget === 'devlog-readmore', 'open=devlog -> default devlog-readmore target');
  assert(shouldOpenOffcanvas('devlog') === true, 'shouldOpenOffcanvas(devlog) is true');
  assert(hasDeepLinkIntent() === true, 'hasDeepLinkIntent true when open is specified');
});

withLocation({ search: '?open=articles' }, () => {
  resetIntentCache();
  const intent = getDeepLinkIntent();
  assert(intent.openPanel === 'articles', 'open=articles -> articles panel');
  assert(intent.scrollTarget === 'articles-readmore', 'open=articles -> default articles-readmore');
});

section('2. explicit scroll parameter parsing');

withLocation({ search: '?open=devlog&scroll=devlog-heading' }, () => {
  resetIntentCache();
  const intent = getDeepLinkIntent();
  assert(intent.openPanel === 'devlog', 'open remains devlog when scroll is explicit');
  assert(intent.scrollTarget === 'devlog-heading', 'explicit scroll overrides default readmore target');
});

withLocation({ search: '?scroll=articles-heading' }, () => {
  resetIntentCache();
  const intent = getDeepLinkIntent();
  assert(intent.openPanel === null, 'scroll only does not force open panel');
  assert(getRequestedScrollTarget() === 'articles-heading', 'getRequestedScrollTarget returns parsed scroll target');
  assert(hasDeepLinkIntent() === true, 'scroll-only link still counts as deep-link intent');
});

section('3. hash behavior');

withLocation({ hash: '#devlog' }, () => {
  resetIntentCache();
  const intent = getDeepLinkIntent();
  assert(intent.openPanel === null, 'hash does not open offcanvas panel');
  assert(intent.scrollTarget === 'devlog-heading', 'hash token maps to scroll target only');
});

withLocation({ hash: '#devlogoffcanvas' }, () => {
  resetIntentCache();
  const intent = getDeepLinkIntent();
  assert(intent.openPanel === null, 'hash token never opens offcanvas');
  assert(intent.scrollTarget === null, 'unknown hash token -> no scroll target');
  assert(hasDeepLinkIntent() === false, 'no recognized token -> no deep-link intent');
});

section('4. token normalization and cache behavior');

withLocation({ search: '?open= DEVLOGS , ignored-token ' }, () => {
  resetIntentCache();
  const first = getDeepLinkIntent();
  assert(first.openPanel === 'devlog', 'comma-separated and case-insensitive open tokens are normalized');

  // キャッシュされた値が返ることを確認
  window.location.search = '?open=articles';
  const cached = getDeepLinkIntent();
  assert(cached.openPanel === 'devlog', 'intent is cached per page lifecycle until cache reset');

  resetIntentCache();
  const refreshed = getDeepLinkIntent();
  assert(refreshed.openPanel === 'articles', 'cache reset re-parses latest location');
});

console.log('\n══════════════════════════════');
console.log(`結果: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\n失敗一覧:');
  failures.forEach((message, index) => {
    console.log(`  ${index + 1}. ${message}`);
  });
}
console.log('══════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
