# Refactoring Plan (Codex App Worktree)

## 目的

- 機能回帰を出さずに、段階的に保守性を上げる
- 既存ルール（Bootstrap優先、モバイルファースト、feature/dev経由）を維持する
- テスト可能な単位に分割し、変更の安全性を上げる

## 現状レビュー（初期）

### P1: 先に直すべき不整合

1. `src/config.js` の `DEV_TOGGLES` に `liquid` が重複している  
   - 参照: `src/config.js:191`, `src/config.js:202`, `src/config.js:207`
2. `tests/config-consistency.test.js` が旧構造前提で失敗する  
   - 現在の実行結果: `11 failed`
   - 参照: `tests/config-consistency.test.js:90`, `tests/config-consistency.test.js:92`
3. `src/dev-panel.js` に未使用 import が残っている  
   - 参照: `src/dev-panel.js:6`

### P2: 中期で整理したい構造

1. `src/config.js` が巨大化（582行）し、設定定義と適用レジストリが混在
2. `src/nav-objects.js` が mutable state を広く持ち、責務境界が曖昧（487行）
3. `src/styles/main.css` が単一ファイル集中（1123行）
4. `tests/config-consistency.test.js` が文字列検索主体で、実装変更に脆弱

## フェーズ計画

## Phase 0: ベースライン固定

- 実施:
  - 現行テストを実行し失敗を記録
  - 影響範囲の大きいファイルの行数と依存を棚卸し
- 完了条件:
  - 本ドキュメントに初期レビューが記録済み

## Phase 1: Safety First（短時間で安全性回復）

- 対象:
  - `src/config.js`
  - `src/dev-panel.js`
  - `tests/config-consistency.test.js`
- 実施:
  - `DEV_TOGGLES` の重複キー解消
  - 未使用 import の削除
  - テストを「`dev-panel.js` 直参照」から「`config.js` の `DEV_SECTIONS` / `DEV_PARAM_REGISTRY` 検証」に更新
- 完了条件:
  - `node tests/config-consistency.test.js` が通る

## Phase 2: Config 分割（T-016/T-017に直結）

- 対象:
  - `src/config.js`
  - `src/main/dev-apply.js`
  - `src/dev-panel.js`
- 実施:
  - `src/config/` 配下へ分割
    - `params.js`（scene/fluid/liquid/distortion/gem/xLogo/vortex）
    - `dev-sections.js`（UI定義）
    - `dev-registry.js`（適用レジストリ）
    - `toggles.js`
  - 既存 import 互換のため `src/config.js` は barrel にする
- 完了条件:
  - 振る舞い変更なしで差分レビュー可能
  - `config.js` の巨大化が解消される

## Phase 3: Navigation 分割（T-021継続）

- 対象:
  - `src/nav-objects.js`
  - `src/nav/*.js`
  - `src/navigation.js`
- 実施:
  - Xロゴ生成/更新を専用モジュール化
  - gem/nav orb ラベル管理を state オブジェクトに集約
  - module-level global を段階的に縮小
- 完了条件:
  - `src/nav-objects.js` の責務が「統合オーケストレーション」のみに近づく

## Phase 4: CSS 構造化（T-018継続）

- 対象:
  - `src/styles/main.css`
  - `index.html`
- 実施:
  - `src/styles/` に分割（例: `base.css`, `overlay.css`, `viewer.css`, `dev-panel.css`, `sections.css`）
  - `:root` 変数をトークンとして整理し、重複値を削減
- 完了条件:
  - ファイル単位で責務が説明可能
  - スクロールUXとモバイル表示に回帰なし

## Phase 5: 検証強化

- 対象:
  - `tests/config-consistency.test.js`
  - `tests/e2e-runner.js`
- 実施:
  - テスト観点を「文字列一致」から「データ構造整合性」に寄せる
  - 最低限の回帰シナリオを追加（nav label focus, articles offcanvas filter）
- 完了条件:
  - リファクタで壊れやすい箇所に自動検知が入る

## 実行順（推奨）

1. Phase 1（安全性回復）
2. Phase 2（config分割）
3. Phase 3（navigation分割）
4. Phase 4（CSS分割）
5. Phase 5（検証強化）

## 直近の着手候補（次アクション）

1. Phase 1を実装してテストを緑化
2. その結果を小さくコミット（`refactor:` + `test:` で分割）

## 進捗（2026-02-17）

- Phase 1 実施済み:
  - `DEV_TOGGLES` の重複 `liquid` を解消
  - `src/dev-panel.js` の未使用 import を削除
  - `tests/config-consistency.test.js` を新構造に更新
  - `src/dom-utils.js` を削除（未使用）
  - テスト結果: `39 passed, 0 failed`
- Phase 2 一部実施済み:
  - `src/config/` に `params.js`, `dev-ui.js`, `dev-registry.js`, `index.js` を追加
  - `src/config.js` は互換バレル化
