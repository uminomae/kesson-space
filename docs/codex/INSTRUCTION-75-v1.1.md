# 指示書: #75 v1.1 パーティクル砂嵐 — デフォルトOFF + パラメータ拡張

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/75

## 作業ブランチ
- 作業: `feature/kesson-codex-app2-pstorm75`（既存ブランチ、v1実装済み）

## 概要
v1で実装したパーティクル砂嵐シェーダーに対し:
1. **デフォルト OFF** に変更（devパネルで手動ONにして試行錯誤する前提）
2. **パラメータ大幅拡張** — 色味・明るさ・ボケ・発光・フェード・粒の質感を調整可能に

## 実装手順

### Step 1: 対象ファイルを読む
以下をリモート `feature/kesson-codex-app2-pstorm75` から読むこと:
- `src/config/params.js`
- `src/shaders/particle-storm.js`
- `src/scene.js`

### Step 2: `src/config/params.js` を編集

#### 2a. toggles を変更
```js
particleStorm: false,  // デフォルトOFF（devパネルで手動ON）
```

#### 2b. particleStormParams を拡張
既存プロパティは維持しつつ、新プロパティを追加:

```js
export const particleStormParams = {
    // --- 既存（値は変更しない）---
    speed:        0.15,
    intensity:    1.0,
    opacity:      0.7,
    baseFreq:     3.0,
    dispersion:   0.08,
    waveCount:    8.0,
    noiseAmp:     0.3,
    noiseScale:   2.0,
    grainDensity: 800.0,
    grainSize:    0.6,
    advectStrength: 0.02,
    colorR:       0.3,
    colorG:       0.6,
    colorB:       0.9,
    posX:         0,
    posY:         0,
    posZ:         5,
    size:         60,

    // --- 色・明るさ（NEW）---
    brightColorR:  0.7,    // 高密度域の色 R
    brightColorG:  0.85,   // 高密度域の色 G
    brightColorB:  1.0,    // 高密度域の色 B
    colorMix:      0.5,    // base↔bright の混合度（densityベース, 0=baseのみ）
    brightness:    1.0,    // 全体の明るさ乗数
    contrast:      1.0,    // 粒の明暗コントラスト（0.5=ソフト, 2.0=ハード）
    saturation:    1.0,    // 彩度（0=モノクロ, 1=通常, 2=鮮やか）

    // --- 発光（NEW）---
    glowAmount:    0.0,    // 粒の発光量（0=なし, 1=強い）
    glowSpread:    2.0,    // 発光の広がり（累乗の逆数的, 小さい=広い）
    glowColorR:    0.4,    // 発光色 R
    glowColorG:    0.7,    // 発光色 G
    glowColorB:    1.0,    // 発光色 B

    // --- ぼかし・ソフトネス（NEW）---
    softness:      0.0,    // 粒のエッジのぼかし（0=シャープ, 1=ぼやけ）
    bloomAmount:   0.0,    // 全体的なブルーム風の光にじみ（0=なし, 1=強い）

    // --- フェード・マスク（NEW）---
    edgeFadeStart: 1.8,    // エッジフェード開始距離
    edgeFadeEnd:   0.3,    // エッジフェード終了距離
    centerDim:     0.0,    // 中心の減光（0=なし, 1=中心が暗い）
    densityFloor:  0.0,    // 密度の最低値（0=完全に消える, 0.3=薄く残る）

    // --- 動き（NEW）---
    flickerSpeed:  2.0,    // 粒の明滅速度
    flickerAmount: 0.5,    // 明滅の振幅（0=明滅なし, 1=完全に消える瞬間あり）
    driftSpeed:    0.0,    // 全体のゆっくりドリフト速度
    driftAngle:    0.0,    // ドリフト方向（ラジアン）
};
```

### Step 3: `src/shaders/particle-storm.js` を編集

#### 3a. uniforms に追加
既存 uniform の下に:

```js
uBrightColorR:  { value: particleStormParams.brightColorR },
uBrightColorG:  { value: particleStormParams.brightColorG },
uBrightColorB:  { value: particleStormParams.brightColorB },
uColorMix:      { value: particleStormParams.colorMix },
uBrightness:    { value: particleStormParams.brightness },
uContrast:      { value: particleStormParams.contrast },
uSaturation:    { value: particleStormParams.saturation },
uPSGlowAmount:  { value: particleStormParams.glowAmount },
uPSGlowSpread:  { value: particleStormParams.glowSpread },
uPSGlowColorR:  { value: particleStormParams.glowColorR },
uPSGlowColorG:  { value: particleStormParams.glowColorG },
uPSGlowColorB:  { value: particleStormParams.glowColorB },
uSoftness:      { value: particleStormParams.softness },
uBloomAmount:   { value: particleStormParams.bloomAmount },
uEdgeFadeStart: { value: particleStormParams.edgeFadeStart },
uEdgeFadeEnd:   { value: particleStormParams.edgeFadeEnd },
uCenterDim:     { value: particleStormParams.centerDim },
uDensityFloor:  { value: particleStormParams.densityFloor },
uFlickerSpeed:  { value: particleStormParams.flickerSpeed },
uFlickerAmount: { value: particleStormParams.flickerAmount },
uDriftSpeed:    { value: particleStormParams.driftSpeed },
uDriftAngle:    { value: particleStormParams.driftAngle },
```

#### 3b. fragmentShader の uniform 宣言に追加
既存 uniform 宣言の下に:

```glsl
uniform float uBrightColorR;
uniform float uBrightColorG;
uniform float uBrightColorB;
uniform float uColorMix;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform float uPSGlowAmount;
uniform float uPSGlowSpread;
uniform float uPSGlowColorR;
uniform float uPSGlowColorG;
uniform float uPSGlowColorB;
uniform float uSoftness;
uniform float uBloomAmount;
uniform float uEdgeFadeStart;
uniform float uEdgeFadeEnd;
uniform float uCenterDim;
uniform float uDensityFloor;
uniform float uFlickerSpeed;
uniform float uFlickerAmount;
uniform float uDriftSpeed;
uniform float uDriftAngle;
```

#### 3c. fragmentShader の main() を置き換え
既存の `void main()` を以下で **完全に置き換え** る:

```glsl
void main() {
    vec2 pos = vUv * 2.0 - 1.0;
    float safeH = max(uResolution.y, 1.0);
    pos.x *= uResolution.x / safeH;

    float t = uTime * uSpeed;

    // --- ドリフト ---
    if (uDriftSpeed > 0.001) {
        vec2 drift = vec2(cos(uDriftAngle), sin(uDriftAngle)) * uDriftSpeed * uTime;
        pos += drift;
    }

    // --- 波動関数 ψ ---
    float psiReal = 0.0;
    float psiImag = 0.0;
    float gradRealX = 0.0;
    float gradRealY = 0.0;

    int wCount = int(clamp(uWaveCount, 1.0, 8.0));

    float phaseNoise = fbm(pos * uNoiseScale + vec2(t * 0.05, t * 0.03)) * uNoiseAmp;

    for (int n = 0; n < 8; n++) {
        if (n >= wCount) break;
        float idx = float(n);
        float angle = idx * 0.785 + 0.3 * sin(idx * 1.7);
        float kMag = uBaseFreq * (1.0 + idx * 0.3);
        float kx = kMag * cos(angle);
        float ky = kMag * sin(angle);
        float omega = uDispersion * kMag * kMag;
        float phase = kx * pos.x + ky * pos.y - omega * t + idx * 1.618 + phaseNoise;
        float amp = 1.0 / (1.0 + idx * 0.35);
        psiReal += amp * cos(phase);
        psiImag += amp * sin(phase);
        gradRealX += amp * (-kx) * sin(phase);
        gradRealY += amp * (-ky) * sin(phase);
    }

    float psiSq = (psiReal * psiReal + psiImag * psiImag);
    float maxPsiSq = uWaveCount * uWaveCount * 0.15;
    float density = clamp(psiSq / max(maxPsiSq, 0.01), 0.0, 1.0);

    // 密度フロア
    density = max(density, uDensityFloor);

    // --- 移流 ---
    vec2 advect = vec2(gradRealX, gradRealY) * uAdvectStrength;

    // --- 粒（grain）---
    vec2 grainPos = (pos + advect * t) * uGrainDensity;
    vec2 gridCell = floor(grainPos);
    vec2 gridFrac = fract(grainPos);

    float grain = 0.0;
    for (int gx = -1; gx <= 1; gx++) {
        for (int gy = -1; gy <= 1; gy++) {
            vec2 neighbor = vec2(float(gx), float(gy));
            vec2 cellId = gridCell + neighbor;
            float rnd = hash21(cellId);
            vec2 particlePos = neighbor + vec2(
                hash21(cellId + 0.1),
                hash21(cellId + 0.2)
            ) - gridFrac;
            float dist = length(particlePos);

            // ソフトネス適用
            float particleSize = 0.3 + rnd * 0.4;
            float edgeSharp = mix(particleSize * 0.3, particleSize, 1.0 - uSoftness);
            float particleBright = smoothstep(particleSize, edgeSharp, dist);

            // コントラスト
            particleBright = pow(particleBright, uContrast);

            // 明滅
            float flicker = 1.0 - uFlickerAmount + uFlickerAmount * (0.5 + 0.5 * sin(uTime * uFlickerSpeed + rnd * 6.283));
            particleBright *= flicker;

            grain += particleBright;
        }
    }
    grain = clamp(grain, 0.0, 1.0);

    // --- 合成 ---
    float visibility = grain * density;

    // エッジフェード（パラメータ化）
    float edgeFade = smoothstep(uEdgeFadeStart, uEdgeFadeEnd, length(vUv * 2.0 - 1.0));
    visibility *= edgeFade;

    // 中心減光
    if (uCenterDim > 0.001) {
        float centerDist = length(vUv - 0.5) * 2.0;
        float centerMask = smoothstep(0.0, 0.3, centerDist);
        visibility *= mix(1.0, centerMask, uCenterDim);
    }

    // 色
    vec3 baseColor = vec3(uColorR, uColorG, uColorB);
    vec3 brightColor = vec3(uBrightColorR, uBrightColorG, uBrightColorB);
    vec3 color = mix(baseColor, brightColor, density * uColorMix);

    // 彩度
    if (abs(uSaturation - 1.0) > 0.01) {
        float luma = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(vec3(luma), color, uSaturation);
    }

    color *= visibility * uIntensity * uBrightness;

    // --- 発光 ---
    if (uPSGlowAmount > 0.001) {
        vec3 glowColor = vec3(uPSGlowColorR, uPSGlowColorG, uPSGlowColorB);
        float glowMask = pow(density, uPSGlowSpread) * grain * edgeFade * uPSGlowAmount;
        color += glowColor * glowMask;
    }

    // --- ブルーム風にじみ ---
    if (uBloomAmount > 0.001) {
        float bloomMask = density * grain * edgeFade * uBloomAmount;
        color += color * bloomMask;
    }

    float alpha = visibility * uOpacity;
    if (alpha < 0.001) discard;
    gl_FragColor = vec4(color, alpha);
}
```

### Step 4: `src/scene.js` を編集

updateScene() の `if (toggles.particleStorm)` ブロック内、既存の同期コードの下に追加:

```js
pu.uBrightColorR.value = particleStormParams.brightColorR;
pu.uBrightColorG.value = particleStormParams.brightColorG;
pu.uBrightColorB.value = particleStormParams.brightColorB;
pu.uColorMix.value = particleStormParams.colorMix;
pu.uBrightness.value = particleStormParams.brightness;
pu.uContrast.value = particleStormParams.contrast;
pu.uSaturation.value = particleStormParams.saturation;
pu.uPSGlowAmount.value = particleStormParams.glowAmount;
pu.uPSGlowSpread.value = particleStormParams.glowSpread;
pu.uPSGlowColorR.value = particleStormParams.glowColorR;
pu.uPSGlowColorG.value = particleStormParams.glowColorG;
pu.uPSGlowColorB.value = particleStormParams.glowColorB;
pu.uSoftness.value = particleStormParams.softness;
pu.uBloomAmount.value = particleStormParams.bloomAmount;
pu.uEdgeFadeStart.value = particleStormParams.edgeFadeStart;
pu.uEdgeFadeEnd.value = particleStormParams.edgeFadeEnd;
pu.uCenterDim.value = particleStormParams.centerDim;
pu.uDensityFloor.value = particleStormParams.densityFloor;
pu.uFlickerSpeed.value = particleStormParams.flickerSpeed;
pu.uFlickerAmount.value = particleStormParams.flickerAmount;
pu.uDriftSpeed.value = particleStormParams.driftSpeed;
pu.uDriftAngle.value = particleStormParams.driftAngle;
```

### Step 5: コミット & プッシュ
- メッセージ: `feat: extend particle storm params — color, glow, softness, bloom, fade, flicker, drift`
- ブランチ: `feature/kesson-codex-app2-pstorm75`

### Step 6: 検証
- `node --check` を全変更ファイルに対して実行
- `git status --short` がクリーン
- `git push origin feature/kesson-codex-app2-pstorm75`

## 完了条件
1. `toggles.particleStorm` が `false` に変更されている
2. `particleStormParams` に22個の新プロパティが追加されている
3. particle-storm.js に全新 uniform と拡張 main() が実装されている
4. scene.js で全パラメータがリアルタイム同期されている
5. 既存エフェクトが壊れていない
6. `node --check` が全ファイルで通過

## 禁止事項
- 既存パラメータ（speed〜size）のデフォルト値変更禁止（toggles.particleStorm を false にするのは除く）
- distortion-pass.js への変更禁止
- vortex.js / water.js 等の既存シェーダー変更禁止
- 新規ファイルの追加禁止

---

## 🔴 完了報告（実装者が必ずこのフォーマットで出力すること）

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app2-pstorm75`
- ワークツリー: `~/dev/kesson-codex-app2`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `feat: extend particle storm params — color, glow, softness, bloom, fade, flicker, drift`
- push 先: `origin/feature/kesson-codex-app2-pstorm75`

### 変更ファイル一覧
- `path/to/file1` — 変更概要
- `path/to/file2` — 変更概要

### 検証結果
- [ ] `node --check` 通過（対象: ...）
- [ ] `git status --short` クリーン
- [ ] `git push origin feature/kesson-codex-app2-pstorm75` 成功

### 残作業・注意事項
- （なければ「なし」と記入）

---

## 目視確認手順（DT / ユーザー用）
```bash
cd ~/dev/kesson-codex-app2
./serve.sh
# http://localhost:3001 を開く

# デフォルトOFFなので、まず有効化:
const cfg = await import('/src/config.js');
cfg.toggles.particleStorm = true;

# プリセット例:
Object.assign(cfg.particleStormParams, {
  brightness: 1.5,
  glowAmount: 0.4,
  glowSpread: 1.5,
  softness: 0.3,
  bloomAmount: 0.2,
  saturation: 1.3,
  contrast: 1.2,
  flickerSpeed: 3.0,
  flickerAmount: 0.6,
  driftSpeed: 0.02,
  driftAngle: 0.5,
});
```
