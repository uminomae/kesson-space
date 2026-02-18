// dev-stats.js — DEV モード専用 FPS/MS モニター
// stats.js を CDN から動的ロードし、render loop に接続する

const STATS_CDN = 'https://cdn.jsdelivr.net/npm/stats.js@0.17.0/build/stats.min.js';

let _stats = null;
let _scriptPromise = null;

function loadStatsScript() {
    if (_scriptPromise) return _scriptPromise;

    _scriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = STATS_CDN;
        script.onload = resolve;
        script.onerror = () => reject(new Error('stats.js load failed'));
        document.head.appendChild(script);
    });

    return _scriptPromise;
}

/**
 * stats.js を CDN script タグで読み込み、Stats インスタンスを生成する。
 * ?dev 時のみ呼ばれる想定。
 */
export async function initDevStats() {
    if (_stats) return _stats;

    await loadStatsScript();

    // stats.js はグローバルに Stats コンストラクタを公開する
    if (typeof window.Stats === 'undefined') {
        throw new Error('Stats constructor not found after script load');
    }

    _stats = new window.Stats();
    _stats.showPanel(0); // 0: FPS, 1: MS, 2: MB

    // DOM 配置: 左上、dev-panel と被らないよう調整
    _stats.dom.style.position = 'fixed';
    _stats.dom.style.top = '0px';
    _stats.dom.style.left = '0px';
    _stats.dom.style.zIndex = '10000';
    _stats.dom.dataset.panel = '0';
    document.body.appendChild(_stats.dom);

    // クリックでパネル切替（FPS → MS → MB）
    _stats.dom.addEventListener('click', () => {
        const current = parseInt(_stats.dom.dataset.panel || '0', 10);
        const next = (current + 1) % 3;
        _stats.showPanel(next);
        _stats.dom.dataset.panel = String(next);
    });

    return _stats;
}

/** render loop の先頭で呼ぶ */
export function statsBegin() {
    if (_stats) _stats.begin();
}

/** render loop の末尾で呼ぶ */
export function statsEnd() {
    if (_stats) _stats.end();
}
