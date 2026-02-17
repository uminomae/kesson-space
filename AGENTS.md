# AGENTS Instructions for kesson-space

## 1. Session Start (Mandatory)

At the start of every new conversation in this repository:

1. Read `./README.md`
2. Read `./docs/README.md`
3. Use these two files as the primary context before taking action

### 1.1 Claude Docs Reference Rule (Memory-Aware)

Refer to Claude-oriented docs under `./docs/` as much as memory allows.

Priority order:

1. `./CLAUDE.md`
2. `./docs/AGENT-RULES.md`
3. `./docs/CLAUDE-CODE-QC.md`
4. `./docs/WORKFLOW.md`
5. `./docs/ENVIRONMENT.md`

Loading policy:

1. Start from headings/required sections only
2. Expand to full sections only when needed for the active task
3. Avoid bulk-loading unrelated long docs in one pass

## 2. Worktree Rules (Mandatory)

### 2.1 Naming Convention

- Format: `kesson-{llm}-{app}-{suffix}`
- Branch: `feature/{worktree-name}`
- Example: worktree `kesson-codex-app-test36` → branch `feature/kesson-codex-app-test36`

### 2.2 Default Worktree

Default Codex worktree: `/Users/uminomae/dev/kesson-codex-app`

### 2.3 Parallel Worktrees

When working on multiple issues in parallel, each gets its own worktree:

```
kesson-codex-app-{suffix}  →  feature/kesson-codex-app-{suffix}
```

Each worktree reads its instruction from `docs/codex/INSTRUCTION-{issue#}.md` on the corresponding branch.

Do not cross-commit between worktrees.

## 3. Git and Branch Rules (Mandatory)

### 3.1 Branch flow

1. Implementation branch → `feature/dev` → `main`
2. Direct commit/merge to `main` is prohibited
3. Visual confirmation required before `feature/dev` → `main`

### 3.2 Commit format

Use Conventional Commits only: `fix`, `feat`, `refactor`, `docs`, `test`

## 4. Implementation Rules (Mandatory)

1. CSS policy: prefer Bootstrap, keep custom CSS minimal
2. UX policy: mobile-first, prioritize scroll UX

## 5. Review and Issue Rules (Mandatory)

1. Code review: flag `P0` and `P1` findings
2. After completing a task, close the related GitHub Issue with a confirmation comment
3. Task management: GitHub Issues are the source of truth (TODO.md is deprecated)

## 6. Completion Report Format (Mandatory)

Codex / Claude Code / その他委譲先エージェントの完了報告は、以下の形式で統一する。
DT への報告時、およびユーザーが代理報告する場合も同様。

```
## 完了報告: #{issue番号} {タイトル}

### 環境
- Issue: #{番号}
- ワークツリー: {パス}
- ブランチ: {ブランチ名}

### 実施内容
- 変更ファイル: {ファイルパス一覧}
- コミット: {SHA (short)} / ❌ 未コミット（理由）
- メッセージ: {コミットメッセージ}
- Push: ✅ origin/{ブランチ名} / ❌ 未Push（理由）

### 検証
- {テスト名}: {passed/failed 件数}
- 構文チェック: ✅ / ❌
- ブラウザ目視: ✅ / ❌ / 未実施（理由）
- GL error: ✅なし / ❌あり / 未確認

### Issue
- クローズ: ✅ (コメントURL) / ❌ 未クローズ（理由）

### 未実施事項（あれば）
- {未実施内容と理由}
```

### ルール

1. 全フィールド必須。該当なしの場合は「N/A」と記載
2. テスト結果は passed/failed の数値を必ず含める
3. 未実施事項がある場合は理由を明記
4. コミットSHAは short hash (7文字) で記載
5. Push先は `origin/{ブランチ名}` の形式で明記

### 記入例

```
## 完了報告: #36 config re-exportテスト追加

### 環境
- Issue: #36
- ワークツリー: /Users/uminomae/dev/kesson-codex-app-test36
- ブランチ: feature/kesson-codex-app-test36

### 実施内容
- 変更ファイル: tests/config-exports.test.js (新規)
- コミット: 27f44d3
- メッセージ: test: add runtime import verification for config re-export chain (#36)
- Push: ✅ origin/feature/kesson-codex-app-test36

### 検証
- config-exports.test.js: 34 passed, 0 failed
- config-consistency.test.js: 39 passed, 0 failed
- 構文チェック: ✅
- ブラウザ目視: N/A（テストのみ）
- GL error: N/A

### Issue
- クローズ: ✅ (issuecomment-3911125059)

### 未実施事項
- なし
```

## 7. Codex Docs Hub

Codex App operation notes and instruction files:

- `./docs/codex/README.md`
- `./docs/codex/INSTRUCTION-*.md` (per-issue instructions on feature branches)

## 8. Priority Order

If guidance conflicts, follow this order:

1. User's direct request
2. This `AGENTS.md`
3. `./README.md`
4. `./docs/README.md`
5. Other repository docs
