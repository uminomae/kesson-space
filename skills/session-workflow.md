# session-workflow.md — Deprecated

## Status

This file is deprecated and kept only for historical context.
Do not use it as an active workflow source.

## Active Sources (use these instead)

1. `AGENTS.md` (project-wide mandatory rules)
2. `README.md` (highest-priority operational context)
3. `docs/README.md` (docs hub and reading order)
4. `docs/WORKFLOW.md` (session lifecycle)
5. `skills/project-management-agent.md` (autonomy charter and state machine)

## Non-Negotiable Rules

- GitHub Issues are the single source of truth for task and progress management.
- `docs/CURRENT.md` and `docs/TODO.md` are deprecated and must not be used for active tracking.
- Branch flow is `feature/* -> dev -> main`; direct commits to `main` are prohibited.
- After merge to `dev`, wait for visual confirmation before moving to the next task.
- Record progress in Issue comments using Start / Interim / Completion updates.

## Migration Note

Any instruction in older versions of this file that conflicts with the rules above is invalid.
