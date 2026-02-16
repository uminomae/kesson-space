# AGENTS Instructions for /Users/uminomae/dev/kesson-main

## Session Start Rule (Codex App)

At the start of every new conversation in this repository, do the following first:

1. Read `./README.md`
2. Read `./docs/README.md`
3. Use these two files as the primary reference for project context and workflow

## Priority

If guidance conflicts, use this order:

1. User's direct request
2. `./README.md`
3. `./docs/README.md`
4. Other repository docs

## Development Rules

1. Branch strategy: implementation branch -> `feature/dev` -> `main`
2. Direct commit or merge to `main` is prohibited
3. Prefer Bootstrap for CSS; keep custom CSS to a minimum
4. Mobile-first development; prioritize scroll UX
5. Commit messages must follow Conventional Commits (`fix`, `feat`, `refactor`, `docs`)
6. After work is completed, close the related GitHub Issue with a confirmation comment
7. During code review, flag only `P0` and `P1` findings

## Codex App Workspace Docs

Use this location as the document hub for Codex App workspace operations:

- `./docs/codex/README.md`

Naming convention reference:

1. Worktree name: `kesson-{llm}-{app}-{suffix}`
2. Branch name example: `feature/kesson-codex-app`
3. Local path example: `<dev-root>/kesson-codex-app`
