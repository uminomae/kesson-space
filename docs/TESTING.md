# TESTING.md — テスト・品質管理

**バージョン**: 1.0
**作成日**: 2026-02-15

---

## 1. 三層テスト体制

| 層 | トリガー | ツール | 内容 |
|----|---------|--------|------|
| **CI自動** | `git push`（src/, tests/, index.html変更時） | GitHub Actions + Node.js | config整合性テスト |
| **E2Eブラウザ** | `?test` パラメータ | ブラウザ内蔵ランナー | UI・描画・パフォーマンス |
| **E2Eフル** | 機能追加後 | Claude in Chrome MCP | 全TC実行（約5分） |

---

## 2. 静的テスト（Node.js / CI）

### 実行方法

```bash
node tests/config-consistency.test.js
```

### 検証内容

- config ↔ shader ↔ dev-panel の値整合性
- i18nキー構造
- 未使用ファイル検出

### CI統合

GitHub Actionsで `src/`, `tests/`, `index.html` 変更時に自動実行。
`process.exit(1)` でFAIL時に非ゼロ返却 → CIで赤バッジ。

---

## 3. E2Eテスト（ブラウザ実行）

### URLパラメータ実行

```
http://localhost:3001/?test          ← 全テスト自動実行
http://localhost:3001/?test&lang=en  ← 英語版テスト含む
http://localhost:3001/?test&dev      ← devパネルテスト含む
```

結果は右側オーバーレイに表示。Re-run / Copy JSON / Failures only フィルタ付き。

### Claude in Chrome MCP実行

```javascript
// 全テスト実行
fetch('https://uminomae.github.io/kesson-space/tests/e2e-runner.js')
  .then(r => r.text()).then(eval)

// スモーク（TC-01, 02, 04 のみ）
window.__e2e.smoke()

// 個別実行
window.__e2e.run('TC-E2E-03')
```

---

## 4. テストケース一覧

| TC | カテゴリ | 検証内容 |
|----|---------|----------|
| 01 | WebGL描画 | canvas存在、WebGLコンテキスト、アニメーション動作 |
| 02 | UI要素 | タイトル、タグライン、クレジット、操作ガイド、リンク |
| 03 | 言語切替 | `?lang=en` での英語表示、トグルボタン |
| 04 | コンソール | JSエラーゼロ、404なし |
| 05 | ナビオーブ | シーン内存在、ラベル表示、視認性 |
| 06 | スクロール | カメラ移動、dev-log表示、浮上ボタン |
| 07 | Devパネル | `?dev` での表示制御、スライダー連動 |
| 08 | パフォーマンス | ロード時間、FPS、メモリ |

詳細設計: [tests/e2e-test-design.md](../tests/e2e-test-design.md)

---

## 5. テストファイル構成

| ファイル | 種別 | 実行環境 |
|---------|------|----------|
| `tests/config-consistency.test.js` | 静的解析 | Node.js / CI |
| `tests/e2e-test-design.md` | E2E設計書 | ドキュメント |
| `tests/e2e-runner.js` | E2Eランナー | ブラウザ |
| `.github/workflows/test.yml` | CI定義 | GitHub Actions |

---

## 6. 運用ルール

1. **コミット前**: `node tests/config-consistency.test.js` をローカルで実行
2. **デプロイ後**: E2Eスモークテストを実行
3. **機能追加時**: 該当するTCを更新 or 新規TCを設計書に追加してからコード実装（テスト先行）
4. **テスト結果**: CURRENT.mdに記録

---

## 7. 参照リンク

- [README.md](./README.md) — ドキュメントハブ
- [tests/e2e-test-design.md](../tests/e2e-test-design.md) — E2E詳細設計
- [GitHub Actions](https://github.com/uminomae/kesson-space/actions) — CI実行履歴

---

## 8. Bootstrap CSS制御ルール

### 8.1 表示/非表示の切り替え

データ有無による要素の表示制御は、Bootstrapの`d-none`クラスを使用する:

```javascript
// 良い例
if (data) {
    element.classList.remove('d-none');
} else {
    element.classList.add('d-none');
}

// 避けるべき例（style直接操作との混在）
element.style.display = data ? 'block' : 'none';
```

### 8.2 モーダルの制御

- モーダル表示: `bootstrap.Modal.getOrCreateInstance(el).show()`
- モーダル非表示: `bootstrap.Modal.getInstance(el).hide()`
- モーダル内セクションの表示/非表示: `d-none`クラス

### 8.3 ダークテーマ

devlog.htmlでは`modal-content`に独自ダークスタイルを適用。
Bootstrapデフォルトクラスと競合しないよう注意。
