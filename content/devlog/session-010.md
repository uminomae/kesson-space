---
id: session-010
title_ja: "Part 10: Guides・Viewer・文字サイズ制御"
title_en: "Part 10: Guides, Viewer, and Typography Controls"
date_range: "2026-03-01 〜 03-07"
---

## 概要

3 月前半は Three.js / consciousness カード群の整理から始まり、GUIDES セクションと viewer 導線の刷新へ進んだ。あわせて typography token 化、font-size controls、dev panel 共有設定、config 回帰修正まで含めて UI の可読性と配布構造を更新した。

## 実施内容

- consciousness structure prototype の統合、Three.js cards の並び替え・thumbnail・Read More 導線を改善
- articles card の同期と英語メタデータ補完を実施
- guides を publications namespace に移行し、viewer の draft / pdf URL、header bar、ボタンラベルを更新
- GUIDES セクション、MD modal、カードスタイル統一、余白調整を実装
- A-/A/A+ の font size control、reset、surface/dev-panel 連動を追加
- topbar subtitle / tagline migration、CSS token 化、config re-export 修正、`?dev` の WebGL なし動作を改善

## 技術的決定

- viewer 導線は PDF / MD を右上ヘッダーバーに集約し、閲覧操作を一箇所で完結させた
- typography は個別上書きではなく token 化して、GUIDES / topbar / overlay / footer を共通制御に寄せた
- dev panel の font-size controls を本体 UI と共有し、開発時の調整結果をそのまま体験設計へ反映できるようにした
