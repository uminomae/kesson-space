/**
 * config-consistency.test.js
 *
 * kesson-space 設定値の整合性テスト
 * ブラウザ不要 — Node.js で実行可能
 *
 * 実行: node tests/config-consistency.test.js
 *
 * 検証項目:
 * 1. config 分割モジュールの存在と主要オブジェクト定義
 * 2. dev-ui default 値が config パラメータ参照を維持していること
 * 3. dev-registry の構造整合（toggle重複なし含む）
 * 4. i18n の ja/en キー構造一致
 * 5. 不要ファイルが残っていないこと
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');
const CONFIG_DIR = resolve(SRC, 'config');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
    if (condition) {
        passed++;
    } else {
        failed++;
        failures.push(message);
        console.error(`  ✗ ${message}`);
    }
}

function section(name) {
    console.log(`\n── ${name} ──`);
}

function read(path) {
    return readFileSync(path, 'utf-8');
}

function extractObject(src, name) {
    const regex = new RegExp(`export\\s+const\\s+${name}\\s*=\\s*\\{([^}]+)\\}`, 's');
    const match = src.match(regex);
    if (!match) return null;

    const body = match[1];
    const result = {};
    const lines = body.split('\n');

    for (const line of lines) {
        const num = line.match(/^\s*(\w+)\s*:\s*([\d.+-]+)/);
        if (num) result[num[1]] = Number.parseFloat(num[2]);

        const bool = line.match(/^\s*(\w+)\s*:\s*(true|false)/);
        if (bool) result[bool[1]] = bool[2] === 'true';
    }

    return result;
}

section('1. config 分割モジュール確認');

const configEntryPath = resolve(SRC, 'config.js');
const configIndexPath = resolve(CONFIG_DIR, 'index.js');
const paramsPath = resolve(CONFIG_DIR, 'params.js');
const devUiPath = resolve(CONFIG_DIR, 'dev-ui.js');
const devRegistryPath = resolve(CONFIG_DIR, 'dev-registry.js');

assert(existsSync(configEntryPath), 'src/config.js が存在する');
assert(existsSync(configIndexPath), 'src/config/index.js が存在する');
assert(existsSync(paramsPath), 'src/config/params.js が存在する');
assert(existsSync(devUiPath), 'src/config/dev-ui.js が存在する');
assert(existsSync(devRegistryPath), 'src/config/dev-registry.js が存在する');

const configEntrySrc = read(configEntryPath);
const paramsSrc = read(paramsPath);
const devUiSrc = read(devUiPath);
const devRegistrySrc = read(devRegistryPath);

assert(/export\s+\*\s+from\s+'\.\/config\/index\.js'/.test(configEntrySrc),
    'src/config.js が config/index.js を再エクスポートしている');

const sceneParams = extractObject(paramsSrc, 'sceneParams');
const fluidParams = extractObject(paramsSrc, 'fluidParams');
const distortionParams = extractObject(paramsSrc, 'distortionParams');
const toggles = extractObject(paramsSrc, 'toggles');
const breathConfig = extractObject(paramsSrc, 'breathConfig');

assert(sceneParams !== null, 'sceneParams が params.js に存在する');
assert(fluidParams !== null, 'fluidParams が params.js に存在する');
assert(distortionParams !== null, 'distortionParams が params.js に存在する');
assert(toggles !== null, 'toggles が params.js に存在する');
assert(breathConfig !== null, 'breathConfig が params.js に存在する');

console.log(`  sceneParams: ${Object.keys(sceneParams || {}).length} keys`);
console.log(`  fluidParams: ${Object.keys(fluidParams || {}).length} keys`);
console.log(`  distortionParams: ${Object.keys(distortionParams || {}).length} keys`);

section('2. dev-ui default 参照チェック');

const configRefs = [
    { pattern: /default:\s*fluidParams\.force/, name: 'fluidForce → fluidParams.force' },
    { pattern: /default:\s*fluidParams\.curl/, name: 'fluidCurl → fluidParams.curl' },
    { pattern: /default:\s*fluidParams\.decay/, name: 'fluidDecay → fluidParams.decay' },
    { pattern: /default:\s*fluidParams\.radius/, name: 'fluidRadius → fluidParams.radius' },
    { pattern: /default:\s*fluidParams\.influence/, name: 'fluidInfluence → fluidParams.influence' },
    { pattern: /default:\s*distortionParams\.strength/, name: 'distStrength → distortionParams.strength' },
    { pattern: /default:\s*distortionParams\.aberration/, name: 'distAberration → distortionParams.aberration' },
    { pattern: /default:\s*distortionParams\.haloColorR/, name: 'haloColorR → distortionParams.haloColorR' },
    { pattern: /default:\s*sceneParams\.brightness/, name: 'brightness → sceneParams.brightness' },
    { pattern: /default:\s*sceneParams\.tintR/, name: 'tintR → sceneParams.tintR' },
    { pattern: /default:\s*breathConfig\.period/, name: 'period → breathConfig.period' },
];

for (const ref of configRefs) {
    assert(ref.pattern.test(devUiSrc), `dev-ui: ${ref.name}`);
}

section('3. dev-registry / toggle 構造チェック');

assert(/export\s+const\s+DEV_TOGGLES\s*=\s*\[/.test(devUiSrc), 'DEV_TOGGLES が定義されている');
assert(/export\s+const\s+DEV_SECTIONS\s*=\s*\[/.test(devUiSrc), 'DEV_SECTIONS が定義されている');
assert(/export\s+const\s+DEV_PARAM_REGISTRY/.test(devRegistrySrc), 'DEV_PARAM_REGISTRY が定義されている');
assert(/registry\[toggle\.key\]/.test(devRegistrySrc), 'toggle エントリが registry に反映される');
assert(/DEV_SECTIONS\.forEach/.test(devRegistrySrc), 'DEV_SECTIONS を元に registry を構築している');

const toggleKeyMatches = [...devUiSrc.matchAll(/\{\s*key:\s*'([^']+)'/g)].map((m) => m[1]);
const toggleKeySet = new Set(toggleKeyMatches);
assert(toggleKeyMatches.length === toggleKeySet.size, 'DEV_TOGGLES の key が重複していない');

section('4. i18n 構造チェック');

const i18nSrc = read(resolve(SRC, 'i18n.js'));
const topKeys = ['title', 'subtitle', 'toggleLabel', 'taglines', 'credit', 'creditSignature', 'nav', 'gem', 'xLogo'];

for (const key of topKeys) {
    const jaHas = new RegExp(`ja:\\s*\\{[\\s\\S]*?${key}:`).test(i18nSrc);
    const enHas = new RegExp(`en:\\s*\\{[\\s\\S]*?${key}:`).test(i18nSrc);
    assert(jaHas && enHas, `i18n: ja/en 両方に '${key}' が存在`);
}

section('5. 不要ファイルチェック');

assert(!existsSync(resolve(SRC, 'versions')), 'src/versions/ が存在しない');
assert(!existsSync(resolve(SRC, 'dom-utils.js')), '未使用の src/dom-utils.js が削除済み');

console.log('\n══════════════════════════════');
console.log(`結果: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
    console.log('\n失敗一覧:');
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
}
console.log('══════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
