---
id: session-006
title_ja: "Part 6: オフキャンバス拡張と X ロゴ導入"
title_en: "Part 6: Offcanvas Expansion and X Logo Introduction"
date_range: "2026-02-16 〜 02-17"
---

## 概要

Articles の Read More 導線と devlog 背景表現を拡張し、X ロゴ 3D ナビゲーションの導入を進めた。あわせて scroll coordinator、言語切替、deeplink の扱いを整理し、GitHub Pages 配信用の self-host 構成と Issue 中心運用へ移行した。

## 実施内容

- Articles Read More を Offcanvas 化し、重複記事や 3 列表示、見出し/余白を段階的に調整
- devlog に Three.js 背景を追加し、設定の集約や Bootstrap 標準カード化を実施
- X ロゴの固定シーン、Blender モデル読込、X timeline 埋め込み、位置/サイズ調整を追加
- `scroll-coordinator` を中心に、言語切替時の no-reload 化、scroll restoration、offcanvas 戻り位置、deeplink 開閉を整理
- `three` の self-host 化、config 分割、main/nav オブジェクト分割、Keyboard nav 修正を進行
- ドキュメントは `main -> dev -> main` の運用、Issue-Centric 管理、worktree ルールへ更新

## 技術的決定

- Offcanvas と詳細表示の責務を分離し、スクロール状態は coordinator に集約
- 外部 CDN 依存を減らすため、配信用の `three` モジュールを vendoring して import map を self-host に切り替え
- タスク管理の正本を GitHub Issues / comments / PR に一本化した
