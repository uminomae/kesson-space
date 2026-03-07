---
id: session-006
title_ja: "Part 6: オフキャンバス拡張と X ロゴ導入"
title_en: "Part 6: Offcanvas Expansion and X Logo Introduction"
date_range: "2026-02-16 〜 02-17"
---

## Overview

Expanded the Articles Read More flow and the Devlog background presentation while introducing the X-logo 3D navigation object. In parallel, the project consolidated scroll coordination, no-reload language switching, deeplink handling, self-hosted Three.js delivery, and the Issue-centric workflow.

## Work Completed

- Moved Articles Read More into Offcanvas and iterated on duplicate removal, 3-column layout, and heading spacing
- Added a Three.js background to Devlog and refactored the configuration into a more centralized structure
- Introduced the fixed X-logo scene, Blender model loading, X timeline modal/embed flow, and repeated position/scale tuning
- Consolidated scroll restoration, offcanvas return state, and deeplink behavior around `scroll-coordinator`
- Switched `three` delivery to a self-hosted import-map setup and continued the main/config/nav module split
- Updated governance docs toward `main -> dev -> main`, worktree discipline, and GitHub Issue-based progress tracking

## Technical Decisions

- Centralized scroll state in the coordinator instead of scattering restoration logic across features
- Reduced runtime CDN dependence by vendoring `three` for Pages delivery
- Treated GitHub Issues, comments, and PRs as the single source of truth for task progress
