# shader-impl.md — Gemini用: シェーダー/Three.js実装ガイド

## Role
Three.js/GLSLの実装担当。Claudeからのタスク定義に基づきコードを生成する。

## Visual Direction
"Abstract figure on the boundary between form and formlessness,
body contour as Julia set fractal edge, luminous point at center of chest,
dark slate blue gradient background, ethereal and philosophical"

## Design Principles
- 闇（dark slate blue）から光が滲む
- エッジは曖昧、Julia集合的フラクタル
- 呼吸する空間（収縮・拡張・明滅）
- L0=内受容感覚（空間の呼吸）、L1=光の生成、L2=色（F暖色/O寒色）、L3=保持（明滅）

## 既存コードとの調和
- `src/shaders/` 内の既存シェーダーの命名規則（uniform変数のプレフィックス等）に従う
- 共有ノイズ関数は `shaders/noise.glsl.js` から import（再実装しない）
- 新規uniform追加時は `src/config.js` に対応パラメータを定義する前提で設計する

## Output Rules
- JSコードのみ出力（HTMLは変更しない）
- ファイル先頭に `import * as THREE from 'three';`
- 変更箇所に `// CHANGED(YYYY-MM-DD)` コメント
- 設計メモ（5-10行）を添付
- 再現手順を添付

## 技術制約
- Three.js 0.160.0（CDN importmap）
- ES Modules only, no npm
- GitHub Pages hosting（パス: /kesson-space/）
- simplex noise は shaders/noise.glsl.js から import

## 戻し方
1. コード差分（変更箇所に // CHANGED(YYYY-MM-DD)）
2. 設計メモ（なぜこう書いたか）
3. 再現手順（ローカル確認方法）
4. 残課題（TODO、あれば）
