# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-13
**セッション**: #9 管理ハブ構築

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

### セッション#9 管理ハブ構築

| 変更 | 内容 |
|------|--------|
| README.md 新設 | kesson-thinking同様の管理ハブ。セッション手順・正本原則・cross-repo・PK管理・ファイルカタログ |
| SCOPE.md → リダイレクト | 内容をREADME §1,§5,§6に統合 |
| WORKFLOW.md → リダイレクト | 内容をREADME §2,§3に統合 |

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
  }
}
```

### 未着手

- [ ] Chromeベーステストスイート整備
- [ ] 欠損データ構造設計
- [ ] モバイル対応
- [ ] 音響の検討
- [ ] パフォーマンスプロファイリング

---

## ⭐ Three.js作業時の重要ルール

**シェーダーや視覚的品質が重要なThree.jsコードを書く際は、Geminiへの作業依頼を検討すること。**
**ユーザーが明示した時のみGeminiを使用。自動呼び出しはしない。**

---

## 技術的メモ

- Three.js 0.160.0（CDN importmap）
- Bootstrap 5.3.3（CDN、devパネル用）
- ES Modules（ビルドツールなし）
- ポート: 3001（pjdhiroの4000と干渉回避）
- MCP: mcp_servers/gemini_threejs.py
- デプロイ: GitHub Pages（mainブランチ直接）
- devパネル: `?dev` をURLに付与で表示
- テスト: `node tests/config-consistency.test.js`

---

## 参照リンク

- [README.md](./README.md) - 管理ハブ
- [CONCEPT.md](./CONCEPT.md) - 理論とビジュアルの対応
- [ARCHITECTURE.md](./ARCHITECTURE.md) - ファイル構成・技術決定
- [REVIEW-REPORT.md](./REVIEW-REPORT.md) - 品質レビュー報告書
- [PROMPT-STRUCTURE.md](./PROMPT-STRUCTURE.md) - プロンプトテンプレート
- [mcp_servers/README.md](../mcp_servers/README.md) - MCPセットアップ手順
- [ライブサイト](https://uminomae.github.io/kesson-space/)
- [ブログ記事](https://uminomae.github.io/pjdhiro/thinking-kesson/)
