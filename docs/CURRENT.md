# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-14
**セッション**: #24 devlogセクションJSON対応

---

## 現在の状態

### 完了

- [x] リポジトリ作成・GitHub Pages有効化
- [x] コンセプト文書・プロジェクト管理体制
- [x] Three.js 統合シェーダーシステム
- [x] 自動シーン遷移（背景2s / スタイル14s サイクル）
- [x] 水面シェーダー（FBM波、フレネル反射）
- [x] 光（欠損）シェーダー（2スタイル補間、呼吸アニメーション、RGBティント）
- [x] 3Dナビゲーション（鬼火オーブ → PDFビューアー）
- [x] Bootstrap 5 devパネル（アコーディオンUI、JSONエクスポート）
- [x] 統一呼吸システム（HTML + FOV + シェーダー同期）
- [x] ポストプロセス（屈折・ハロー・熱波・DOF）
- [x] 流体フィールド（ピンポンバッファ、マウス追従）
- [x] h1タイトルにブログ記事リンク
- [x] 左上クレジットセクション
- [x] Gemini MCP連携構築
- [x] **リファクタリング #5**: scene.js分割、config抽出、DEV_MODE→URLパラメータ
- [x] **ブランチマージ #6**: feature/gravitational-lens → main
- [x] **品質レビュー #7**: 4エージェント分析、テストスイート作成
- [x] **参照体系整備 #8**: SCOPE.md新設、参照リンク更新
- [x] **管理ハブ構築 #9**: README.md新設、SCOPE/WORKFLOW統合
- [x] **E2Eテスト・CI整備 #10**: 設計書・ランナー・GitHub Actions・README改訂
- [x] **アクセシビリティ分析 #11**: 4エージェント分析、ISS-001起票
- [x] **ISS-001実装 #12**: ナビゲーションアクセシビリティ改善（Phase 1-3）
- [x] **CI修正・Phase 4検証 #13**: 静的テスト修正、src/versions/ 削除、ライブサイト検証完了
- [x] **軽量化 #14**: Bootstrap条件付きロード、流体フィールド128化
- [x] **E2Eブラウザ独立実行 #15**: ?test自動実行 + 結果オーバーレイ
- [x] **TODO管理体系整備 #16**: TODO.md新設、README.md/CURRENT.md役割分担整理
- [x] **渦シェーダー・フォント修正 #17**: 渦シェーダー実装(OFF)、Noto Serif JP導入、h1白色修正
- [x] **マルチエージェント運用ルール #18**: AGENT-RULES.md策定、skills/・context-pack/新設
- [x] **セッションヘルスガード #19**: README.md §12新設、AGENT-RULES.md常駐エージェント追加
- [x] **セッションヘルスガード実効性強化 #20**: Memory連携、Step 1.5事前判定、3層担保
- [x] **リファクタリング提案統合 #21**: createGemOrbMaterial抽出、destroyControls追加
- [x] **TODO棚卸し + リファクタリング #22**: T-003完了確認、T-010/T-014実装、TODO整理
- [x] **devlogセクションJSON対応 #24**: sessions.json新設、dev-log.js更新

### セッション#24 devlogセクションJSON対応

**目標**: 最深部スクロール時のdevlogセクションをJSONデータから描画

**実施内容**:

1. **Phase 1**: `assets/devlog/sessions.json` 新設
   - i18n.jsのdevLog配列から構造化データに移行
   - DEVLOG-SPEC.mdスキーマに準拠
   - ja/en両言語のnarrative格納

2. **Phase 2**: `src/dev-log.js` 更新
   - `content/devlog-{lang}.md` → `assets/devlog/sessions.json` に切替
   - frontmatterパーサー削除、JSON処理に置換
   - 複数セッション対応（新しい順ソート、セッション間セパレーター）
   - safeHTML・スクロールフェードインアニメーション維持

**残作業** (ローカルで実行):
```bash
git rm content/devlog-ja.md content/devlog-en.md
git commit -m "chore: remove deprecated markdown devlogs (now using sessions.json)"
git push
```

### 決定事項

- 🩺セッションヘルスはClaude内部の常駐ガード。明示的な呼び出し不要
- シェーダーファイルの全文読み込みは1セッション2ファイルまで。超過時はセクション指定
- 4エージェント分析と実装は別セッションに分割する方針
- Gemini MCP応答はdiffのみ抽出。全文はGitHub直接コミット
- ガードの実効性はMemory→Step 1.5→§12の3層で担保する
- devlogデータは `assets/devlog/sessions.json` に一元管理

### バックログ

→ **[TODO.md](./TODO.md)** を参照

P1タスクなし。P2に5件（テスト系2、コンテンツ1、品質1、QA1）、P3に2件。

### 現在のデフォルトパラメータ

```json
{
  "sceneParams": {
    "brightness": 1.0, "glowCore": 0.07, "glowSpread": 0.08,
    "breathAmp": 0.15, "warpAmount": 1.0,
    "tintR": 1.25, "tintG": 2.0, "tintB": 0.8,
    "mixCycle": 2.0, "styleCycle": 14.0,
    "camX": -14, "camY": 0, "camZ": 34, "camTargetY": -1, "fogDensity": 0.0
  },
  "fluidParams": {
    "force": 1.0, "curl": 1.0, "decay": 0.948, "radius": 0.21, "influence": 0.06
  },
  "distortionParams": {
    "strength": 0.03, "aberration": 0.1, "turbulence": 0.4,
    "haloColorR": 0.3, "haloColorG": 0.2, "haloColorB": 0.05,
    "haloIntensity": 0.2, "haloWidth": 1.0,
    "heatHaze": 0.024, "heatHazeRadius": 0.5, "heatHazeSpeed": 1.0,
    "dofStrength": 0.009, "dofFocusRadius": 0.32
  },
  "vortexParams": {
    "enabled": false, "speed": 1.82, "intensity": 10, "scale": 4.5,
    "size": 255, "posY": -6, "colorR": 0.15, "colorG": 0.2, "colorB": 1.95,
    "iterations": 35, "innerIterLimit": 250
  }
}
```

---

## テスト実行方法

### 静的解析（Node.js / CI自動）
```bash
node tests/config-consistency.test.js
```
GitHub Actionsで src/, tests/, index.html 変更時に自動実行。

### E2Eテスト（ブラウザ独立実行）

```
http://localhost:3001/?test          ← 全テスト自動実行
http://localhost:3001/?test&lang=en  ← 英語版テスト含む
http://localhost:3001/?test&dev      ← devパネルテスト含む
```

結果は右側オーバーレイに表示。Re-run / Copy JSON / Failures only フィルタ付き。

詳細: [tests/e2e-test-design.md](../tests/e2e-test-design.md)

---

## ⭐ Three.js作業時の重要ルール

**→ [AGENT-RULES.md](./AGENT-RULES.md) および [skills/orchestrator.md](../skills/orchestrator.md) を参照**

要約:
- シェーダー/Three.jsコードはGemini MCP経由で実装する
- Claudeは擬似コード・インターフェース設計まで。関数の中身は書かない
- ユーザーが明示した時のみGeminiを使用。自動呼び出しはしない

---

## 技術的メモ

- Three.js 0.160.0（CDN importmap）
- Bootstrap 5.3.3（CDN、devパネル ?dev 時のみ動的ロード）
- ES Modules（ビルドツールなし）
- ポート: 3001（pjdhiroの4000と干渉回避）
- MCP: mcp_servers/gemini_threejs.py
- デプロイ: GitHub Pages（mainブランチ直接）
- devパネル: `?dev` をURLに付与で表示
- E2Eテスト: `?test` をURLに付与 or ブックマークレットで実行
- CI: GitHub Actions（.github/workflows/test.yml）
- アクセシビリティ: WCAG 2.1 Level A準拠達成
- 流体フィールド: 128x128（FIELD_SIZE=128）
- フォント: Noto Serif JP (Google Fonts) + Yu Mincho/MS PMinchoフォールバック
- devlogデータ: `assets/devlog/sessions.json`

---

## 参照リンク

- [README.md](./README.md) - 管理ハブ
- [TODO.md](./TODO.md) - タスクバックログ
- [AGENT-RULES.md](./AGENT-RULES.md) - マルチエージェント運用ルール
- [CONCEPT.md](./CONCEPT.md) - 理論とビジュアルの対応
- [ARCHITECTURE.md](./ARCHITECTURE.md) - ファイル構成・技術決定
- [REVIEW-REPORT.md](./REVIEW-REPORT.md) - 品質レビュー報告書
- [mcp_servers/README.md](../mcp_servers/README.md) - MCPセットアップ手順
- [~~ISS-001~~](./issues/ISS-001-nav-accessibility.md) - ~~ナビゲーションアクセシビリティ改善~~ ✅ 全Phase完了
- [ライブサイト](https://uminomae.github.io/kesson-space/)
- [ブログ記事](https://uminomae.github.io/pjdhiro/thinking-kesson/)
- [GitHub Actions](https://github.com/uminomae/kesson-space/actions)
