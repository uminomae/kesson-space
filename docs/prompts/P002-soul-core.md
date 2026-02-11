# P002: 魂のコア光

**日付**: 2026-02-11
**対象バージョン**: v002 → v003
**結果**: …

---

## Geminiに投げるプロンプト

以下をそのままGeminiに貼り付けてください。

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
光（欠損）のfragmentShaderを改修し、「魂のコア」のような光を実現する。

参照画像の「胸の光点」の質感に近づける：
1. **中心に強い白い光点**（現在のvoidHoleは中心を空洞化しているが、逆に中心を最も明るくする）
2. **光の周囲にソフトなハロー（グロー）**が広がる（白→淡い青白→闇に溶ける）
3. **周辺部のDomain Warpingは維持**（フラクタル的な輪郭、煙のようなエッジ）

イメージ：「闇の中に浮かぶ魂の光。中心は純粋な白、その周りを青白いオーラが包み、エッジは煙のように揺らいで闇に溶ける」

### Why
現在のシェーダーは有機的で良いが、voidHoleが中心を空洞化しているため、参照画像の「胸の中心に光る魂」とは真逆の表現になっている。

欠損（kesson）は「欠け」だが、その欠けの中心には「問い」という光がある。空洞ではなく、光源。

### Reference
参照画像の胸の光点の特徴:
- 中心: 純白 (1.0, 1.0, 1.0)
- 中間リング: 淡い青白 (0.7, 0.85, 1.0)
- 外側: 指定色(uColor)にブレンドして消える
- グロー半径: 光体全体の1/3くらい
- 減衰: inverse square的に急激に落ちる

### Constraints for this change
- fragmentShaderのみ変更（vertexShader, uniforms構造, JSロジックは維持）
- Domain Warpingのループはそのまま残す
- Additive blendingは維持
- 光の40個の配置・動きはそのまま

### Output format
- Full file（main.js全文を出力）
- 変更箇所に // CHANGED コメント
