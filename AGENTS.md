# AGENTS Instructions for kesson-space

## 0. How to Read This Document

**Primary audience**: Claude DT (Claude.ai Desktop / Web chat).
The rules, examples, and workflows below are written from the DT perspective.

**For other agents** (Claude Code CLI, OpenAI Codex App/CLI, Gemini MCP, etc.):
Adapt the rules to your own environment. Specifically:

| DT concept | Adapt to your environment |
|---|---|
| "GitHub API経由でPR作成" | Use `git` CLI or your platform's merge mechanism |
| Worktree paths (`/Users/uminomae/...`) | Use your assigned worktree or working directory |
| "目視確認ゲート" | This is the DT's responsibility. Implementation agents push and report; DT handles the gate |
| "セッションキャッシュ" | DT-only. Other agents use Issue comments for state handoff |
| `skills/project-management-agent.md` | DT-only skill. Other agents follow instructions received from DT |

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

## 3. Git and Branch Rules (Mandatory — ALL agents)

### 3.1 Branch flow

```
main (base) → implementation branch → feature/dev (integration test) → PR → main
```

1. Create implementation branches from `main`
2. After implementation, merge to `feature/dev` for integration testing
3. After visual confirmation (DT's responsibility), create PR (`feature/dev` → `main`)
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
- Branch: `feature/kesson-codex-app-47`
- Approach: add history.scrollRestoration = 'manual' to scroll-coordinator.js
```

Example (completion):
```
✅ Implementation complete
- Commit: `17b2b0a`
- Changed: `index.html`, `src/scroll-coordinator.js`
- Tests: config-consistency 39 passed, node --check pass
- Pushed: origin/feature/kesson-codex-app-47
```

Note: Include worktree path only if relevant to your environment. Cloud-based agents (e.g., Codex App) may omit it.

### 5.3 Issue Close Flow

1. Implementation complete → merge to feature/dev → visual confirmation (DT handles this)
2. Visual confirmation OK → create PR with `Closes #XX` → merge to main
3. Issue auto-closes via PR keyword
4. Optionally add a close comment with confirmation details

Note: Steps 1-2 are orchestrated by DT. Implementation agents complete their work, push, and report via Issue comment. DT handles the feature/dev merge, visual gate, and PR creation.

### 5.4 Cross-Agent Communication

Issue comments serve as the shared communication channel across all agents (DT / Claude Code / Codex / Gemini). Regardless of environment differences, reading the Issue thread reveals current state.

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
2. This `AGENTS.md`
3. `./README.md` (DT-specific operational rules)
4. `./docs/README.md`
5. Other repository docs
