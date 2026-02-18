# 修正指示書: #73 量子場シェーダー v2 — 流線フィールド + リキッドグラデーション

## 環境判別
`skills/env-adaptive.md` §2 に従い環境を判定すること。

## Issue
https://github.com/uminomae/kesson-space/issues/73

## 作業ブランチ
- 作業: `feature/kesson-codex-app-quantum73`（既存ブランチに追加コミット）

## 背景
初版のシェーダーは目視確認の結果 **NG** 。
- ❌ sin 干渉のビーム帯 → ソリッドすぎる
- ❌ グリッドパーティクル → 機械的
- ✅ 求めるもの: **確率分布のような流線 + リキッド的な透明グラデーション**

## リファレンス画像の特徴（必ず再現すること）

### 左側 — 波動関数領域
- 複数本（8〜12本）の **流線** が個別にカーブしている
- 各流線は **ガウシアン包絡線で振幅変調された sin 波** のパス
- 左端で広がり、中央スリットに向かって収束する
- **線そのものではなく**、流線パスからの距離場（`exp(-d²/σ²)`）でソフトなフォールオフ
- 流線同士の重なりで密度が自然に高まる → リキッド的な濃淡

### 中央 — スリット壁
- 薄い縦線。現状のまま可

### スリット右 — 波束展開
- スリット通過点を中心とした **同心楕円の波紋リング**（2〜3重）
- リングも距離場のソフトフォールオフで描画
- 中心に白い発光球体（`exp(-length(p)²)` 型のソフトオーブ）

### 右端 — 粒子状態
- 明確な白い光球 2〜3 個（ソフトオーブ）
- 水平ビームは細いフォールオフ線
- グリッドパーティクルは **廃止**

### 全体のトーン
- 色: シアン `(0.2, 0.8, 1.0)` ベース、光球コアのみ白
- 透明感: `AdditiveBlending` + 薄いアルファ → 重なりで密度を出す
- リキッド感: ソフトフォールオフの幅（σ）を広めにして流体的に

## 技術仕様 — GLSLフラグメントシェーダー内で完結

### 制約
- **GLSL フラグメントシェーダーのみ** で実装（追加テクスチャ・FBO 禁止）
- モバイル GPU 対応: ループ上限 12 以下、条件分岐最小
- 外部依存の追加禁止

### 新しい uniform（追加）
```glsl
uniform float uFlowWidth;   // 流線のフォールオフ幅（σ）
```

### params.js に追加
```js
// quantumFieldParams に追加:
flowWidth: 0.015,    // 流線のソフトフォールオフ幅
```

### アルゴリズム概要

#### 1. 流線フィールド（左側）
```glsl
float field = 0.0;
for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float yCenter = 0.5 + (fi - 5.5) * 0.035;  // 流線のY初期位置（均等配分）
    
    // ガウシアン包絡 × sin → 流線パスの中心Y座標
    float envelope = exp(-pow((uv.x - 0.2) * 2.5, 2.0));  // 左で広がり中央で収束
    float pathY = yCenter + sin(uv.x * 12.0 + fi * 0.8 + uTime * 0.5) * 0.06 * envelope;
    
    // UVのYと流線パスの距離 → ソフトフォールオフ
    float d = abs(uv.y - pathY);
    field += exp(-d * d / (uFlowWidth * uFlowWidth));
}
// field を正規化して色に使う
field = clamp(field * 0.15, 0.0, 1.0);
```

#### 2. 同心波紋（スリット右）
```glsl
// スリット通過点からの距離で同心円
float r = length(uv - slitCenter);
float rings = 0.0;
for (int j = 0; j < 3; j++) {
    float radius = 0.08 + float(j) * 0.06 + uTime * 0.02;
    float ring = exp(-pow(r - radius, 2.0) / 0.0004);
    rings += ring;
}
```

#### 3. ソフトオーブ（光球）
```glsl
// 各光球位置からの距離でガウシアン
float orb = exp(-length(uv - orbPos) * length(uv - orbPos) / 0.002);
```

#### 4. 合成
```glsl
float pattern = field * leftMask + rings * rightMask + orbs;
vec3 color = cyanColor * pattern + vec3(1.0) * orbs * 0.8;
float alpha = clamp(pattern * uOpacity, 0.0, 1.0);
gl_FragColor = vec4(color, alpha);
```

## 変更対象ファイル
1. `src/shaders/quantum-field.glsl.js` — フラグメントシェーダーを**全面書き換え**
2. `src/config/params.js` — `quantumFieldParams` に `flowWidth: 0.015` を追加
3. `src/scene.js` — `uFlowWidth` uniform の更新を追加

## 完了条件
- [ ] 流線がソフトなガウシアンフォールオフで描画されている
- [ ] グリッドパーティクルが廃止されている
- [ ] スリット右に同心波紋 + ソフトオーブがある
- [ ] ループ上限が 12 以下（モバイル対応）
- [ ] `node --check` 全通過
- [ ] `git status --short` クリーン

## 禁止事項
- main / feature/dev への直接 push 禁止
- 他の既存ファイルの変更禁止（上記3ファイルのみ）
- 追加テクスチャ・FBO・外部ライブラリの使用禁止
- config/params.js の既存パラメータの値変更禁止

## コミット
- メッセージ: `fix: quantum field shader v2 - streamline field with liquid gradient (#73)`
- ブランチ: `feature/kesson-codex-app-quantum73`

---
## 🔴 完了報告（実装者が必ずこのフォーマットで出力すること）

> ⚠️ 作業完了時、以下のテンプレートを**そのまま埋めて**出力すること。
> 自由形式の報告は禁止。

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app-quantum73`
- ワークツリー: `~/dev/kesson-codex-cli2`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `fix: quantum field shader v2 - streamline field with liquid gradient (#73)`
- push 先: `origin/feature/kesson-codex-app-quantum73`

### 変更ファイル一覧
- `path/to/file` — 変更概要

### 検証結果
- [ ] `node --check` 通過（対象: ...）
- [ ] `git status --short` クリーン

### 残作業・注意事項
- （なければ「なし」）

---
## 目視確認手順（DT / ユーザー用）
```bash
cd ~/dev/kesson-codex-cli2
./serve.sh
# ブラウザで http://localhost:3001 → toggles.quantumField = true にして確認
```
