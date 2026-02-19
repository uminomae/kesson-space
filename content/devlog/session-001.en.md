---
id: session-001
title_ja: "Part 1: 基盤構築"
title_en: "Part 1: Foundation"
date_range: "2026-02-10 〜 02-11"
---

## Overview

Over two days, the team built the initial foundation from repository setup to shader integration and bilingual support.

## Work Completed

- Implemented a Three.js MVP (canvas rendering and initial shader)
- Split modules into `scene.js`, `controls.js`, `navigation.js`, and `config.js`
- Wrote the `CONCEPT` document to map theory to visual expression
- Connected Gemini MCP (API key handling and usage tracking)
- Built 3D navigation (orb labels and scene switching via `?scene=v002`)
- Added v006 shader (FBM + Julia boundary, Fresnel water surface)
- Added a slide-in `dev-panel` for parameter tuning
- Added language switching (`?lang=en`) and animated taglines

## Technical Decisions

- Adopted `OrbitControls` at first (later removed in Part 2)
- Reverted the gravitational-lens orb experiment because visual noise became too strong
- Established a split workflow: Gemini MCP for shader generation, Claude for structure/design
