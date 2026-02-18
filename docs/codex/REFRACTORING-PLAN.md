# Refactoring Plan (Codex App Worktree)

## 目的

- 機能回帰を出さずに、段階的に保守性を上げる
- 既存ルール（Bootstrap優先、モバイルファースト、dev経由）を維持する
- テスト可能な単位に分割し、変更の安全性を上げる

## フェーズ進捗（2026-02-17）

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 0 | ベースライン固定 | ✅ 完了 |
| Phase 1 | Safety First（重複解消・テスト緑化） | ✅ 完了 |
| Phase 2 | Config 分割 | ✅ 完了（config/ に params.js, dev-ui.js, dev-registry.js, index.js） |
| Phase 3 | Navigation 分割 | 未着手 |
| Phase 4 | CSS 構造化 | 未着手 |
| Phase 5 | 検証強化 | 一部進行中（#36 で runtime import テスト追加中） |

## 現在のアクティブ Issue（リファクタ関連）

| Issue | 内容 | Phase との関連 |
|-------|------|---------------|
| #36 | config re-export ランタイム検証テスト | Phase 5 の先行実施 |
| #38 | liquid.js ping-pong（WebGL未定義動作） | Phase外（バグ修正） |
| #34 | トグル uniform 復帰 | Phase外（バグ修正） |
| #35 | import map self-host | Phase外（インフラ改善） |
| #37 | innerHTML 未サニタイズ | Phase外（セキュリティ改善） |

## Phase 1 実施内容（完了）

- `DEV_TOGGLES` の重複 `liquid` を解消
- `src/dev-panel.js` の未使用 import を削除
- `tests/config-consistency.test.js` を新構造に更新
- `src/dom-utils.js` を削除（未使用）
- テスト結果: `39 passed, 0 failed`

## Phase 2 実施内容（完了）

- `src/config/` に `params.js`, `dev-ui.js`, `dev-registry.js`, `index.js` を追加
- `src/config.js` は互換バレル化（re-export）
- CDN を jsdelivr → unpkg に切替（jsdelivr 障害対応）

## 未着手 Phase 概要

### Phase 3: Navigation 分割
- `src/nav-objects.js`（15KB）の責務分離: Xロゴ / gem / nav orb ラベル
- module-level global を段階的に縮小

### Phase 4: CSS 構造化
- `src/styles/main.css` の分割
- `:root` 変数のトークン整理

### Phase 5: 検証強化
- テスト観点を「文字列一致」→「データ構造整合性」に移行
- #36 が先行実施中

## 参照

- タスク管理: [GitHub Issues](https://github.com/uminomae/kesson-space/issues)
- ブランチ戦略: implementation branch → `dev` → `main`
