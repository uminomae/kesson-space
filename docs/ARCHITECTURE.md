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
│   ├── config.js             ← 設定値・定数の一元管理
│   ├── controls.js           ← カメラ・マウス・インタラクション
│   ├── navigation.js         ← ナビゲーション統合（イベント処理）
│   ├── nav-objects.js        ← 3Dナビオブジェクト（鬼火オーブ + テキスト）
│   ├── viewer.js             ← PDFフロートビューアー（CSS + DOM）
│   ├── dev-panel.js          ← 開発用パラメータ調整パネル
│   ├── shaders/
│   │   ├── noise.glsl.js     ← 共有simplex noise GLSL
│   │   ├── background.js     ← 背景グラデーションシェーダー
│   │   ├── water.js          ← 水面シェーダー（FBM波、フレネル反射）
│   │   └── kesson.js         ← 光（欠損）シェーダー（2スタイル補間）
│   └── versions/             ← scene.js のバージョン履歴
│       ├── v001-baseline.js
│       ├── v002-gemini-fractal.js
│       ├── ...
│       └── LOG.md
│
├── mcp_servers/              ← Claude Desktop用MCPサーバー
│   ├── gemini_threejs.py     ← Gemini API連携
│   └── README.md
│
├── scripts/
│   └── setup-mcp.sh          ← MCP初期設定スクリプト
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
├── controls.js
├── navigation.js
│   ├── viewer.js（CSS + DOM + open/close）
│   └── nav-objects.js（3Dオーブ生成 + テキストスプライト）
└── dev-panel.js（?dev 時のみ動的import）
```

---

## 設計原則

- **各ファイルは1つの責務**: シェーダー、UI、イベント、設定を明確に分離
- **config.js が唯一の設定源**: パラメータ・定数はconfig.jsに集約
- **scene.js は薄いオーケストレーション**: 個別シェーダーの実装は shaders/ に委譲
- **navigation.js はイベント統合**: 3Dオブジェクト生成とビューアーUIは分離

---

## DEV_MODEの切り替え

URLに `?dev` パラメータを付けるとdevパネルが表示される:

```
http://localhost:3001/?dev      ← devパネル表示
http://localhost:3001/          ← 通常表示
```

---

## Claude × Gemini 分業体制

### 概要

| 役割 | 担当 | 強み |
|------|------|------|
| **マネージャー** | Claude | コンテキスト把握、複数ファイル管理、要件整理、対話 |
| **プログラマー** | Gemini | シェーダー、視覚的品質の高いThree.jsコード生成 |

### 呼び出しルール

**Geminiはユーザーが明示した時のみ使用する。**

- ✅ 「Geminiでシェーダーを生成して」
- ✅ 「proモデルで水面のコードを作って」
- ❌ Three.jsコードだからといって自動でGeminiを使わない

### 利用可能なモデル

| キー | モデル名 | 用途 |
|------|---------|------|
| `flash` | gemini-2.0-flash | デフォルト、高速・低コスト |
| `flash-lite` | gemini-2.0-flash-lite | 最軽量 |
| `pro` | gemini-2.5-pro-preview | 高品質 |
| `3-flash` | gemini-3.0-flash | 最新 |

### MCPツール

| ツール | 用途 |
|--------|------|
| `generate_threejs_code` | Three.jsコード生成 |
| `generate_shader` | GLSLシェーダー生成 |
| `review_threejs_code` | コードレビュー |
| `compare_implementations` | Claude vs Gemini 比較 |
| `list_models` | 利用可能モデル一覧 |

### セットアップ

```bash
./scripts/setup-mcp.sh
cp .env.example .env
# .env に GEMINI_API_KEY を設定
uv sync
# Claude Desktop の MCP 設定に追加
```

---

## 技術スタック

- Three.js 0.160.0（CDN importmap）
- ES Modules（ビルドツールなし）
- シェーダー: simplex noise + FBM（GLSL文字列埋め込み）
- ポート: 3001（ローカル開発）
- デプロイ: GitHub Pages（mainブランチ直接）
