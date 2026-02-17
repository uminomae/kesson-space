/**
 * config-exports.test.js
 *
 * config.js -> config/index.js -> 各モジュールの re-export チェーンを
 * 実行時に検証するテスト。
 *
 * 実行:
 *   node --experimental-vm-modules tests/config-exports.test.js
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');
const ENTRY_PATH = resolve(SRC, 'config.js');

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

section('1. 事前チェック');

assert(typeof vm.SourceTextModule === 'function', 'vm.SourceTextModule が利用可能である');
assert(existsSync(ENTRY_PATH), 'src/config.js が存在する');

const context = vm.createContext({});
const moduleCache = new Map();

const threeStubModule = new vm.SourceTextModule(
    `export class Color {
        constructor(value) {
            this.value = value;
        }
    }`,
    {
        context,
        identifier: 'three:stub',
    }
);

async function loadModuleFromFile(filePath) {
    const normalizedPath = resolve(filePath);
    if (moduleCache.has(normalizedPath)) {
        return moduleCache.get(normalizedPath);
    }

    const code = readFileSync(normalizedPath, 'utf-8');
    const module = new vm.SourceTextModule(code, {
        context,
        identifier: pathToFileURL(normalizedPath).href,
        initializeImportMeta(meta) {
            meta.url = pathToFileURL(normalizedPath).href;
        },
    });

    moduleCache.set(normalizedPath, module);
    await module.link(linker);
    return module;
}

async function linker(specifier, referencingModule) {
    if (specifier === 'three') {
        if (threeStubModule.status === 'unlinked') {
            await threeStubModule.link(() => {
                throw new Error('three stub has no dependencies');
            });
        }
        return threeStubModule;
    }

    if (!specifier.startsWith('.')) {
        throw new Error(`Unsupported bare specifier: ${specifier}`);
    }

    const parentPath = fileURLToPath(referencingModule.identifier);
    const resolvedPath = resolve(dirname(parentPath), specifier);
    return loadModuleFromFile(resolvedPath);
}

section('2. re-export チェーンの実行検証');

const entryModule = await loadModuleFromFile(ENTRY_PATH);
await threeStubModule.evaluate();
await entryModule.evaluate();

const namespace = entryModule.namespace;

const expectedExports = [
    'toggles',
    'breathConfig',
    'sceneParams',
    'fluidParams',
    'liquidParams',
    'distortionParams',
    'gemParams',
    'xLogoParams',
    'vortexParams',
    'DEV_TOGGLES',
    'DEV_SECTIONS',
    'DEV_PARAM_REGISTRY',
    'FOG_V002_COLOR',
    'FOG_V002_DENSITY',
    'FOG_V004_COLOR',
    'FOG_V004_DENSITY',
];

for (const exportName of expectedExports) {
    assert(exportName in namespace, `export '${exportName}' が存在する`);
    assert(namespace[exportName] !== undefined, `export '${exportName}' が undefined ではない`);
}

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
