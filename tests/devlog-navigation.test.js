/**
 * devlog-navigation.test.js
 *
 * Devlog 遷移に関わる純粋ロジックの回帰テスト。
 * 実行:
 *   node tests/devlog-navigation.test.js
 */

import { __DEVLOG_TEST_API__ as devlogApi } from '../src/devlog/devlog.js';

const {
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
} = devlogApi;

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

section('1. Language normalization / localized text');

assert(normalizeLang('en') === 'en', 'normalizeLang(en) -> en');
assert(normalizeLang('ja') === 'ja', 'normalizeLang(ja) -> ja');
assert(normalizeLang('fr') === 'ja', 'normalizeLang(unsupported) -> ja fallback');

const textSession = {
  id: 'session-001',
  title_ja: '基盤構築',
  title_en: 'Foundation',
  date_range: '2026-02-10',
};

assert(getSessionText(textSession, 'title', 'en') === 'Foundation', 'getSessionText prefers title_en');
assert(getSessionText(textSession, 'title', 'ja') === '基盤構築', 'getSessionText prefers title_ja');
assert(getSessionTitle(textSession, 'en') === 'Foundation', 'getSessionTitle(en)');
assert(getSessionDateRange(textSession, 'en') === '2026-02-10', 'getSessionDateRange fallback to date_range');

const objectBackedTextSession = {
  id: 'session-002',
  title: {
    en: 'Object EN',
    ja: 'Object JA',
  },
};
assert(
  getSessionText(objectBackedTextSession, 'title', 'en') === 'Object EN',
  'getSessionText supports object localized values'
);

section('2. Link generation');

assert(
  buildSessionHref('session-001', 'ja') === './devlog.html?id=session-001',
  'JA session link omits lang parameter'
);
assert(
  buildSessionHref('session-001', 'en') === './devlog.html?id=session-001&lang=en',
  'EN session link includes lang=en parameter'
);

section('3. Cover resolution');

const fullyLocalizedCoverSession = {
  id: 'session-003',
  cover_by_lang: {
    ja: './assets/devlog/covers/session-003.png',
    en: './assets/devlog/covers/session-003-en.svg',
  },
};
const enCover = resolveSessionCover(fullyLocalizedCoverSession, 'en');
assert(enCover.src.endsWith('session-003-en.svg'), 'EN cover uses cover_by_lang.en when available');
assert(enCover.localized === true, 'EN cover is marked localized=true when available');

const jaCover = resolveSessionCover(fullyLocalizedCoverSession, 'ja');
assert(jaCover.src.endsWith('session-003.png'), 'JA cover uses cover_by_lang.ja');
assert(jaCover.localized === true, 'JA cover is marked localized=true when available');

const fallbackCoverSession = {
  id: 'session-004',
  cover_by_lang: {
    ja: './assets/devlog/covers/session-004.png',
  },
  cover: './assets/devlog/covers/session-004.png',
};
const enFallbackCover = resolveSessionCover(fallbackCoverSession, 'en');
assert(
  enFallbackCover.src === DEVLOG_DEFAULT_COVER,
  'EN cover falls back to default cover when EN-specific cover is missing'
);
assert(
  enFallbackCover.localized === false,
  'EN fallback cover is marked localized=false'
);

section('4. Session ordering key');

assert(getSessionEndValue({ end: '2026-02-11T23:59:00+09:00' }) > 0, 'valid end date is parsed');
assert(getSessionEndValue({ end: 'not-a-date' }) === 0, 'invalid end date -> 0');
assert(getSessionEndValue({}) === 0, 'missing end/start -> 0');

section('5. Return-state eligibility');

const now = Date.now();
const validIntent = { requestedAt: now, sessionId: 'session-001' };
const validState = {
  savedAt: now - 10_000,
  pageScrollY: 240,
  sessionId: 'session-001',
};

assert(isReturnStateEligible(validIntent, validState, now), 'matching intent/state within TTL is eligible');
assert(
  !isReturnStateEligible(validIntent, { ...validState, savedAt: now - DEVLOG_RETURN_TTL_MS - 1 }, now),
  'stale return state beyond TTL is rejected'
);
assert(
  !isReturnStateEligible(validIntent, { ...validState, pageScrollY: NaN }, now),
  'invalid pageScrollY is rejected'
);
assert(
  !isReturnStateEligible(validIntent, { ...validState, sessionId: 'session-099' }, now),
  'sessionId mismatch between intent and state is rejected'
);
assert(
  !isReturnStateEligible(null, validState, now),
  'missing intent is rejected'
);
assert(
  isReturnStateEligible({ requestedAt: now }, { ...validState, sessionId: 'session-777' }, now),
  'state is accepted when intent has no sessionId'
);

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
