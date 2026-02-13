# E2Eテスト設計書 — kesson-space

**バージョン**: 1.1
**作成日**: 2026-02-13
**更新日**: 2026-02-14
**セッション**: kesson-space #10, #15
**対象**: https://uminomae.github.io/kesson-space/

---

## 1. 目的と位置づけ

### 1.1 目的

kesson-spaceライブサイトの**ブラウザ上での動作品質**をE2Eで検証する。
既存の `tests/config-consistency.test.js`（Node.js静的解析）が扱えない領域を補完する。

### 1.2 テスト層の全体像

| 層 | ツール | 対象 | 状態 |
|----|--------|------|------|
| 静的解析 | Node.js (`config-consistency.test.js`) | config↔shader↔devパネルの値整合 | ✅ 既存 |
| **E2E** | **Claude in Chrome MCP** | **ブラウザ描画・DOM・操作・エラー** | **← 本設計** |
| 視覚品質 | 目視 + Geminiレビュー | シェーダー美的品質 | 手動（スコープ外） |

### 1.3 実行環境

- **ツール**: Claude in Chrome MCP（DTアプリから実行）
- **対象URL**: `https://uminomae.github.io/kesson-space/`
- **操作**: `navigate`, `read_page`, `find`, `javascript_tool`, `computer`（screenshot）, `read_console_messages`
- **成果物**: テスト結果レポート（PASS/FAIL + スクリーンショット）

---

## 2. テストケース一覧

### TC-E2E-01: ページロードと WebGL 描画

**前提**: デフォルトURL（`?lang`パラメータなし）でアクセス

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 01-1 | ページが正常にロード | `navigate` 成功 | エラーなし |
| 01-2 | `<canvas>` が `#canvas-container` 内に存在 | `javascript_tool`: `document.querySelector('#canvas-container canvas')` | non-null |
| 01-3 | canvasサイズが画面と一致 | `javascript_tool`: canvas.width, canvas.height | >0, ≒ viewport |
| 01-4 | WebGLコンテキストが有効 | `javascript_tool`: `canvas.getContext('webgl2') \|\| canvas.getContext('webgl')` | non-null |
| 01-5 | Three.jsアニメーションが動作中 | `javascript_tool`: 2回の `performance.now()` 間でレンダラーのframeが増加 | frame差 > 0 |

### TC-E2E-02: UI要素の表示

**前提**: ページロード後3秒待機（呼吸アニメーション開始待ち）

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 02-1 | タイトル `h1#title-h1` が表示 | `javascript_tool` | textContent === '欠損駆動思考' |
| 02-2 | サブタイトル `.subtitle` が表示 | `javascript_tool` | textContent === 'Kesson Space' |
| 02-3 | タグライン `#taglines` に2行存在 | `javascript_tool`: `.tagline` の個数 | === 2 |
| 02-4 | クレジット `#credit` が表示 | `javascript_tool` | `.credit-line` のtextContent に 'AI' 含む |
| 02-5 | クレジット署名に 'pjdhiro' | `javascript_tool` | `.credit-signature` に 'pjdhiro' 含む |
| 02-6 | 操作ガイド `#control-guide` が存在 | `javascript_tool` | element exists |
| 02-7 | スクロールヒント（下部） `#scroll-hint` が存在 | `javascript_tool` | element exists |
| 02-8 | h1がブログ記事へのリンクを持つ | `javascript_tool`: h1の親`<a>`のhref | 含む 'pjdhiro/thinking-kesson' |

### TC-E2E-03: 言語切替

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 03-1 | `?lang=en` でアクセス | `navigate` to URL + `?lang=en` | ページロード成功 |
| 03-2 | `<html lang="en">` | `javascript_tool`: `document.documentElement.lang` | === 'en' |
| 03-3 | h1が英語タイトル | `javascript_tool` | === 'Kesson-Driven Thinking' |
| 03-4 | タグラインが英語 | `javascript_tool` | 含む "Don't discard" |
| 03-5 | クレジットが英語 | `javascript_tool` | 含む 'Exploring' |
| 03-6 | 言語トグルボタンが存在し '日本語' と表示 | `find`: 言語切替ボタン | textContent === '日本語' |

### TC-E2E-04: コンソールエラーチェック

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 04-1 | JSエラーなし（日本語版） | `read_console_messages` with `onlyErrors: true` | エラー0件 |
| 04-2 | JSエラーなし（英語版） | `?lang=en` でアクセス後、同上 | エラー0件 |
| 04-3 | 404リソースなし | `read_network_requests` でステータス確認 | 4xx/5xx なし |

**許容例外**: Google Analytics関連の警告、外部CDNの軽微な警告

### TC-E2E-05: ナビゲーションオーブ

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 05-1 | Three.jsシーン内にnavオブジェクトが存在 | `javascript_tool`: scene.traverse でuserData.index検索 | 3個以上 |
| 05-2 | ナビラベル（DOM）が表示されている | `find` or `javascript_tool` | PDF種別ラベルが存在 |
| 05-3 | スクリーンショットでオーブが視認可能 | `computer`: screenshot → 目視確認 | 光るオブジェクトが見える |

**注**: オーブのクリック→PDFビューアー起動は、外部PDF依存のため手動確認推奨。
自動テストではクリック後にビューアーDOMが生成されるかのみ検証可能。

### TC-E2E-06: スクロール動作

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 06-1 | `#hero-spacer` が存在（250vh） | `javascript_tool` | element exists, height > 0 |
| 06-2 | スクロールでカメラが移動 | scroll → `javascript_tool` でcamera.position.y比較 | y値が変化 |
| 06-3 | 開発ログ `#dev-log` にテキストが表示 | スクロール後、`javascript_tool` | `.log-paragraph` が1つ以上 |
| 06-4 | 浮上ボタン `#surface-btn` がスクロール後に表示 | `javascript_tool`: opacity, pointer-events | opacity > 0 |

### TC-E2E-07: Devパネル

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 07-1 | `?dev` なしでdevパネルが非表示 | `find`: devパネル | 見つからない or display:none |
| 07-2 | `?dev` ありでdevパネルが表示 | `navigate` to `?dev` → `find` | パネル要素が存在 |
| 07-3 | スライダー操作が値を反映 | `javascript_tool`: スライダーvalue変更→config値確認 | 連動 |

### TC-E2E-08: パフォーマンス基礎チェック

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 08-1 | 初回ロード完了が10秒以内 | `javascript_tool`: `performance.timing` | loadEvent < 10s |
| 08-2 | フレームレート | `javascript_tool`: 1秒間のrAFカウント | ≥ 20fps |
| 08-3 | メモリリーク兆候なし | `javascript_tool`: `performance.memory`（Chrome） | usedJSHeapSize 安定 |

### TC-E2E-09: リンク機能検証（ISS-001）

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 09-1 | h1リンクが有効なURL | `javascript_tool` | href starts with 'http' |
| 09-2 | h1リンクがクリック可能 | `javascript_tool` | href !== '#' |
| 09-3a | ナビボタンにtabIndex設定 | `javascript_tool` | tabIndex === 0 |
| 09-3b | ナビボタンにaria-label設定 | `javascript_tool` | 含む 'PDF' or '開く' |
| 09-3c | クリックでビューアーが表示 | ボタンclick → DOM確認 | .visible クラス付与 |
| 09-4a | 言語トグルにaria-label設定 | `javascript_tool` | 存在する |
| 09-5 | 浮上ボタンにaria-label設定 | `javascript_tool` | 存在する |

### TC-E2E-10: キーボードナビゲーション（ISS-001）

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 10-1 | フォーカス可能要素が5個以上 | `javascript_tool` | ≥ 5 |
| 10-2 | ナビボタンにフォーカス可能 | focus() → activeElement確認 | 一致 |
| 10-3 | Enterキーでビューアー起動 | keydown dispatch → DOM確認 | ビューアー表示 |
| 10-4 | GemボタンにもAria設定あり | `javascript_tool` | aria-label存在 |

### TC-E2E-11: Google Core Web Vitals & パフォーマンス予算

Google推奨閾値に対してPASS/WARN/FAILの3段階で評価する。
3Dサイトの特性上、テキストサイトより緩い運用閾値も併記。

参照: https://web.dev/vitals/

| # | 指標 | Google推奨(Good) | WARN閾値 | FAIL閾値 | 計測API |
|---|------|-----------------|---------|---------|--------|
| 11-1 | DOMContentLoaded | < 2.5s | 2.5-4.0s | > 4.0s | Navigation Timing |
| 11-2 | Load完了時間 | < 3.0s | 3.0-5.0s | > 5.0s | Navigation Timing |
| 11-3 | FCP (First Contentful Paint) | < 1.8s | 1.8-3.0s | > 3.0s | Paint Timing |
| 11-4 | LCP (Largest Contentful Paint) | < 2.5s | 2.5-4.0s | > 4.0s | PerformanceObserver (buffered) |
| 11-5 | CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 | PerformanceObserver (buffered) |
| 11-6 | 転送量 | < 1,600KB | 1,600-3,000KB | > 3,000KB | Resource Timing (transferSize) |
| 11-7 | リクエスト数 | < 50 | 50-80 | > 80 | Resource entries count |
| 11-8 | favicon設定 | `<link rel="icon">` 存在 | 未設定 | — | DOM検査 |

**注意事項:**
- transferSize はcross-originリソースでは0を返す場合がある（CORS制約）
- LCP/CLSのbuffered observeは一部ブラウザで未対応
- GitHub Pages CDNのキャッシュ状態により数値が大きく変動する

**実行方法:**
```javascript
// パフォーマンスのみ
fetch('/tests/e2e-runner.js').then(r=>r.text()).then(eval)
window.__e2e.perf()
```

---

## 3. 実行手順

### 3.1 フル実行（推奨）

```
1. navigate → https://uminomae.github.io/kesson-space/
2. wait 3s（Three.js初期化 + 呼吸アニメーション開始）
3. TC-E2E-01（WebGL描画）実行
4. TC-E2E-02（UI要素）実行
5. TC-E2E-04（コンソールエラー — 日本語版）実行
6. TC-E2E-05（ナビオーブ）実行
7. TC-E2E-06（スクロール）実行
8. screenshot（日本語版の証跡）
9. navigate → ?lang=en
10. wait 3s
11. TC-E2E-03（言語切替）実行
12. TC-E2E-04（コンソールエラー — 英語版）実行
13. screenshot（英語版の証跡）
14. navigate → ?dev
15. wait 3s
16. TC-E2E-07（Devパネル）実行
17. TC-E2E-08（パフォーマンス）実行
18. TC-E2E-11（Web Vitals）実行
19. 結果集計 → レポート出力
```

### 3.2 スモークテスト（最小実行）

TC-E2E-01, TC-E2E-02, TC-E2E-04 のみ。約2分。
デプロイ直後の迅速な正常性確認に使用。

### 3.3 パフォーマンステスト（TC-E2E-11のみ）

```javascript
fetch('/tests/e2e-runner.js').then(r=>r.text()).then(eval)
window.__e2e.perf()
```

---

## 4. 判定基準

| レベル | 条件 | 対応 |
|--------|------|------|
| **PASS** | 全項目が期待値通り | テスト合格 |
| **WARN** | 許容例外のみ（GA警告等）またはパフォーマンス改善推奨 | 記録して継続 |
| **FAIL** | 期待値と不一致 | 原因特定 → 修正 or ISS起票 |

---

## 5. 成果物

| ファイル | 配置先 | 内容 |
|---------|--------|------|
| `tests/e2e-test-design.md` | kesson-space repo | 本設計書 |
| `tests/e2e-runner.js` | kesson-space repo | ページ内注入用の自動チェックスクリプト |
| テスト結果レポート | CURRENT.mdに記録 | PASS/FAIL集計 + スクリーンショット |

---

## 6. 既存テストとの関係

```
tests/
├── config-consistency.test.js   ← 静的解析（Node.js）。変更なし
├── e2e-test-design.md           ← 本設計書
└── e2e-runner.js                ← ブラウザ注入チェック（TC-01〜TC-11）
```

`e2e-runner.js` は `javascript_tool` でページに注入して実行する自律的なチェックスクリプト。
Claude in Chrome MCPの `navigate` + `javascript_tool` + `read_console_messages` で制御する。

---

## 7. スコープ外

| 項目 | 理由 |
|------|------|
| モバイル実機テスト | Chrome MCP環境がデスクトップのみ |
| シェーダー美的品質の自動判定 | ピクセル比較は不安定。目視 + Geminiレビューで対応 |
| PDF表示内容の検証 | 外部ホスト（pjdhiro repo）依存。存在確認のみ |
| 負荷テスト | 単一ユーザーサイトのため不要 |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-02-13 | 初版作成（Session #10） |
| 2026-02-14 | TC-E2E-11 (Web Vitals) 追加、TC-E2E-09/10 要約追記（Session #15） |
