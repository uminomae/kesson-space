# PROMPT-STRUCTURE.md — Three.js 微修正プロンプト設計

**対象**: kesson-space / src/main.js
**用途**: LLM（主にGemini）にThree.jsコードの微修正を依頼する際のテンプレート
**役割分担**: Claude=プロンプト設計・管理、Gemini=コード実装、User=判定

---

## 1. コンテキストブロック（毎回貼る固定部分）

```
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
- Keep code readable（magic number → named constant preferred）

### Output Rules（重要）
- JSコードのみ出力すること（HTMLは変更しない）
- ファイル先頭に `import * as THREE from 'three';` を含めること
- index.htmlから `<script type="module" src="./src/main.js"></script>` で呼び出される前提
- HTMLのDOM構造: `<div id="canvas-container">` と `<div id="overlay"><h1>秘される花</h1></div>` が存在
- HTMLやCSSの変更が必要な場合は、コードとは別に明記すること
```

---

## 2. 現行コードブロック

```
## Current Code

<main.js の全文をここに貼る>
```

修正対象のセクションだけ貼る場合は `// ... (省略)` で明示する。

---

## 3. リクエストブロック（毎回変わる部分）

```
## Request

### What to change
（何を変えたいか。1〜3点に絞る）

### Why
（なぜ変えたいか）

### Reference
（参考があれば）

### Constraints for this change
（この変更固有の制約）

### Output format
- Full file（main.js全文を出力）
- 変更箇所に // CHANGED コメント
```

---

## 4. レイヤー別パラメータマップ

| Layer | 概念 | 対応コード | 主要パラメータ |
|-------|------|-----------|---------------|
| **背景** | 闇 | `scene.background`, `scene.fog` | 色, fog density |
| **L0** | 内受容感覚 | `camera.fov` 呼吸, `particles` | FOV振幅, 粒子数/サイズ/色/opacity |
| **L1** | 光の生成 | `kessonMaterial` fragmentShader | Domain Warping amplitude/反復数, core強度 |
| **L2** | F-O評価 | `warmColors[]`, `coolColors[]` | 色パレット |
| **L3** | 保持 | `breath` in shader | 明滅速度, 振幅 |
| **水面** | 縁 | `waterMaterial` shaders | 波の振幅/速度, 透明度, 端フェード |
| **配置** | 空間構成 | `mesh.position.set(...)` | 分布範囲, 数, サイズ |
| **カメラ** | 意識の視点 | `camera.position`, `lookAt` | 高さ, 角度, 視差係数 |
| **動き** | 漂い | `animate()` 内 | 速度, 振幅, 軌道 |

---

## 5. 品質チェック

- [ ] 動作: エラーなく60fpsか
- [ ] コンセプト整合: CONCEPT.mdと矛盾しないか
- [ ] 忍的美学: やりすぎていないか
- [ ] 参照画像との距離: 近づいたか
- [ ] コード品質: readableか
- [ ] パフォーマンス: 不要な計算がないか
