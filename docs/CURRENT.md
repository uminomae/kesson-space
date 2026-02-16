# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-16
**セッション**: #39 T-040-12 UI修正・Articles/TRACES調整

---

## 現在の状態

### セッション#35〜#39 実施内容

1. **T-040-11: Articles Read More Offcanvas実装** ✅
   - Devlog Offcanvasパターン踏襲でArticles Offcanvas実装
   - ブランチ: `claude/articles-read-more-offcanvas-Ddbu0` → main マージ済み

2. **T-040-12: Bootstrap標準カード化 + UI修正** ✅ (main: e0a03bb)
   - Phase 1-4: articles/devlogカードをBootstrap標準カード化
   - セクション見出しDEVLOG/TRACES入れ替え（Codex実装）
   - articlesセクションをdevlogの上に移動
   - devlog Read More件数表示追加、articles件数表示削除
   - TRACES: sticky→fixed復帰、フェードイン表示タイミング調整（enterLine 0.35→0.15）
   - TRACES表示ラインをconfigurable化

3. **T-040-14: pjdhiro API自動生成（Liquid template化）** 🔄 進行中
   - pjdhiro repo `codex/t040-14-api-autogen` ブランチ作成済み
   - tags/categories付きJSON自動生成Liquidテンプレート適用
   - → pjdhiro側マージ → kesson-space articlesフィルタ実装待ち

4. **環境・運用整備**
   - リポ移行: ~/Documents/GitHub → ~/dev/
   - PMエージェント: DT↔CLI通信セクション追加、SHガード追加
   - 2月Codex優先ルール追加（Claude CLI実装凍結）
   - CLAUDE.md パス更新

### 決定事項

- 2月中はCodex優先（Claude CLI実装凍結）
- TRACES = fixedナビゲーションインジケータ（stickyではない）
- Articles表示は「欠損駆動思考」タグでフィルタ

### 次セッションのタスク

**T-040-14 残り**: pjdhiro Liquid templateマージ確認 → kesson-space articlesフィルタ実装
**T-040-13**: スタイルシート分離（style→外部CSS）+ HTMLタグコメント追加（Claude対話時セクション特定用）

## 未完了タスク

→ **[TODO.md](./TODO.md)** を参照

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

---

## ⭐ Three.js作業時の重要ルール

**→ [AGENT-RULES.md](./AGENT-RULES.md) および [skills/orchestrator.md](../skills/orchestrator.md) を参照**

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
- フォント: Noto Serif JP (Google Fonts) + Yu Mincho/MS PMichoフォールバック

---

## 参照リンク

- [README.md](../README.md) - セッション起動（エントリーポイント）
- [docs/README.md](./README.md) - ドキュメントハブ
- [TODO.md](./TODO.md) - タスクバックログ
- [AGENT-RULES.md](./AGENT-RULES.md) - マルチエージェント運用ルール
- [CONCEPT.md](./CONCEPT.md) - 理論↔視覚の対応
- [ARCHITECTURE.md](./ARCHITECTURE.md) - ファイル構成・技術決定
- [ライブサイト](https://uminomae.github.io/kesson-space/)
- [ブログ記事](https://uminomae.github.io/pjdhiro/thinking-kesson/)
- [GitHub Actions](https://github.com/uminomae/kesson-space/actions)
