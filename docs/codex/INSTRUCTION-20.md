# 指示書: #20 パフォーマンスプロファイリング — stats.js 導入

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/20

## 作業ブランチ
- ベース: `dev`
- 作業: `feature/kesson-codex-app-statsjs20`

## 概要
DEV モード（`?dev` クエリパラメータ付き）でのみ stats.js によるFPS/MSパネルを表示する。
本番環境への影響はゼロとする。

## 実装手順

### Step 1: stats.js を CDN から動的 import する新モジュール作成

新規ファイル: `src/dev-stats.js`

```javascript
// dev-stats.js — DEV モード専用 FPS/MS モニター
// stats.js を CDN から動的ロードし、render loop に接続する

const STATS_CDN = 'https://cdn.jsdelivr.net/npm/stats.js@0.17.0/build/stats.min.js';

let _stats = null;

/**
 * stats.js を CDN script タグで読み込み、Stats インスタンスを生成する。
 * ?dev 時のみ呼ばれる想定。
 */
export async function initDevStats() {
    if (_stats) return _stats;

    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = STATS_CDN;
        script.onload = resolve;
        script.onerror = () => reject(new Error('stats.js load failed'));
        document.head.appendChild(script);
    });

    // stats.js はグローバルに Stats コンストラクタを公開する
    if (typeof Stats === 'undefined') {
        throw new Error('Stats constructor not found after script load');
    }

    _stats = new Stats();
    _stats.showPanel(0); // 0: FPS, 1: MS, 2: MB

    // DOM 配置: 左上、dev-panel と被らないよう調整
    _stats.dom.style.position = 'fixed';
    _stats.dom.style.top = '0px';
    _stats.dom.style.left = '0px';
    _stats.dom.style.zIndex = '10000';
    document.body.appendChild(_stats.dom);

    // クリックでパネル切替（FPS → MS → MB）
    _stats.dom.addEventListener('click', () => {
        const current = _stats.dom.querySelector('canvas')
            ? parseInt(_stats.dom.dataset.panel || '0', 10)
            : 0;
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
```

### Step 2: main.js に DEV モード時の初期化を追加

`src/main.js` の既存 DEV_MODE ブロックに追加する。

現在のコード:
```javascript
if (DEV_MODE) {
    import('./dev-panel.js').then(({ initDevPanel }) => {
        initDevPanel(applyDevValue);
    });
    import('./dev-links-panel.js').then(({ initDevLinksPanel }) => {
        initDevLinksPanel();
    });
}
```

変更後:
```javascript
if (DEV_MODE) {
    import('./dev-panel.js').then(({ initDevPanel }) => {
        initDevPanel(applyDevValue);
    });
    import('./dev-links-panel.js').then(({ initDevLinksPanel }) => {
        initDevLinksPanel();
    });
    import('./dev-stats.js').then(({ initDevStats }) => {
        initDevStats().catch((err) => {
            console.warn('[dev-stats] init failed:', err.message);
        });
    });
}
```

### Step 3: render-loop.js に stats.begin() / stats.end() を追加

`src/main/render-loop.js` を編集する。

**3a. import を追加** (ファイル先頭):
```javascript
import { statsBegin, statsEnd } from '../dev-stats.js';
```

**3b. animate() 関数内の先頭と末尾に呼び出しを追加**:

```javascript
function animate() {
    requestAnimationFrame(animate);
    statsBegin();  // ← 追加

    // ... 既存のコード全体 ...

    statsEnd();  // ← 追加（最終行、composer.render() / renderer.render() の後）
}
```

具体的には:
- `requestAnimationFrame(animate);` の直後に `statsBegin();` を挿入
- `animate()` 関数の閉じ括弧 `}` の直前に `statsEnd();` を挿入

注意: `statsBegin()` / `statsEnd()` は `_stats` が null のときは何もしないので、
DEV モードでなくても import 自体は安全。ただし tree-shaking の観点から
`import` は静的に行い、実際の `initDevStats()` は DEV_MODE 時のみ呼ぶ設計。

## 完了条件
1. `src/dev-stats.js` が新規作成されていること
2. `?dev` 付きでアクセスした場合のみ左上に FPS パネルが表示されること
3. `?dev` なしの通常アクセスでは stats.js の CDN リクエストが発生しないこと
4. render loop の begin/end が正しく配置されていること
5. コミットメッセージに `Fix #20` を含めること

## 禁止事項
- main ブランチへの直接 push 禁止
- dev への直接マージ禁止
- 対象外ファイルの変更禁止（`src/dev-stats.js`（新規）, `src/main.js`, `src/main/render-loop.js` のみ変更可）
- npm / package.json への依存追加禁止（CDN script タグのみ）
- index.html の importmap 変更禁止（script タグで動的ロードする方式を使う）
- 既存の animate() 関数のロジック変更禁止（begin/end の挿入のみ）
