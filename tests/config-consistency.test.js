/**
 * config-consistency.test.js
 * 
 * kesson-space 設定値の整合性テスト
 * ブラウザ不要 — Node.js で実行可能
 * 
 * 実行: node tests/config-consistency.test.js
 * 
 * 検証項目:
 * 1. dev-panel の default 値が config オブジェクトと一致
 * 2. シェーダー uniform 初期値が config と一致
 * 3. i18n の ja/en キー構造一致
 * 4. 未使用ファイルが削除済み
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', 'src');

// --- ユーティリティ ---
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
    if (condition) {
        passed++;
    } else {
        failed++;
        failures.push(message);
        console.error(`  \u2717 ${message}`);
    }
}

function section(name) {
    console.log(`\n\u2500\u2500 ${name} \u2500\u2500`);
}

function readSrc(relPath) {
    return readFileSync(resolve(SRC, relPath), 'utf-8');
}

// ========================================
// Test 1: config.js のパラメータ抽出
// ========================================
section('1. config.js \u30d1\u30e9\u30e1\u30fc\u30bf\u89e3\u6790');

const configSrc = readSrc('config.js');

function extractObject(src, name) {
    const regex = new RegExp(`export\\s+const\\s+${name}\\s*=\\s*\\{([^}]+)\\}`, 's');
    const match = src.match(regex);
    if (!match) return null;
    const body = match[1];
    const result = {};
    const lines = body.split('\n');
    for (const line of lines) {
        const m = line.match(/^\s*(\w+)\s*:\s*([\d.+-]+)/);
        if (m) result[m[1]] = parseFloat(m[2]);
        const bm = line.match(/^\s*(\w+)\s*:\s*(true|false)/);
        if (bm) result[bm[1]] = bm[2] === 'true';
    }
    return result;
}

const sceneParams = extractObject(configSrc, 'sceneParams');
const fluidParams = extractObject(configSrc, 'fluidParams');
const distortionParams = extractObject(configSrc, 'distortionParams');
const toggles = extractObject(configSrc, 'toggles');
const breathConfig = extractObject(configSrc, 'breathConfig');

assert(sceneParams !== null, 'sceneParams \u304c config.js \u306b\u5b58\u5728\u3059\u308b');
assert(fluidParams !== null, 'fluidParams \u304c config.js \u306b\u5b58\u5728\u3059\u308b');
assert(distortionParams !== null, 'distortionParams \u304c config.js \u306b\u5b58\u5728\u3059\u308b');
assert(toggles !== null, 'toggles \u304c config.js \u306b\u5b58\u5728\u3059\u308b');
assert(breathConfig !== null, 'breathConfig \u304c config.js \u306b\u5b58\u5728\u3059\u308b');

console.log(`  sceneParams: ${Object.keys(sceneParams || {}).length} keys`);
console.log(`  fluidParams: ${Object.keys(fluidParams || {}).length} keys`);
console.log(`  distortionParams: ${Object.keys(distortionParams || {}).length} keys`);

// ========================================
// Test 2: dev-panel のdefaultがconfigを参照しているか
// ========================================
section('2. dev-panel default \u53c2\u7167\u30c1\u30a7\u30c3\u30af');

const devPanelSrc = readSrc('dev-panel.js');

const configRefs = [
    { pattern: /default:\s*fluidParams\.force/,    name: 'fluidForce \u2192 fluidParams.force' },
    { pattern: /default:\s*fluidParams\.curl/,     name: 'fluidCurl \u2192 fluidParams.curl' },
    { pattern: /default:\s*fluidParams\.decay/,    name: 'fluidDecay \u2192 fluidParams.decay' },
    { pattern: /default:\s*fluidParams\.radius/,   name: 'fluidRadius \u2192 fluidParams.radius' },
    { pattern: /default:\s*fluidParams\.influence/, name: 'fluidInfluence \u2192 fluidParams.influence' },
    { pattern: /default:\s*distortionParams\.strength/,  name: 'distStrength \u2192 distortionParams.strength' },
    { pattern: /default:\s*distortionParams\.aberration/, name: 'distAberration \u2192 distortionParams.aberration' },
    { pattern: /default:\s*distortionParams\.haloColorR/, name: 'haloColorR \u2192 distortionParams.haloColorR' },
    { pattern: /default:\s*sceneParams\.brightness/, name: 'brightness \u2192 sceneParams.brightness' },
    { pattern: /default:\s*sceneParams\.tintR/,     name: 'tintR \u2192 sceneParams.tintR' },
    { pattern: /default:\s*breathConfig\.period/,   name: 'period \u2192 breathConfig.period' },
];

for (const ref of configRefs) {
    assert(ref.pattern.test(devPanelSrc), `dev-panel: ${ref.name}`);
}

// ========================================
// Test 3: シェーダー uniform 参照チェック
// ========================================
section('3. \u30b7\u30a7\u30fc\u30c0\u30fc uniform \u53c2\u7167\u30c1\u30a7\u30c3\u30af');

const fluidFieldSrc = readSrc('shaders/fluid-field.js');
const distortionSrc = readSrc('shaders/distortion-pass.js');
const kessonSrc = readSrc('shaders/kesson.js');

// includes() ベース — 正規表現リテラル内の '/' エスケープ問題を回避
assert(fluidFieldSrc.includes('fluidParams') && fluidFieldSrc.includes("from '../config.js'"),
    'fluid-field.js \u304c fluidParams \u3092 import');

assert(distortionSrc.includes('distortionParams') && distortionSrc.includes("from '../config.js'"),
    'distortion-pass.js \u304c distortionParams \u3092 import');

assert(/uTintR.*value:\s*sceneParams\.tintR/.test(kessonSrc),
    'kesson.js: uTintR \u2192 sceneParams.tintR');
assert(/uTintG.*value:\s*sceneParams\.tintG/.test(kessonSrc),
    'kesson.js: uTintG \u2192 sceneParams.tintG');
assert(/uTintB.*value:\s*sceneParams\.tintB/.test(kessonSrc),
    'kesson.js: uTintB \u2192 sceneParams.tintB');

// ========================================
// Test 4: i18n キー構造一致
// ========================================
section('4. i18n \u69cb\u9020\u30c1\u30a7\u30c3\u30af');

const i18nSrc = readSrc('i18n.js');

const topKeys = ['title', 'subtitle', 'toggleLabel', 'taglines', 'credit', 'creditSignature', 'nav'];
for (const key of topKeys) {
    const jaHas = new RegExp(`ja:\\s*\\{[\\s\\S]*?${key}:`).test(i18nSrc);
    const enHas = new RegExp(`en:\\s*\\{[\\s\\S]*?${key}:`).test(i18nSrc);
    assert(jaHas && enHas, `i18n: ja/en \u4e21\u65b9\u306b '${key}' \u304c\u5b58\u5728`);
}

// ========================================
// Test 5: 未使用ファイルチェック
// ========================================
section('5. \u30d5\u30a1\u30a4\u30eb\u53c2\u7167\u30c1\u30a7\u30c3\u30af');

const versionsDir = resolve(SRC, 'versions');
if (existsSync(versionsDir)) {
    console.warn('  \u26a0 src/versions/ \u304c\u6b8b\u5b58\uff08\u524a\u9664\u63a8\u5968\uff09');
} else {
    passed++;
}

// ========================================
// 結果サマリー
// ========================================
console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
console.log(`\u7d50\u679c: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
    console.log('\n\u5931\u6557\u4e00\u89a7:');
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
}
console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n');

process.exit(failed > 0 ? 1 : 0);
