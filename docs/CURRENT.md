# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-16
**セッション**: DTチャット（T-053a / T-054 / T-040-14 + P2並列4件投入）

---

## 現在の状態

### 本セッション完了

1. **T-053a: CSS外部化** ✅
   - index.html `<style>` → src/styles/main.css 分離
   - dev-panel Bootstrap再注入修正

2. **T-054: Xロゴ裏表反転修正** ✅
   - nav-objects.js `root.rotation.y += Math.PI` 削除

3. **T-040-14: Articles フォールバック + フィルタUI** ✅
   - assets/articles/articles.json スナップショット配置
   - Offcanvas内 All/Page/Post フィルタUI追加

### P2並列実装（4ブランチ、マージ待ち）

| ブランチ | タスク | 状態 |
|----------|--------|------|
| feature/t055-keyboard-nav | T-055 Tabキーnav | ✅ 完了 (97c2e3a) |
| feature/t016-t017-uniform-registry | T-016+T-017 uniform registry | ✅ 完了 (3513bc7) |
| claude/refactor-inline-styles-zE5Eb | T-018 CSS所在整理 | ✅ 完了 |
| feature/t038-t046-t047-docs-ci | T-038+T-046+T-047 docs/CI | 🚀 実装中 |

**マージ順序**: D(docs/CI) → A(keyboard nav) → B(uniform) → C(CSS cleanup)

### TODO整理

- T-043: 削除（現状ページ遷移で十分）
- T-006, T-015: 削除（不要）
- T-053b: T-018に統合
- T-049: P3へ降格

### 決定事項

- P1バックログ空（全P2以下）
- 2月中はCodex優先（Claude CLI実装凍結）
- TRACES = fixedナビゲーションインジケータ

### 次セッションのタスク

- 4ブランチのマージ完了 → 目視確認 → TODO更新
- 残P2タスクから次の優先度選定

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
