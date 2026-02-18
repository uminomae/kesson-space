# 修正指示書: #73 量子場シェーダー — リキッド流線フィールドへのリファクタ

## 環境判別
`skills/env-adaptive.md` §2 に従い環境判定してから実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/73

## 作業ブランチ
- 作業: `feature/kesson-codex-app-quantum73`（既存の上に追加コミット）

## 背景
初版の実装はソリッドなビーム光線で、量子確率波のイメージと乖離している。
リファレンス画像の特徴:
- 左側: ガウシアン包絡線に沿った複数の流線が収束
- 中央: スリット壁
- スリット後: 同心円状の波紋が広がる
- 右端: 白い発光球体 + 水平ビーム

求めるビジュアル: **流線の形状を骨格とし、周辺をリキッド的な透明グラデーションで包む流体フィールド**。
線描画ではなく、距離場ベースのソフトフォールオフで「線的 ↔ リキッド的」を表現する。

## 技術方針 — 流線距離場（Streamline Distance Field）

### コア概念
1. 各流線をパス関数 `y = baseY + amplitude * envelope(x) * sin(k*x - omega*t + phase)` で定義
2. 各ピクセルからパスへの距離 `d` を計算
3. `exp(-d*d / (sigma*sigma))` でソフトフォールオフ → sigma で線的↔リキッド的を制御
4. 複数流線（10〜12本）の寄与を加算 → 密度場
5. 密度に応じたシアン〜白のグラデーション + 透明度

### パフォーマンス制約（モバイル GPU）
- for ループ: 最大12イテレーション（流線本数）
- sin/cos 呼び出し: 流線1本あたり1回
- 三角関数以外の重い関数（pow, log）は最小限
- テクスチャ読み込み: なし（pure math のみ）
- 分岐(if): 最小限

## 実装手順

### Step 1: 現在のシェーダーを読む
- `src/shaders/quantum-field.glsl.js` を読む（現在のfragment shaderを把握）

### Step 2: フラグメントシェーダーを全面書き換え

以下の構造で `quantum-field.glsl.js` の fragmentShader 部分を書き換える。
createQuantumFieldMaterial / createQuantumFieldMesh の関数構造はそのまま維持。

#### uniforms（既存を維持 + 追加）
```glsl
uniform float uTime;
uniform float uOpacity;
uniform float uSlitPosition;   // 0.0〜1.0: UV.x でのスリット位置
uniform float uWaveCount;      // 流線の本数（float、intにキャストして使用）
uniform float uParticleIntensity;
uniform float uSigma;          // ★追加: フォールオフ幅（小さい=線的、大きい=リキッド的）
```

#### 🔴 新規 uniform `uSigma` を material の uniforms にも追加すること

#### fragment shader 疑似コード

```glsl
// === 左側: 流線距離場 ===
float leftMask = 1.0 - smoothstep(uSlitPosition - 0.05, uSlitPosition, uv.x);
float density = 0.0;
int count = int(uWaveCount);
for (int i = 0; i < 12; i++) {
    if (i >= count) break;
    float fi = float(i);
    float baseY = 0.5 + (fi - float(count-1) * 0.5) * 0.035;  // 中心から均等に広がる
    
    // ガウシアン包絡線: 左端で広い振幅、中央に向かい収束
    float envelope = exp(-pow((uv.x - uSlitPosition) * 2.5, 2.0)) * 0.15;
    // 左端では広がる
    envelope += (1.0 - uv.x / uSlitPosition) * 0.08;
    
    float pathY = baseY + envelope * sin(uv.x * 25.0 - uTime * 2.0 + fi * 0.8);
    float d = abs(uv.y - pathY);
    density += exp(-d * d / (uSigma * uSigma));
}
density *= leftMask;

// === 中央: スリット壁 ===
float wallDist = abs(uv.x - uSlitPosition);
float wall = smoothstep(0.008, 0.002, wallDist);
// スリット開口部（2箇所）
float opening1 = smoothstep(0.08, 0.04, abs(uv.y - 0.38));
float opening2 = smoothstep(0.08, 0.04, abs(uv.y - 0.62));
float openings = max(opening1, opening2);
wall *= (1.0 - openings);

// === 右側: 同心円波紋（2つのスリット開口から） ===
float rightMask = smoothstep(uSlitPosition, uSlitPosition + 0.05, uv.x);
vec2 src1 = vec2(uSlitPosition, 0.38);
vec2 src2 = vec2(uSlitPosition, 0.62);
float r1 = length(uv - src1);
float r2 = length(uv - src2);
// 干渉: 2波源からの波の重ね合わせ
float wave1 = sin(r1 * 60.0 - uTime * 3.0) * exp(-r1 * 3.0);
float wave2 = sin(r2 * 60.0 - uTime * 3.0) * exp(-r2 * 3.0);
float ripple = (wave1 + wave2) * 0.5;
// リキッド的ソフト化
float rippleDensity = smoothstep(0.0, 0.6, abs(ripple)) * rightMask;
// 距離による減衰
rippleDensity *= exp(-(uv.x - uSlitPosition) * 2.0);

// === 右端: 発光球体 ===
vec2 orb1Pos = vec2(0.78, 0.5);
vec2 orb2Pos = vec2(0.88, 0.48);
vec2 orb3Pos = vec2(0.88, 0.52);
float orb1 = exp(-length(uv - orb1Pos) * 18.0);
float orb2 = exp(-length(uv - orb2Pos) * 25.0);
float orb3 = exp(-length(uv - orb3Pos) * 25.0);
float orbs = (orb1 + orb2 + orb3) * uParticleIntensity;

// === 右端: 水平ビーム ===
float beam = exp(-pow(uv.y - 0.5, 2.0) * 800.0);
beam *= smoothstep(0.85, 0.92, uv.x);  // 右端のみ

// === 合成 ===
float totalDensity = density + rippleDensity * 0.8 + orbs + beam * 0.5 + wall * 0.3;
vec3 cyanBase = vec3(0.15, 0.6, 0.85);
vec3 white = vec3(1.0);
vec3 color = mix(cyanBase, white, smoothstep(0.3, 1.5, totalDensity));
float alpha = clamp(totalDensity * uOpacity, 0.0, 1.0);
gl_FragColor = vec4(color, alpha);
```

**注意**: 上記は疑似コードであり、そのままコピーしないこと。
GLSL の構文に合わせ、変数のスコープ・精度指定（precision mediump float;）を適切に行うこと。

### Step 3: config/params.js に uSigma パラメータ追加
`quantumFieldParams` に追加:
```js
sigma: 0.012,  // フォールオフ幅（0.003=細い線、0.03=リキッド的）
```

### Step 4: scene.js の updateScene で uSigma を更新
```js
qu.uSigma.value = quantumFieldParams.sigma;
```

### Step 5: 検証
- `node --check src/shaders/quantum-field.glsl.js`
- `node --check src/config/params.js`
- `node --check src/scene.js`
- `git status --short` クリーン

### Step 6: コミット & プッシュ
- メッセージ: `refactor: rewrite quantum field shader to streamline distance field`
- ブランチ: `feature/kesson-codex-app-quantum73`

## 完了条件
1. フラグメントシェーダーが流線距離場方式に書き換えられている
2. 流線はガウシアン包絡線で変調され、中央に向かい収束する
3. スリット後は同心円波紋（2波源干渉）
4. 右端に発光球体 + 水平ビーム
5. `uSigma` uniform が追加され、config から制御可能
6. for ループ12回以内、テクスチャなし
7. 全ファイル `node --check` 通過

## 禁止事項
- scene.js の既存要素の変更禁止（quantumField 関連の変更のみ）
- config/params.js の既存パラメータ値の変更禁止
- 外部依存・テクスチャの追加禁止
- Raymarching の使用禁止（2D距離場のみ）

---

## 🔴 完了報告（実装者が必ずこのフォーマットで出力すること）

> ⚠️ 作業完了時、以下のテンプレートを**そのまま埋めて**出力すること。
> 自由形式の報告は禁止。

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app-quantum73`
- ワークツリー: `~/dev/kesson-codex-cli2`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `refactor: rewrite quantum field shader to streamline distance field`
- push 先: `origin/feature/kesson-codex-app-quantum73`

### 変更ファイル一覧
- `path/to/file1` — 変更概要
- `path/to/file2` — 変更概要

### 検証結果
- [ ] `node --check` 通過（対象: ...）
- [ ] `git status --short` クリーン

### 残作業・注意事項
- （なければ「なし」と記入）

---

## 目視確認手順（DT / ユーザー用）
```bash
cd ~/dev/kesson-codex-cli2
./serve.sh
# ブラウザで http://localhost:3001 → toggles.quantumField = true にして確認
```
