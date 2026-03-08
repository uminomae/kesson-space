---
id: session-009
title_ja: "Part 9: Creation 導線とカード統合"
title_en: "Part 9: Creation Backlinks and Card Integration"
date_range: "2026-02-24 〜 02-28"
---

## 概要

ナビゲーションの細部を詰めつつ、creation-space への右側導線を段階的に追加した。月末には prototype 由来の creation cards セクションを本体へ統合し、プレースホルダーや UI fade の見え方も磨き込んだ。

## 実施内容

- mobile nav の自動 collapse を導入
- nav link を相対パス中心に整理し、signature を footer 側へ移動
- right-side link / backlink を追加し、creation-space への移動導線を整備
- prototype の creation cards section を統合
- cards の placeholder と fade behavior を調整
- duplicated right creation link arrow を削除して UI の重複表現を解消

## 技術的決定

- 右側導線は小さな追加で段階導入し、既存 topbar 導線と競合しない構成を選択
- prototype からの移植時は、見た目だけでなく placeholder と fade の挙動も合わせて調整する運用にした
