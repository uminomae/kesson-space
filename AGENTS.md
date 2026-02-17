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

```
main（起点）→ 実装ブランチ → feature/dev（統合テスト）→ PR → main
```

1. 実装ブランチは `main` から作成する
2. 実装完了後、`feature/dev` にマージして統合テスト
3. 目視確認OK後、PR を作成（`feature/dev` → `main`）
4. PR body に `Closes #XX` を含めて Issue を自動クローズ
5. Direct commit/merge to `main` is prohibited

### 3.2 Commit format

Use Conventional Commits only: `fix`, `feat`, `refactor`, `docs`, `test`

## 4. Implementation Rules (Mandatory)

1. CSS policy: prefer Bootstrap, keep custom CSS minimal
2. UX policy: mobile-first, prioritize scroll UX

## 5. Issue-Centric Workflow (Mandatory)

**GitHub Issues が唯一の正本。** CURRENT.md / TODO.md は廃止済み。

### 5.1 Issue as Source of Truth

- タスクの起票・優先度管理・進捗追跡は全て GitHub Issues で行う
- ラベル P0〜P3 で優先度管理
- `docs/CURRENT.md`, `docs/TODO.md` は更新しない（廃止済み）

### 5.2 Issue Progress Comments（常駐スキル）

**全エージェントは作業中の Issue に進捗をコメントとして細かく記録する。**
これにより CURRENT.md の手動更新が不要になり、AI環境差があっても Issue スレッドを読めば現在の状態が分かる。

記録タイミング:
- **着手時**: ブランチ名、ワークツリーパス、作業方針
- **中間報告**: 実装の進捗、発生した問題、方針変更
- **完了時**: 変更ファイル一覧、コミットSHA、テスト結果、未実施事項

コメント例（着手時）:
```
🚀 着手
- ブランチ: `feature/kesson-codex-app-47`
- WT: `/Users/uminomae/dev/kesson-codex-app-47`
- 方針: scroll-coordinator.js に history.scrollRestoration = 'manual' を追加
```

コメント例（完了時）:
```
✅ 実装完了
- コミット: `17b2b0a`
- 変更: `index.html`, `src/scroll-coordinator.js`
- テスト: config-consistency 39 passed, node --check pass
- Push: origin/feature/kesson-codex-app-47
```

### 5.3 Issue Close Flow

1. 実装完了 → feature/dev マージ → 目視確認
2. 目視確認 OK → PR 作成（`Closes #XX` 付き）→ main マージ
3. Issue 自動クローズ（PR keyword で）
4. 必要に応じてクローズコメントに確認内容を追記

### 5.4 AI 環境差への対応

Issue コメントは全エージェント（DT / Claude Code / Codex / Gemini）の共通コミュニケーションチャネルとして機能する。エージェント間で環境差があっても、Issue スレッドを読めば現在の状態が分かる。

## 6. Completion Report

完了報告は **Issue コメント（§5.2）と PR body** で行う。
専用フォーマットファイルは不要。

PR body に含めるもの:
- 実装概要
- 変更ファイル一覧
- テスト結果
- `Closes #XX`

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
