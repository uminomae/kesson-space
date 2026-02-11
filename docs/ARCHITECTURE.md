# ARCHITECTURE - 技術構成

## ファイル構成

```
kesson-space/
├── README.md
├── index.html                ← メインHTML
├── serve.sh                  ← ローカルサーバー起動
│
├── src/
│   ├── main.js               ← エントリポイント（初期化・アニメーションループ）
│   ├── scene.js              ← グラフィック（Geminiが反復するファイル）
│   ├── controls.js           ← カメラ・マウス・インタラクション
│   ├── navigation.js         ← リンク・ページ遷移・クリックイベント
│   └── versions/             ← scene.js のバージョン履歴
│       ├── v001-baseline.js
│       ├── v002-gemini-fractal.js
│       ├── ...
│       └── LOG.md
│
├── docs/
│   ├── CURRENT.md
│   ├── CONCEPT.md
│   ├── ARCHITECTURE.md       ← 本ファイル
│   ├── WORKFLOW.md
│   ├── PROMPT-STRUCTURE.md
│   └── prompts/
│
├── data/                     ← コンテンツデータ（将来）
│   └── kesson/               ← 欠損データ（YAML）
│
└── assets/                   ← 静的アセット（将来）
```

---

## モジュール分割設計

### 原則

| 分離の理由 | 説明 |
|------------|------|
| **Gemini反復の独立性** | scene.jsだけを差し替えてビジュアル調整できる |
| **インタラクションの独立性** | グラフィックを触らずにカメラやリンクを追加できる |
| **データの独立性** | 将来YAMLデータを差し替えて内容を変えられる |

### モジュール図

```
main.js (エントリポイント)
  │
  ├─ import { createScene, updateScene } from './scene.js'
  ├─ import { initControls, updateControls } from './controls.js'
  └─ import { initNavigation } from './navigation.js'
  
  ┌────────────────────────────┐
  │  animate loop (main.jsが所有)  │
  │                              │
  │  updateScene(time)           │ ← scene.js
  │  updateControls(time)        │ ← controls.js
  │  renderer.render()           │
  └────────────────────────────┘
```

### 各モジュールの責務

| ファイル | 責務 | エクスポート | 変更頻度 |
|---------|------|------------|----------|
| **main.js** | 初期化、アニメーションループ、リサイズ | — | 低（安定） |
| **scene.js** | シェーダー、マテリアル、メッシュ生成、背景、水面、粒子 | createScene(), updateScene(time) | 高（Gemini反復） |
| **controls.js** | カメラ移動、マウス視差、ズーム、モバイルタッチ | initControls(camera, container), updateControls(time) | 中 |
| **navigation.js** | クリック検出、リンク先解決、ページ遷移・モーダル | initNavigation(camera, kessonMeshes) | 中 |

---

## scene.js のインターフェース

Geminiが出力する形式。このインターフェースさえ守れば、内部は自由に変更できる。

```javascript
// scene.js が export すべきもの

export function createScene(container) {
  // scene, camera, renderer, メッシュ等を作成
  return {
    scene,           // THREE.Scene
    camera,          // THREE.PerspectiveCamera
    renderer,        // THREE.WebGLRenderer
    kessonMeshes,    // Array<THREE.Mesh> — クリック対象
  };
}

export function updateScene(time) {
  // 毎フレームの更新（シェーダーuniform、メッシュ位置、粒子等）
}
```

---

## controls.js のインターフェース

```javascript
export function initControls(camera, container) {
  // マウス・タッチイベント登録
  // カメラ制御の初期化
}

export function updateControls(time) {
  // カメラ位置・視点の毎フレーム更新
  // マウス視差、浮遊感
}
```

---

## navigation.js のインターフェース

```javascript
export function initNavigation(camera, kessonMeshes) {
  // Raycasterセットアップ
  // クリックイベント登録
  // kesson ID → URL/アクションのマッピング
}

// 将来: data/kesson/*.yaml からリンク先を読み込む
```

---

## Geminiワークフローへの影響

**変更点**: Geminiは `main.js` ではなく `scene.js` を出力する

| Before | After |
|--------|-------|
| Geminiがmain.js全文を出力 | Geminiがscene.jsを出力 |
| versions/にmain.jsを保存 | versions/にscene.jsを保存 |
| Output Rules: main.js | Output Rules: scene.js + exportインターフェース |

---

## 技術スタック

| 領域 | 選択 | 理由 |
|------|------|------|
| ホスティング | GitHub Pages | 無料、Git連携 |
| 3D | Three.js 0.160.0 | 標準的、CDN利用可 |
| モジュール | ES Modules (importmap) | ビルド不要 |
| データ | YAML (予定) | 人間が読みやすい |

---

## 技術決定ログ

### 2026-02-11: ビルドツール不使用

**決定**: Vite/Webpack等を使わず、ES Modules + CDNで構成
**理由**: シンプルさ優先、GitHub Pagesで直接動作

### 2026-02-11: ポート3001

**決定**: ローカルサーバーは3001番
**理由**: pjdhiro (Jekyll) が4000番、VSCode Live Serverが3000番を使用

### 2026-02-11: モジュール分割

**決定**: main.jsを scene.js / controls.js / navigation.js に分割
**理由**:
- Gemini反復（グラフィック）とインタラクション開発を独立させる
- リンク・カメラ制御をグラフィックに影響せず追加可能に
**トレードオフ**: Geminiの出力形式をexport付きに変更が必要

---

## 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル | kebab-case | kesson-data.yaml |
| JS変数 | camelCase | kessonMeshes |
| CSS class | kebab-case | canvas-container |
| 定数 | UPPER_SNAKE | PARTICLE_COUNT |
| export関数 | camelCase | createScene, updateScene |

---

## 参照

- [CURRENT.md](./CURRENT.md) - 進捗
- [CONCEPT.md](./CONCEPT.md) - 理論
- [WORKFLOW.md](./WORKFLOW.md) - セッション管理
- [PROMPT-STRUCTURE.md](./PROMPT-STRUCTURE.md) - プロンプトテンプレート
