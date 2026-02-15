---
id: session-005
title_ja: "Part 5: Read More UI"
title_en: "Part 5: Read More UI"
date_range: "2026-02-15"
---

## 概要

Devlogギャラリーの大規模リファクタリングを実施。Three.js 3DカードからBootstrapカードへ移行し、Read More UIからOffcanvas＋無限スクロール方式へ進化させた。

## 実装内容

### ギャラリー基盤の刷新
- Three.js 3DカードをBootstrap HTMLカード（3列レスポンシブ）に置き換え
- 18セッションを3パートに統合し、レポート形式で書き直し
- セッション詳細をBootstrap Modalで表示、Markdown（marked.js）パース対応
- カバー画像クリックでライトボックス拡大表示（Bootstrap Modal）

### Read More → Offcanvas + 無限スクロール
- 初期表示を3件カードに限定、Read Moreボタンで全件表示
- Read More/Show Less → Bootstrap Offcanvas（右85%スライドイン）に変更
- 無限スクロール（10件/バッチ）で段階的読み込み
- animations.js簡略化（Bootstrap自動アニメーションに委譲）

### UIスペーシング調整
- devlogヘッダー〜ギャラリー間の余白を段階的に最適化（5回の微調整コミット）
- hero-spacerを125vhに縮小しdevlogの早期可視化を実現
- devlogタイトルの固定表示をスクロール連動に修正（IntersectionObserver）

### テスト・品質
- TC-E2E-12: sessions.json ↔ .md ファイル整合性チェックを追加
- TC-E2E-04/05: devパネル・言語切替のE2Eテスト拡充
- T-035: Markdownパース不具合の修正（marked.parse呼び出し欠如）
- T-036: devlog日時表示に年を追加

### CI/インフラ
- GitHub Actions devlog.ymlのインラインPythonをscripts/generate-sessions.pyに分離
- CI自動トリガーを一時無効化（本番データ破壊の緊急対応）
- sessions.jsonにendフィールド追加、end降順ソート実装

### ドキュメント・運用
- エージェント協調ルール v1.0策定（agent-orchestration.md）
- devlog-writing / infographic-generation スキル定義
- README.mdに監督構造セクション新設

## 技術的なポイント

- Three.js → Bootstrap移行の判断: 3Dカードは視覚的に魅力的だが、レスポンシブ対応・テキスト可読性・保守性でBootstrapカードが優位。将来セッション数が増えても無限スクロールで対応可能
- CI自動生成 vs 手動管理: generate-sessions.pyが本番のsessions.json（手動キュレーション版）を上書きするインシデントが発生。paths-ignoreとauto-trigger無効化で対処
- Offcanvasの幅85%設計: Three.jsキャンバスを左15%に残すことで、3D表現との共存を維持

## 次のステップ

- session-004/005のカバー画像生成
- Offcanvasのモバイル対応検証（幅100%フォールバック）
- sessions.jsonの手動/自動管理の運用フロー確定
