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

## 6. Codex Docs Hub

Codex App operation notes and instruction files:

- `./docs/codex/README.md`
- `./docs/codex/INSTRUCTION-*.md` (per-issue instructions on feature branches)

## 7. Priority Order

If guidance conflicts, follow this order:

1. User's direct request
2. This `AGENTS.md`
3. `./README.md`
4. `./docs/README.md`
5. Other repository docs
