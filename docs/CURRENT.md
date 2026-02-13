# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-14
**セッション**: #15 E2Eテスト ブラウザ独立実行

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

### セッション#15 E2Eテスト ブラウザ独立実行

Claudeとの対話なしでE2Eテストをブラウザ単体で実行できる仕組みを追加。

| 変更 | 内容 |
|------|------|
| e2e-runner.js 拡張 | `?test` 検出時にページ内オーバーレイで結果表示。Re-run / Copy JSON / Failures only フィルタ付き |
| index.html | `?test` パラメータ検出 → window.load + 3秒待機後にe2e-runner.jsをfetch&eval |
| 実行方法 | ブックマークレット or `?test` URLパラメータ。Claude不要 |

#### テスト結果（localhost）

41/46 PASS, 1 FAIL, 4 WARN

- FAIL: LCP 10.88s — WebGL SPAの構造的問題（FCP 0.09sなので体感は高速）
- WARN: lang=en未テスト、devパネル未テスト、オーブ目視、favicon未設定（すべて想定内）

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

- [ ] LCP FAIL対応（閾値緩和 or WARN化の検討）
- [ ] favicon追加
- [ ] 欠損データ構造設計
- [ ] モバイル対応
- [ ] 音響の検討
- [ ] パフォーマンスプロファイリング

---

## テスト実行方法

### 静的解析（Node.js / CI自動）
```bash
node tests/config-consistency.test.js
```
GitHub Actionsで src/, tests/, index.html 変更時に自動実行。

### E2Eテスト（ブラウザ独立実行）

ブックマークレットまたは `?test` URLパラメータで実行。Claudeとの対話不要。

```
http://localhost:3001/?test          ← 全テスト自動実行
http://localhost:3001/?test&lang=en  ← 英語版テスト含む
http://localhost:3001/?test&dev      ← devパネルテスト含む
```

結果は右側オーバーレイに表示。Re-run / Copy JSON / Failures only フィルタ付き。

### E2Eテスト（Claude in Chrome MCP）
```javascript
// 全テスト（TC-01〜TC-11）
fetch('/tests/e2e-runner.js').then(r=>r.text()).then(eval)

// スモーク（TC-01,02,04のみ）
window.__e2e.smoke()

// 個別
window.__e2e.run('TC-E2E-09')  // リンク機能
window.__e2e.run('TC-E2E-10')  // キーボードナビ
window.__e2e.run('TC-E2E-11')  // Web Vitals
```

詳細: [tests/e2e-test-design.md](../tests/e2e-test-design.md)

---

## ⭐ Three.js作業時の重要ルール

**シェーダーや視覚的品質が重要なThree.jsコードを書く際は、Geminiへの作業依頼を検討すること。**
**ユーザーが明示した時のみGeminiを使用。自動呼び出しはしない。**

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

---

## 参照リンク

- [README.md](./README.md) - 管理ハブ
- [CONCEPT.md](./CONCEPT.md) - 理論とビジュアルの対応
- [ARCHITECTURE.md](./ARCHITECTURE.md) - ファイル構成・技術決定
- [REVIEW-REPORT.md](./REVIEW-REPORT.md) - 品質レビュー報告書
- [PROMPT-STRUCTURE.md](./PROMPT-STRUCTURE.md) - プロンプトテンプレート
- [mcp_servers/README.md](../mcp_servers/README.md) - MCPセットアップ手順
- [~~ISS-001~~](./issues/ISS-001-nav-accessibility.md) - ~~ナビゲーションアクセシビリティ改善~~ ✅ 全Phase完了
- [ライブサイト](https://uminomae.github.io/kesson-space/)
- [ブログ記事](https://uminomae.github.io/pjdhiro/thinking-kesson/)
- [GitHub Actions](https://github.com/uminomae/kesson-space/actions)
