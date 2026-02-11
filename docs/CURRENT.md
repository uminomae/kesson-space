# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-11
**セッション**: #4 完了

---

## 現在のファイル構成

```
kesson-space/
├── index.html              # エントリHTML（タイトル左下、h1にブログリンク）
├── serve.sh                # ローカル開発サーバー（ポート3001）
├── src/
│   ├── main.js             # エントリポイント（DEV_MODE切替、devパネル連携）
│   ├── scene.js            # 統合シェーダー（水面+光+背景、v006f）
│   ├── controls.js         # OrbitControls（自動回転、カメラ位置API）
│   ├── navigation.js       # 3Dナビ（鬼火オーブ+PDFビューアー）
│   ├── dev-panel.js        # 開発用パラメータ調整スライドパネル
│   ├── scenes/
│   │   └── scene-v002.js   # 旧: 個別シーン（未使用）
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

---

## 次セッション: リファクタリング候補

### scene.js（15.9KB — 最大のファイル）

現在1ファイルに全シェーダーが集約。分割候補：

| 抽出候補 | 内容 | 理由 |
|----------|------|------|
| `shaders/noise.glsl.js` | noiseGLSL定数 | 3箇所で重複使用 |
| `shaders/water.js` | 水面マテリアル生成 | 独立した機能単位 |
| `shaders/kesson.js` | 光シェーダーマテリアル生成 | 独立した機能単位 |
| `shaders/background.js` | 背景グラデーション | 独立した機能単位 |
| `config.js` | sceneParams + 色定数 | 設定値の一元管理 |

### navigation.js（10.7KB）

ビューアーUI（CSS+DOM生成）が大部分。分割候補：

| 抽出候補 | 内容 |
|----------|------|
| `viewer.js` | フロートビューアー（CSS + DOM + open/close） |
| `nav-objects.js` | 3Dオーブ生成 + テキストスプライト |

### dev-panel.js（10.9KB）

CSSが半分以上。分割候補：

| 抽出候補 | 内容 |
|----------|------|
| `dev-panel-styles.js` | CSS文字列の分離 |

### その他

- `src/scenes/scene-v002.js` — 未使用。削除 or versions/に移動
- `src/versions/` — アーカイブとして保持するか、別ブランチに退避するか
- `docs/ARCHITECTURE.md` — 現状と乖離あり。要更新
- DEV_MODEフラグ — main.jsにハードコード。URLパラメータ（`?dev`）で切替に変更検討

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

---

## 参照リンク

- [CONCEPT.md](./CONCEPT.md) - 理論とビジュアルの対応
- [ARCHITECTURE.md](./ARCHITECTURE.md) - ファイル構成・技術決定（※要更新）
- [PROMPT-STRUCTURE.md](./PROMPT-STRUCTURE.md) - プロンプトテンプレート
- [src/versions/LOG.md](../src/versions/LOG.md) - バージョン追跡ログ
- [mcp_servers/README.md](../mcp_servers/README.md) - MCPセットアップ手順
- [ライブサイト](https://uminomae.github.io/kesson-space/)
- [ブログ記事](https://uminomae.github.io/pjdhiro/thinking-kesson/)
