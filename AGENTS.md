# AGENTS Instructions for /Users/uminomae/dev/kesson-codex-app

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

## 2. Fixed Worktree Rule (Mandatory)

Always use the same Codex App worktree for this project:

- Worktree path: `/Users/uminomae/dev/kesson-codex-app`

Do not switch execution target to other local worktrees unless the user explicitly requests it.

## 3. Git and Branch Rules (Mandatory)

### 3.1 Branch flow

1. Implementation branch -> `feature/dev` -> `main`
2. Direct commit/merge to `main` is prohibited

### 3.2 Naming

1. Naming convention: `kesson-{llm}-{app}-{suffix}`
2. Worktree name: `kesson-codex-app`
3. Working branch baseline: `feature/kesson-codex-app`
4. Local path format example: `<dev-root>/kesson-codex-app`

### 3.3 Commit format

Use Conventional Commits only: `fix`, `feat`, `refactor`, `docs`

## 4. Implementation Rules (Mandatory)

1. CSS policy: prefer Bootstrap, keep custom CSS minimal
2. UX policy: mobile-first, prioritize scroll UX

## 5. Review and Issue Rules (Mandatory)

1. Code review: flag only `P0` and `P1` findings
2. After completing a task, close the related GitHub Issue with a confirmation comment

## 6. Codex Docs Hub

Codex App operation notes:

- `./docs/codex/README.md`

## 7. Priority Order

If guidance conflicts, follow this order:

1. User's direct request
2. This `AGENTS.md`
3. `./README.md`
4. `./docs/README.md`
5. Other repository docs
