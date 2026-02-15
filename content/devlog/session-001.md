---
id: session-001
title_ja: "Part 1: 基盤構築"
title_en: "Part 1: Foundation"
date_range: "2026-02-10 〜 02-11"
---

## 概要

リポジトリ作成からシェーダー統合・多言語対応まで、2日間で基盤を構築した。

## 実施内容

- Three.js MVP実装（canvas表示、初期シェーダー）
- モジュール分割: scene.js / controls.js / navigation.js / config.js
- CONCEPTドキュメント作成（理論と視覚表現の対応付け）
- Gemini MCP連携（API key管理、使用量トラッキング）
- 3Dナビゲーション（鬼火オーブ、シーン切替 ?scene=v002）
- v006シェーダー（FBM+Julia境界、Fresnel水面）
- dev-panel: スライドイン式パラメータ調整UI
- 多言語対応（?lang=en トグル、タグラインアニメーション）

## 技術的決定

- OrbitControlsを導入（後にPart 2で撤廃）
- 重力レンズオーブを実験後revert — 視覚ノイズ過多のため
- Gemini MCPでシェーダー生成、Claudeで構造設計の分業体制を確立
