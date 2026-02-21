# kesson-codex-app Document Hub (Legacy)

Codex App ワークツリー向けの書類置き場（主に過去Issueの履歴）。

> 注意: このディレクトリには過去Issue向けの指示書も含まれる。現行のプロジェクト管理正本は `AGENTS.md` と `skills/project-management-agent.md`。

## Naming Convention

- Worktree name: `kesson-{llm}-{app}-{suffix}`
- Branch name: `feature/{worktree-name}`
- Local path: `<dev-root>/{worktree-name}`

Example:
```
kesson-codex-app-test36  →  feature/kesson-codex-app-test36
kesson-codex-app-liquid38  →  feature/kesson-codex-app-liquid38
```

## Instruction Files

Issue単位の実装指示書を `INSTRUCTION-{issue#}.md` として配置する。
各指示書は対応する feature ブランチにのみ存在する。

| ファイル | ブランチ | Issue |
|---------|---------|-------|
| INSTRUCTION-34.md | feature/kesson-codex-app-toggle34 | #34 トグル復帰 |
| INSTRUCTION-36.md | feature/kesson-codex-app-test36 | #36 config re-export テスト |
| INSTRUCTION-38.md | feature/kesson-codex-app-liquid38 | #38 liquid.js ping-pong |

## What to Store Here

- Codex App 向けの実装指示書（INSTRUCTION-*.md）
- リファクタリング計画
- レビュー観点や未解決事項

## Plans

- [REFRACTORING-PLAN.md](./REFRACTORING-PLAN.md) - 段階的リファクタリング計画

## Related Rules

- Branch strategy: implementation branch → `dev` → `main`
- No direct commit/merge to `main`
- Commit message format: Conventional Commits (`fix`, `feat`, `refactor`, `docs`, `test`)
- Task management: GitHub Issues are the source of truth
- Session-start routine (Codex/Claude common): follow root `README.md` Session Start steps
