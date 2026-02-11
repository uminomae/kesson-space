# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-11
**セッション**: #5 完了

---

## 現在のファイル構成

```
kesson-space/
├── index.html              # エントリHTML（タイトル左下、h1にブログリンク）
├── serve.sh                # ローカル開発サーバー（ポート3001）
├── src/
│   ├── main.js             # エントリポイント（?devでパネル表示）
│   ├── scene.js            # シーン構築・更新オーケストレーション
│   ├── config.js           # 設定値・定数の一元管理
│   ├── controls.js         # OrbitControls（自動回転、カメラ位置API）
│   ├── navigation.js       # ナビゲーション統合（イベント処理）
│   ├── nav-objects.js      # 3Dナビオブジェクト（鬼火オーブ + テキスト）
│   ├── viewer.js           # PDFフロートビューアー（CSS + DOM）
│   ├── dev-panel.js        # 開発用パラメータ調整スライドパネル
│   ├── shaders/
│   │   ├── noise.glsl.js   # 共有simplex noise GLSL
│   │   ├── background.js   # 背景グラデーションシェーダー
│   │   ├── water.js        # 水面シェーダー
│   │   └── kesson.js       # 光（欠損）シェーダー
│   └── versions/
│       ├── LOG.md           # バージョン追跡ログ
│       ├── v001-baseline.js
│       ├── v002-gemini-fractal.js
│       ├── v003-soul-core.js
│       ├── v004-slate-blue.js
│       └── v005-module-split.js
├── docs/
│   ├── CURRENT.md          # ← この文書
│   ├── ARCHITECTURE.md
│   ├── CONCEPT.md
│   ├── PROMPT-STRUCTURE.md
│   ├── WORKFLOW.md
│   └── prompts/
├── mcp_servers/            # Gemini MCP連携
├── scripts/
├── .env.example
├── .gitignore
├── pyproject.toml
├── uv.lock
└── README.md
```

---

## 現在の状態

### 完了

- [x] リポジトリ作成・GitHub Pages有効化
- [x] コンセプト文書・プロジェクト管理体制
- [x] Three.js 統合シェーダーシステム（v006f）
- [x] 自動シーン遷移（背景2s / スタイル14s サイクル）
- [x] 水面シェーダー（FBM波、フレネル反射）
- [x] 光（欠損）シェーダー（2スタイル補間、呼吸アニメーション）
- [x] 3Dナビゲーション（鬼火オーブ → PDFビューアー）
- [x] devパネル（4セクション、リアルタイムパラメータ調整）
- [x] h1タイトルにブログ記事リンク
- [x] Gemini MCP連携構築
- [x] **リファクタリング #5**: scene.js分割、navigation.js分割、config抽出、DEV_MODE→URLパラメータ

### セッション#5 リファクタリング詳細

| 変更 | Before | After |
|------|--------|-------|
| scene.js | 15.9KB 1ファイル | scene.js（薄いオーケストレーション）+ shaders/4ファイル + config.js |
| navigation.js | 10.7KB 1ファイル | navigation.js（イベント統合）+ viewer.js + nav-objects.js |
| DEV_MODE | main.jsにハードコード `const DEV_MODE = true` | `?dev` URLパラメータで切替 |
| scenes/scene-v002.js | 未使用で放置 | 削除（要手動: GitHub APIでは削除不可） |
| noiseGLSL | scene.js内に埋め込み（3箇所重複） | shaders/noise.glsl.js に一元化 |

### 現在のデフォルトパラメータ

```json
{
  "brightness": 1, "glowCore": 0.07, "glowSpread": 0.08,
  "breathAmp": 0.15, "warpAmount": 1,
  "mixCycle": 2, "styleCycle": 14,
  "camX": -14, "camY": 0, "camZ": 34, "camTargetY": -1,
  "fogDensity": 0, "autoRotateSpd": 1,
  "titleBottom": 60, "titleLeft": 40,
  "titleSize": 2.7, "titleSpacing": 0.8, "titleOpacity": 0.5,
  "subSize": 1.3, "subOpacity": 0.5, "titleGlow": 30
}
```

### 未着手

- [ ] 欠損データ構造設計（data/kesson/）
- [ ] モバイル対応
- [ ] 音響の検討
- [ ] `src/scenes/scene-v002.js` の手動削除（GitHub APIで削除不可のため）

---

## ⚠️ Three.js作業時の重要ルール

**シェーダーや視覚的品質が重要なThree.jsコードを書く際は、Geminiへの作業依頼を検討すること。**

| 状況 | 対応 |
|------|------|
| シェーダー（GLSL）の新規作成・改良 | → Geminiに依頼 |
| 視覚的品質が重要なアニメーション | → Geminiに依頼 |
| 複数ファイルの構成・リファクタリング | → Claudeが対応 |
| バグ修正・デバッグ | → Claudeが対応 |

**ユーザーが明示した時のみGeminiを使用。自動呼び出しはしない。**

---

## 技術的メモ

- Three.js 0.160.0（CDN importmap）
- ES Modules（ビルドツールなし）
- シェーダー: simplex noise + FBM（GLSL埋め込み）
- ポート: 3001（pjdhiroの4000と干渉回避）
- MCP: mcp_servers/gemini_threejs.py
- デプロイ: GitHub Pages（mainブランチ直接）
- devパネル: `?dev` をURLに付与で表示

---

## 参照リンク

- [CONCEPT.md](./CONCEPT.md) - 理論とビジュアルの対応
- [ARCHITECTURE.md](./ARCHITECTURE.md) - ファイル構成・技術決定
- [PROMPT-STRUCTURE.md](./PROMPT-STRUCTURE.md) - プロンプトテンプレート
- [src/versions/LOG.md](../src/versions/LOG.md) - バージョン追跡ログ
- [mcp_servers/README.md](../mcp_servers/README.md) - MCPセットアップ手順
- [ライブサイト](https://uminomae.github.io/kesson-space/)
- [ブログ記事](https://uminomae.github.io/pjdhiro/thinking-kesson/)
