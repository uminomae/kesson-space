---
id: session-009
title_ja: "Part 9: Creation 導線とカード統合"
title_en: "Part 9: Creation Backlinks and Card Integration"
date_range: "2026-02-24 〜 02-28"
---

## Overview

Polished navigation details while gradually adding a right-side path into creation-space. By the end of the month, the creation cards section from the prototype had been integrated into the main experience, with placeholder and fade behavior refined for the production UI.

## Work Completed

- Added automatic collapse for the mobile nav flow
- Reworked nav links toward relative paths and moved the signature into the footer
- Added right-side creation-space links and backlinks
- Integrated the creation cards section from the prototype
- Tuned placeholder presentation and fade behavior for the cards
- Removed the duplicated arrow from the right-side creation link UI

## Technical Decisions

- Introduced the right-side creation link in small increments to avoid clashing with existing topbar navigation
- Treated prototype integration as both a content port and a behavior pass, so placeholder/fade states also matched the production surface
