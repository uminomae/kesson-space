# P003: 背景のdark slate blueグラデーション

**日付**: 2026-02-11
**対象バージョン**: v003 → v004
**結果**: …

---

## Geminiに投げるプロンプト

---

## Context

Project: kesson-space（欠損駆動思考の3Dビジュアライゼーション）
Tech: Three.js 0.160.0, ES Modules (importmap), no build tools
Hosting: GitHub Pages
Local: http://localhost:3001/

### Visual Direction

Reference image prompt:
"Abstract figure on the boundary between form and formlessness,
body contour as Julia set fractal edge,
luminous point at the center of chest,
hands open, holding nothing yet receiving everything,
dark slate blue gradient background,
ethereal and philosophical,
digital art, high contrast"

### Design Principles
- 闇（dark slate blue, not pure black）から光が滲む
- エッジは曖昧、Julia集合的フラクタル
- 呼吸する空間（収縮・拡張・明滅）
- 忍的美学：露骨にしない、秘すれば花
- L0=内受容感覚（空間の呼吸）、L1=光の生成、L2=色（F軸暖色/O軸寒色）、L3=保持（明滅）

### Constraints
- ES Modules + CDN only（no npm, no build）
- Single file: src/main.js
- Must work on GitHub Pages
- Performance: 60fps on mid-range laptop
- Keep code readable

### Output Rules（重要）
- JSコードのみ出力すること（HTMLは変更しない）
- ファイル先頭に `import * as THREE from 'three';` を含めること
- index.htmlから `<script type="module" src="./src/main.js"></script>` で呼び出される前提
- HTMLのDOM構造: `<div id="canvas-container">` と `<div id="overlay"><h1>秘される花</h1></div>` が存在
- HTMLやCSSの変更が必要な場合は、コードとは別に明記すること

## Current Code

(現行のmain.jsをここに貼る)

## Request

### What to change
背景を現在のほぼ黒 (0x050508) から、参照画像のような dark slate blue に変更する。ただし単色ではなく、**光源の近くはわずかに明るく、端は暗い「空間的なグラデーション」**を実現したい。

具体的に:
1. **scene.background** を dark slate blue 系に変更（例: #0f1923 〜 #1a2a3a の範囲）
2. **Fogの色も揃える**（背景と同系色）
3. **背景に微かなグラデーション感**を出すために、フルスクリーンの背景シェーダーを追加（中心がわずかに明るい slate blue、端が暗い dark blue）

### Why
参照画像の背景は純黒ではなく、深い藍鉄色のグラデーション。これが「深み」と「空気感」を生んでいる。現在のほぼ黒の背景は平板に感じる。

### Reference
参照画像の背景色分析:
- 中心部（光源近く）: #2a3a4a あたり（暗いが青みがわかる）
- 中間: #1a2a3a
- 端・四隅: #0a1520 あたり（ほぼ暗黒）
- 全体的に「desaturated navy」のトーン

実装方法のヒント:
- 方法A: フルスクリーンの背景メッシュ（ShaderMaterial）をシーンの最背面に置く
- 方法B: scene.backgroundに色を設定 + Fogでグラデーション感を出す
- 方法Aの方が精度が高いが、Bで十分ならBでOK

### Constraints for this change
- 光（欠損）シェーダーは変更しない
- 水面シェーダーは変更しない
- 粒子・カメラ・配置は変更しない
- パフォーマンスへの影響を最小に

### Output format
- Full file（main.js全文を出力）
- 変更箇所に // CHANGED コメント
