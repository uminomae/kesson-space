---
id: session-010
title_ja: "Part 10: Guides・Viewer・文字サイズ制御"
title_en: "Part 10: Guides, Viewer, and Typography Controls"
date_range: "2026-03-01 〜 03-07"
---

## Overview

Early March moved from refining the Three.js / consciousness card set into a broader refresh of the GUIDES section and viewer flow. The same period also introduced typography tokenization, shared font-size controls, dev-panel integration, and a small config regression fix.

## Work Completed

- Refined consciousness-structure integration, Three.js card ordering, thumbnails, and Read More behavior
- Synced article cards and filled missing English metadata
- Migrated guides to the publications namespace and updated viewer draft/PDF URLs, header-bar links, and button labels
- Added the GUIDES section, markdown modal flow, style alignment, and spacing fixes for guide cards
- Added A-/A/A+ font-size controls, reset behavior, and linkage to the surface button and dev panel
- Tokenized topbar typography, fixed config re-export regression, and improved `?dev` behavior without WebGL

## Technical Decisions

- Consolidated viewer actions into the top-right header bar so PDF and Markdown access live in one place
- Moved typography control toward shared tokens rather than per-component overrides
- Reused the same font-size control model in the dev panel and the public UI so tuning decisions transfer directly into the product
