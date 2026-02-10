# ARCHITECTURE - 技術構成

## ファイル構成

```
kesson-space/
├── README.md                 ← エントリーポイント
├── index.html                ← メインHTML
├── serve.sh                  ← ローカルサーバー起動
│
├── docs/                     ← ドキュメント
│   ├── CURRENT.md            ← 進捗・TODO（毎セッション更新）
│   ├── CONCEPT.md            ← 理論・ビジュアル対応
│   ├── ARCHITECTURE.md       ← 技術構成（本ファイル）
│   └── WORKFLOW.md           ← セッション管理手順
│
├── src/                      ← ソースコード
│   └── main.js               ← Three.jsメインコード
│
├── data/                     ← コンテンツデータ（将来）
│   └── kesson/               ← 欠損データ（YAML）
│
├── assets/                   ← 静的アセット（将来）
│   ├── images/
│   ├── fonts/
│   └── audio/
│
└── styles/                   ← CSS（将来分離時）
```

---

## 技術スタック

| 領域 | 選択 | 理由 |
|------|------|------|
| ホスティング | GitHub Pages | 無料、Git連携 |
| 3D | Three.js 0.160.0 | 標準的、CDN利用可 |
| モジュール | ES Modules (importmap) | ビルド不要 |
| データ | YAML (予定) | 人間が読みやすい |
| CSS | インライン → 将来分離 | 初期はシンプルに |

---

## 技術決定ログ

### 2026-02-11: ビルドツール不使用

**決定**: Vite/Webpack等を使わず、ES Modules + CDNで構成

**理由**:
- シンプルさ優先
- GitHub Pagesで直接動作
- 依存関係を最小化

**トレードオフ**:
- npm packageは直接使えない
- 本番最適化なし（許容範囲）

---

### 2026-02-11: ポート3001

**決定**: ローカルサーバーは3001番

**理由**: pjdhiro (Jekyll) が4000番、VSCode Live Serverが3000番を使用

---

## コード分割方針（将来）

現在は `src/main.js` に全て集約。規模が大きくなったら：

| ファイル | 責務 |
|---------|------|
| main.js | 初期化・エントリーポイント |
| scene/water.js | 水面シェーダー |
| scene/kesson.js | 欠損（光）の生成・管理 |
| scene/particles.js | 微細粒子 |
| shaders/noise.glsl | ノイズ関数（現在はmain.js内に埋め込み） |
| utils/interaction.js | Raycaster・マウスイベント |

---

## 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル | kebab-case | kesson-data.yaml |
| JS変数 | camelCase | kessonMeshes |
| CSS class | kebab-case | canvas-container |
| 定数 | UPPER_SNAKE | PARTICLE_COUNT |

---

## 参照

- [CURRENT.md](./CURRENT.md) - 進捗
- [CONCEPT.md](./CONCEPT.md) - 理論
- [WORKFLOW.md](./WORKFLOW.md) - セッション管理
