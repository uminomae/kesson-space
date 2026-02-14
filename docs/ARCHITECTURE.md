# ARCHITECTURE - 技術構成

**バージョン**: 1.1
**更新日**: 2026-02-15

---

## ファイル構成

```
kesson-space/
├── README.md
├── index.html                ← メインHTML
├── serve.sh                  ← ローカルサーバー起動
│
├── src/
│   ├── main.js               ← エントリポイント（初期化・アニメーションループ）
│   ├── scene.js              ← シーン構築・更新オーケストレーション
│   ├── config.js             ← ★ 設定値・定数の唯一の信頼源 (Single Source of Truth)
│   ├── controls.js           ← カメラ・マウス・インタラクション
│   ├── mouse-state.js        ← マウス/タッチ状態の一元管理
│   ├── scroll-ui.js          ← スクロールUI（浮上ボタン等）
│   ├── navigation.js         ← ナビゲーション統合（イベント処理）
│   ├── nav-objects.js        ← 3Dナビオブジェクト（鬼火オーブ + HTMLラベル）
│   ├── viewer.js             ← PDFフロートビューアー（CSS + DOM）
│   ├── i18n.js               ← 言語切替（?lang=en / ?lang=ja）
│   ├── lang-toggle.js        ← 言語トグルUI
│   ├── dev-panel.js          ← 開発用パラメータ調整パネル
│   └── shaders/
│       ├── noise.glsl.js     ← 共有simplex noise GLSL
│       ├── background.js     ← 背景グラデーションシェーダー
│       ├── water.js          ← 水面シェーダー（FBM波、フレネル反射）
│       ├── kesson.js         ← 光（欠損）シェーダー（2スタイル補間）
│       ├── distortion-pass.js ← ポストプロセス（屈折・ハロー・熱波・DOF）
│       ├── fluid-field.js    ← ピンポンバッファ流体フィールド
│       └── vortex.js         ← 渦シェーダー（現在OFF）
│
├── skills/                   ← マルチエージェント運用スキル（AGENT-RULES.md参照）
│   ├── shared-quality.md
│   ├── shader-impl.md
│   ├── review-gates.md
│   ├── orchestrator.md
│   └── LEARNINGS.md
│
├── context-pack/             ← タスク定義テンプレート
│   └── SINGLE.md.template
│
├── tests/
│   ├── config-consistency.test.js  ← 設定値整合性テスト（CI自動）
│   ├── e2e-test-design.md          ← E2E設計書
│   └── e2e-runner.js               ← ブラウザ内E2Eランナー
│
├── mcp_servers/              ← Claude Desktop用MCPサーバー
│   ├── gemini_threejs.py
│   └── README.md
│
├── scripts/
│   └── setup-mcp.sh
│
├── .github/workflows/
│   └── test.yml              ← CI定義
│
└── docs/
    ├── README.md             ← ドキュメントハブ（目次）
    ├── CURRENT.md            ← 進捗・引き継ぎ
    ├── TODO.md               ← タスクバックログ
    ├── WORKFLOW.md           ← セッション運用
    ├── AGENT-RULES.md        ← エージェント分業
    ├── ARCHITECTURE.md       ← 本ファイル（技術構成）
    ├── ENVIRONMENT.md        ← 開発環境（MCP/Codex/Worktree）
    ├── TESTING.md            ← テスト体制
    ├── CONCEPT.md            ← 理論↔視覚
    ├── issues/               ← 大規模タスク設計書
    └── prompts/              ← Gemini向けプロンプト履歴
```

---

## モジュール依存関係

```
main.js
├── scene.js
│   ├── config.js（sceneParams, 色定数, フォグ定数）
│   ├── shaders/background.js
│   │   └── config.js（BG_*定数）
│   ├── shaders/water.js
│   │   └── shaders/noise.glsl.js
│   └── shaders/kesson.js
│       ├── shaders/noise.glsl.js
│       └── config.js（sceneParams, WARM/COOL_COLORS）
├── shaders/distortion-pass.js
│   └── config.js（distortionParams, fluidParams）
├── shaders/fluid-field.js
│   └── config.js（fluidParams）
├── controls.js
│   └── config.js（toggles, breathConfig）
├── mouse-state.js
├── scroll-ui.js
├── i18n.js
├── lang-toggle.js
│   └── i18n.js
├── navigation.js
│   ├── viewer.js（CSS + DOM + open/close）
│   └── nav-objects.js（3Dオーブ生成 + HTMLラベル）
└── dev-panel.js（?dev 時のみ動的import）
    └── config.js（全パラメータオブジェクト）
```

---

## 設計原則

- **config.js が唯一の信頼源 (Single Source of Truth)**: 全デフォルト値はconfig.jsで定義
- **各ファイルは1つの責務**: シェーダー、UI、イベント、設定を明確に分離
- **scene.js は薄いオーケストレーション**: 個別シェーダーの実装は shaders/ に委譲
- **navigation.js はイベント統合**: 3Dオブジェクト生成とビューアーUIは分離
- **init/destroy パターン**: 各モジュールはクリーンアップ関数をエクスポート

---

## 技術スタック

### コア

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Three.js | 0.160.0 | 3D描画（CDN importmap） |
| ES Modules | — | ビルドツールなし |
| GLSL | — | シェーダー（文字列埋め込み） |

### UI/スタイル

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Bootstrap | 5.3.3 | devパネル用（CDN、?dev時のみロード） |
| Noto Serif JP | — | 日本語フォント（Google Fonts） |
| Yu Mincho / MS PMincho | — | フォールバック |

### インフラ

| 項目 | 値 |
|------|-----|
| ホスティング | GitHub Pages（mainブランチ直接） |
| ローカルポート | 3001（pjdhiroの4000と干渉回避） |
| CI | GitHub Actions |

### パフォーマンス設定

| 項目 | 値 |
|------|-----|
| 流体フィールド解像度 | 128×128（FIELD_SIZE=128） |
| アクセシビリティ | WCAG 2.1 Level A準拠達成 |

---

## 品質管理

### テスト実行

```bash
node tests/config-consistency.test.js
```

設定値の整合性（config → shader → dev-panel）を自動検証。

詳細は [TESTING.md](./TESTING.md) を参照。

### パラメータ追加手順

1. `config.js` に値を追加
2. シェーダーで `import` して uniform に設定
3. `dev-panel.js` で `default: configObj.xxx` で参照
4. `main.js` の `applyDevValue()` にスライダー反映ロジック追加
5. テスト実行で整合性確認

---

## DEV_MODEの切り替え

URLに `?dev` パラメータを付けるとdevパネルが表示される:

```
http://localhost:3001/?dev      ← devパネル表示
http://localhost:3001/          ← 通常表示
```

---

## MCP連携

### セットアップ

```bash
./scripts/setup-mcp.sh
cp .env.example .env
# .env に GEMINI_API_KEY を設定
uv sync
```

### MCPツール

| ツール | 用途 |
|--------|------|
| `generate_threejs_code` | Three.jsコード生成 |
| `generate_shader` | GLSLシェーダー生成 |
| `review_threejs_code` | コードレビュー |
| `compare_implementations` | Claude vs Gemini 比較 |

詳細は [ENVIRONMENT.md](./ENVIRONMENT.md) および [mcp_servers/README.md](../mcp_servers/README.md) を参照。

---

## 参照リンク

- [README.md](./README.md) — ドキュメントハブ
- [ENVIRONMENT.md](./ENVIRONMENT.md) — 開発環境
- [TESTING.md](./TESTING.md) — テスト体制
- [AGENT-RULES.md](./AGENT-RULES.md) — エージェント分業
