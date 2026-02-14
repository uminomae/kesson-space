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
│   ├── scene.js              ← シーン構築・更新オーケストレーション
│   ├── config.js             ← ★ 設定値・定数の唯一の信頼源 (Single Source of Truth)
│   ├── controls.js           ← カメラ・マウス・インタラクション
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
│       └── fluid-field.js    ← ピンポンバッファ流体フィールド
│
├── skills/                   ← マルチエージェント運用スキル（AGENT-RULES.md参照）
│   ├── shared-quality.md     ← 全エージェント共通の品質基準
│   ├── shader-impl.md        ← Gemini用: Visual Direction、GLSL作法
│   ├── review-gates.md       ← GPT用: レビュー観点
│   ├── orchestrator.md       ← Claude用: 分解・委譲手順
│   └── LEARNINGS.md          ← 運用の教訓（手動更新）
│
├── context-pack/             ← タスク定義テンプレート（AGENT-RULES.md参照）
│   └── SINGLE.md.template    ← マイクロタスク用テンプレート
│
├── tests/
│   └── config-consistency.test.js  ← 設定値整合性テスト
│
├── mcp_servers/              ← Claude Desktop用MCPサーバー
│   ├── gemini_threejs.py     ← Gemini API連携
│   └── README.md
│
├── scripts/
│   └── setup-mcp.sh          ← MCP初期設定スクリプト
│
└── docs/
    ├── README.md             ← 管理ハブ
    ├── CURRENT.md
    ├── TODO.md
    ├── CONCEPT.md
    ├── ARCHITECTURE.md       ← 本ファイル
    ├── AGENT-RULES.md        ← マルチエージェント運用ルール
    ├── PROMPT-STRUCTURE.md   ← Gemini向けプロンプトテンプレート（AGENT-RULES下位）
    ├── REVIEW-REPORT.md      ← 品質レビュー報告書
    └── prompts/

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

- **config.js が唯一の信頼源 (Single Source of Truth)**: 全デフォルト値はconfig.jsで定義。シェーダーもdevパネルもconfigをimportして参照する
- **各ファイルは1つの責務**: シェーダー、UI、イベント、設定を明確に分離
- **scene.js は薄いオーケストレーション**: 個別シェーダーの実装は shaders/ に委譲
- **navigation.js はイベント統合**: 3Dオブジェクト生成とビューアーUIは分離

---

## 品質管理

### テスト実行

```bash
node tests/config-consistency.test.js
```

設定値の整合性（config → shader → dev-panel）を自動検証。
新しいパラメータ追加時はテストも更新すること。

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

## マルチエージェント分業体制

**詳細は [AGENT-RULES.md](./AGENT-RULES.md) を参照。**

### 概要

| 役割 | 担当 | 強み |
|------|------|------|
| **司令塔** | Claude | コンテキスト把握、複数ファイル管理、要件整理、config/HTML/CSS |
| **プログラマー** | Gemini | シェーダー実装、視覚品質、GLSL数学 |
| **レビュアー** | GPT | 俯瞰的構造改善、運用設計、セカンドオピニオン |

### 呼び出しルール

**外部エージェントはユーザーが明示した時のみ使用する。**

### スキルファイル（skills/）

| ファイル | 対象 | 内容 |
|---------|------|------|
| `shared-quality.md` | 全員 | 品質基準、禁止事項 |
| `shader-impl.md` | Gemini | GLSL作法、Visual Direction |
| `review-gates.md` | GPT | レビュー観点、評価基準 |
| `orchestrator.md` | Claude | 分解・委譲・統合手順 |
| `LEARNINGS.md` | 全員 | 運用の教訓（手動更新） |

### MCPツール

| ツール | 用途 |
|--------|------|
| `generate_threejs_code` | Three.jsコード生成 |
| `generate_shader` | GLSLシェーダー生成 |
| `review_threejs_code` | コードレビュー |
| `compare_implementations` | Claude vs Gemini 比較 |

### セットアップ

```bash
./scripts/setup-mcp.sh
cp .env.example .env
# .env に GEMINI_API_KEY を設定
uv sync
```

---

## 技術スタック

- Three.js 0.160.0（CDN importmap）
- Bootstrap 5.3.3（devパネル用、CDN）
- ES Modules（ビルドツールなし）
- シェーダー: simplex noise + FBM（GLSL文字列埋め込み）
- ポート: 3001（ローカル開発）
- デプロイ: GitHub Pages（mainブランチ直接）
