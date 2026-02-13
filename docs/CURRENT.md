# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-14
**セッション**: #12 ISS-001 ナビゲーションアクセシビリティ改善

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
- [x] **ISS-001実装 #12**: ナビゲーションアクセシビリティ改善

### セッション#12 ISS-001実装

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 1 | コード修正（nav-objects.js, lang-toggle.js, index.html） | ✅ 完了 |
| Phase 2 | E2Eテスト追加（TC-09, TC-10） | ✅ 完了 |
| Phase 3 | ドキュメント更新（CURRENT.md） | ✅ 完了 |
| Phase 4 | デプロイ・検証 | ⏳ ライブサイト確認待ち |

#### 変更内容

**nav-objects.js**:
- `createHtmlLabel()`: `<div>` → `<button>` 化
- aria-label追加（言語対応: ja/en）
- click/keydownイベントハンドラ追加（PDF viewer / external link）
- CSS: `pointer-events: none` → `auto`、focus/hoverスタイル追加
- `updateSingleLabel()`: フェード時・カメラ背面時に `pointer-events: none` で無効化

**lang-toggle.js**:
- aria-label追加（「言語を英語に切り替え」/「Switch language to Japanese」）
- :focus スタイル追加

**index.html**:
- 浮上ボタンに `aria-label="ページ上部に戻る"` 追加
- 浮上ボタンに :focus スタイル追加

**tests/e2e-runner.js**:
- TC-E2E-09: リンク機能検証（h1リンク、ナビボタンクリック→ビューアー、aria-label）
- TC-E2E-10: キーボードナビゲーション（フォーカス要素数、フォーカス可否、Enterキー起動）

#### 設計判断

- Raycasterによる3Dクリック判定は**装飾的補助機能として残存**
- HTMLボタンが**主要インタラクション手段**（アクセシビリティの主軸）
- フェード中・スクロール後はpointer-eventsを動的に無効化（3Dとの競合防止）
- GPTのE2Eテスト助言を参考: 操作→状態→結果の回帰テストパターンを採用

### E2Eテスト結果

**Phase 4でライブサイトにて検証予定**

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

- [ ] 欠損データ構造設計
- [ ] モバイル対応
- [ ] 音響の検討
- [ ] パフォーマンスプロファイリング

---

## 次回セッションへの引き継ぎ

### Phase 4 検証チェックリスト

ライブサイトにデプロイ後、以下を検証:

- [ ] Tab キーでナビボタンにフォーカスが移動する
- [ ] フォーカス時に青いアウトラインが表示される
- [ ] Enter/Space キーでPDFビューアーが開く
- [ ] マウスクリックでもPDFビューアーが開く（従来通り）
- [ ] Raycaster経由のクリックも引き続き動作
- [ ] スクロール後にナビボタンのpointer-eventsが無効化される
- [ ] E2Eテスト（TC-09, TC-10）がPASS
- [ ] モバイルでタップ操作が正常

---

## テスト実行方法

### 静的解析（Node.js / CI自動）
```bash
node tests/config-consistency.test.js
```
GitHub Actionsで src/, tests/, index.html 変更時に自動実行。

### E2Eテスト（Claude in Chrome MCP）
```javascript
// 全テスト（TC-01〜TC-10）
fetch('https://uminomae.github.io/kesson-space/tests/e2e-runner.js').then(r=>r.text()).then(eval)

// スモーク（TC-01,02,04のみ）
window.__e2e.smoke()

// 個別（ISS-001テスト）
window.__e2e.run('TC-E2E-09')  // リンク機能
window.__e2e.run('TC-E2E-10')  // キーボードナビ
```

詳細: [tests/e2e-test-design.md](../tests/e2e-test-design.md)

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
- CI: GitHub Actions（.github/workflows/test.yml）
- アクセシビリティ: WCAG 2.1 Level A準拠を目標

---

## 参照リンク

- [README.md](./README.md) - 管理ハブ
- [CONCEPT.md](./CONCEPT.md) - 理論とビジュアルの対応
- [ARCHITECTURE.md](./ARCHITECTURE.md) - ファイル構成・技術決定
- [REVIEW-REPORT.md](./REVIEW-REPORT.md) - 品質レビュー報告書
- [PROMPT-STRUCTURE.md](./PROMPT-STRUCTURE.md) - プロンプトテンプレート
- [mcp_servers/README.md](../mcp_servers/README.md) - MCPセットアップ手順
- [~~ISS-001~~](./issues/ISS-001-nav-accessibility.md) - ~~ナビゲーションアクセシビリティ改善~~ ✅ 完了
- [ライブサイト](https://uminomae.github.io/kesson-space/)
- [ブログ記事](https://uminomae.github.io/pjdhiro/thinking-kesson/)
- [GitHub Actions](https://github.com/uminomae/kesson-space/actions)
