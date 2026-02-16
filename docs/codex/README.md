# kesson-codex-app Document Hub

Codex App ワークツリー向けの書類置き場。

## Naming Convention

- Worktree name: `kesson-{llm}-{app}-{suffix}`
- Branch name (example): `feature/kesson-codex-app`
- Local path (example): `<dev-root>/kesson-codex-app`

## What to Store Here

- Codex App 向けの作業メモ
- 実装指示書・実施ログ
- レビュー観点や未解決事項

## Active Plans

- [REFRACTORING-PLAN.md](./REFRACTORING-PLAN.md) - 段階的リファクタリング計画と現状レビュー

## Related Rules

- Branch strategy: implementation branch -> `feature/dev` -> `main`
- No direct commit/merge to `main`
- Commit message format: Conventional Commits (`fix`, `feat`, `refactor`, `docs`)
