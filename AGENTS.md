# AGENTS Instructions for kesson-space

## 0. How to Read This Document

**Primary audience**: Claude DT (Claude.ai Desktop / Web chat).
The rules, examples, and workflows below are written from the DT perspective.

**Charter principle**: This governance is LLM-agnostic. It must work with any LLM agent; Codex-specific notes are supplemental adaptations only, not a separate management system.

**Codex startup rule**: If Codex starts from this file, it must read `./README.md` first, then `./docs/README.md`, before any task action.

**For other agents** (Claude Code CLI, OpenAI Codex App/CLI, Gemini MCP, etc.):
Adapt the rules to your own environment. Specifically:

| DT concept | Adapt to your environment |
|---|---|
| "GitHub API経由でPR作成" | Use `git` CLI or your platform's merge mechanism |
| Worktree paths (`/Users/uminomae/dev/...`) | Use your assigned worktree or working directory |
| "目視確認ゲート" | This is the DT's responsibility. Implementation agents push and report; DT handles the gate |
| "セッションキャッシュ" | DT-only. Other agents use Issue comments for state handoff |
| `.claude/rules/project-management-agent.md` | Common governance rulebook. Apply it across LLMs and adapt only environment-specific command details |

**Language policy**: Rules are written in mixed Japanese/English. Section headings and key terms are kept in English for cross-LLM readability. Examples may use Japanese.

**Universal rules** (apply to ALL agents regardless of environment):
- §3: Git and Branch Rules
- §5: Issue-Centric Workflow (especially §5.2 Issue Progress Comments)
- §6: Completion Report format

## 1. Session Start (Mandatory)

At the start of every new conversation in this repository:

1. Read `./README.md`
2. Read `./docs/README.md`
3. Use these two files as the primary context before taking action
4. Run the shared startup routine defined in `./README.md` (Session Start / Step 2.5)

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

- Format: `kesson-{llm}-{app}{N}` (example: `kesson-codex-app1`)
- Branch: task-oriented branch (`feature/*`, `codex/*`, etc.)
- Always verify actual mapping with `git -C /Users/uminomae/dev/kesson-space worktree list`

### 2.2 Current Worktrees

| ワークツリー | パス | ブランチ | 用途 |
|---|---|---|---|
| **main** | `/Users/uminomae/dev/kesson-space` | main | 本番（直接コミット非推奨） |
| DT staging | `/Users/uminomae/dev/kesson-claude-dt-check` | dev（運用上の期待） | 目視確認ゲート・ステージング |
| Codex App 1 | `/Users/uminomae/dev/kesson-codex-app1` | 変動（`feature/*` 等） | Codex App 実装用 |
| Codex App 2 | `/Users/uminomae/dev/kesson-codex-app2` | 変動（`feature/*` 等） | Codex App 実装用 |
| Codex App 3 | `/Users/uminomae/dev/kesson-codex-app3` | 変動（`feature/*` 等） | Codex App 実装用 |
| Codex CLI 1 | `/Users/uminomae/dev/kesson-codex-cli1` | 変動（`feature/*` 等） | Codex CLI 実装用 |
| Codex CLI 2 | `/Users/uminomae/dev/kesson-codex-cli2` | 変動（`feature/*` 等） | Codex CLI 実装用 |
| Codex CLI 3 | `/Users/uminomae/dev/kesson-codex-cli3` | 変動（`feature/*` 等） | Codex CLI 実装用 |

### 2.3 Parallel Worktrees

When working on multiple issues in parallel, each gets its own worktree:

```
kesson-codex-appN / kesson-codex-cliN  →  task branch
```

Each worktree reads its instruction from `docs/codex/INSTRUCTION-{issue#}.md` on the corresponding branch.

Do not cross-commit between worktrees.

## 3. Git and Branch Rules (Mandatory — ALL agents)

### 3.1 Branch flow

```
main (base) → implementation branch → dev (integration test) → PR → main
```

1. Create implementation branches from `main`
2. After implementation, merge to `dev` for integration testing
3. After visual confirmation (DT's responsibility), create PR (`dev` → `main`)
4. PR body must include `Closes #XX` to auto-close the Issue
5. Direct commit/merge to `main` is prohibited

### 3.2 Commit format

Use Conventional Commits only: `fix`, `feat`, `refactor`, `docs`, `test`

## 4. Implementation Rules (Mandatory)

1. CSS policy: prefer Bootstrap, keep custom CSS minimal
2. UX policy: mobile-first, prioritize scroll UX

## 5. Issue-Centric Workflow (Mandatory — ALL agents)

**GitHub Issues are the single source of truth.** `docs/CURRENT.md` and `docs/TODO.md` are deprecated — do not read or update them.

### 5.1 Issue as Source of Truth

- All task creation, priority management, and progress tracking happens in GitHub Issues
- Priority labels: P0 (critical) through P3 (idea)
- `docs/CURRENT.md`, `docs/TODO.md` — deprecated, do not update

### 5.2 Issue Progress Comments (Resident Skill — ALL agents)

**Every agent must record progress as comments on the active Issue.**
This eliminates the need for manual CURRENT.md updates and ensures that any agent — regardless of environment — can read the Issue thread to understand current state.

Record at these timings:
- **Start**: branch name, working directory (if applicable), approach
- **Interim**: progress, problems encountered, direction changes
- **Completion**: changed files, commit SHA, test results, outstanding items

Example (start):
```
🚀 Started
- Branch: `feature/codex-1`
- Approach: add history.scrollRestoration = 'manual' to scroll-coordinator.js
```

Example (completion):
```
✅ Implementation complete
- Commit: `17b2b0a`
- Changed: `index.html`, `src/scroll-coordinator.js`
- Tests: config-consistency 39 passed, node --check pass
- Pushed: origin/feature/codex-1
```

Note: Include worktree path only if relevant to your environment. Cloud-based agents (e.g., Codex App) may omit it.

### 5.3 Issue Close Flow

1. Implementation complete → merge to dev → visual confirmation (DT handles this)
2. Visual confirmation OK → create PR with `Closes #XX` → merge to main
3. Issue auto-closes via PR keyword
4. Optionally add a close comment with confirmation details

Note: Steps 1-2 are orchestrated by DT. Implementation agents complete their work, push, and report via Issue comment. DT handles the dev merge, visual gate, and PR creation.

### 5.4 Cross-Agent Communication

Issue comments serve as the shared communication channel across all agents (DT / Claude Code / Codex / Gemini). Regardless of environment differences, reading the Issue thread reveals current state.

### 5.5 Autonomous Decision Boundary

To maximize autonomous operation, apply the rulebook in `.claude/rules/project-management-agent.md`.

- Auto-decide: issue prioritization, delegation target, branch naming, instruction path
- Ask user first: `dev -> main` merge, scope expansion, dependency changes, label/priority changes
- Stop and ask: conflicting rules, unexpected repository changes, ambiguous acceptance criteria

## 6. Completion Report (ALL agents)

Report completion via **Issue comment (§5.2) and PR body**. No separate report file needed.

PR body should include:
- Implementation summary
- Changed files
- Test results
- `Closes #XX`

## 7. Codex Docs Hub

Codex App operation notes and instruction files:

- `./docs/codex/README.md`
- `./docs/codex/INSTRUCTION-*.md` (per-issue instructions on feature branches)

## 8. Priority Order

If guidance conflicts, follow this order:

1. User's direct request
2. `./README.md`
3. This `AGENTS.md`
4. `./docs/README.md`
5. Other repository docs
