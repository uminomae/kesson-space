# 指示書: #74 v4.1 量子波屈折 — パラメータ拡張（全部入り）

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/74

## 作業ブランチ
- 作業: `feature/kesson-codex-app-qrefract74`（既存ブランチ、v4実装済み）

## 概要
v4で実装した量子波屈折エフェクトに、視覚的な存在感を出すための追加パラメータを一括導入する。
現在は「完全に透明な屈折のみ」だが、発光・色収差・ぼかし・曇り・乱流などを加えて
devパネルで幅広い表現を調整可能にする。

## 実装手順

### Step 1: 対象ファイルを読む
以下をリモート `feature/kesson-codex-app-qrefract74` から読むこと:
- `src/config/params.js`
- `src/shaders/distortion-pass.js`
- `src/main/render-loop.js`

### Step 2: `src/config/params.js` — quantumWaveParams を拡張

既存の `quantumWaveParams` に以下のプロパティを **追加** する（既存プロパティは変更しない）:

```js
export const quantumWaveParams = {
    // --- 既存（変更しない）---
    strength:    0.025,
    speed:       0.15,
    baseFreq:    3.0,
    dispersion:  0.08,
    noiseAmp:    0.3,
    noiseScale:  2.0,
    waveCount:   8.0,
    envelope:    0.6,
    yInfluence:  0.3,

    // --- 発光・色収差（NEW）---
    glowAmount:   0.0,    // 波の振幅に応じた発光量（0=なし, 1=強い）
    glowColorR:   0.3,    // 発光色 R（シアン系）
    glowColorG:   0.6,    // 発光色 G
    glowColorB:   0.9,    // 発光色 B
    caberration:  0.0,    // 色収差量（0=なし, 0.01=微妙, 0.05=強い）
    rimBright:    0.0,    // 歪みエッジのリムライト（0=なし, 1=強い）

    // --- 曇り・ぼかし（NEW）---
    blurAmount:   0.0,    // 歪み箇所のぼかし量（0=なし, 0.05=すりガラス的）
    fogDensity:   0.0,    // 波の密度に応じた白濁（0=透明, 1=濃い霧）
    fogColorR:    0.7,    // 霧の色 R
    fogColorG:    0.8,    // 霧の色 G
    fogColorB:    0.9,    // 霧の色 B
    darken:       0.0,    // 歪み箇所の暗化量（0=なし, 1=完全に暗い）

    // --- 動き・質感（NEW）---
    turbulence:   0.0,    // 小スケール乱流ノイズ（0=なし, 1=荒い）
    sharpness:    0.5,    // 波の勾配コントラスト（0=ソフト, 1=シャープ）
};
```

### Step 3: `src/shaders/distortion-pass.js` を編集

#### 3a. uniforms に追加
既存の量子波 uniform の下に追加:

```js
'uQWaveGlowAmount':  { value: quantumWaveParams.glowAmount },
'uQWaveGlowColorR':  { value: quantumWaveParams.glowColorR },
'uQWaveGlowColorG':  { value: quantumWaveParams.glowColorG },
'uQWaveGlowColorB':  { value: quantumWaveParams.glowColorB },
'uQWaveCaberration': { value: quantumWaveParams.caberration },
'uQWaveRimBright':   { value: quantumWaveParams.rimBright },
'uQWaveBlurAmount':  { value: quantumWaveParams.blurAmount },
'uQWaveFogDensity':  { value: quantumWaveParams.fogDensity },
'uQWaveFogColorR':   { value: quantumWaveParams.fogColorR },
'uQWaveFogColorG':   { value: quantumWaveParams.fogColorG },
'uQWaveFogColorB':   { value: quantumWaveParams.fogColorB },
'uQWaveDarken':      { value: quantumWaveParams.darken },
'uQWaveTurbulence':  { value: quantumWaveParams.turbulence },
'uQWaveSharpness':   { value: quantumWaveParams.sharpness },
```

#### 3b. fragmentShader に uniform 宣言を追加
既存の量子波 uniform 宣言の下に:

```glsl
uniform float uQWaveGlowAmount;
uniform float uQWaveGlowColorR;
uniform float uQWaveGlowColorG;
uniform float uQWaveGlowColorB;
uniform float uQWaveCaberration;
uniform float uQWaveRimBright;
uniform float uQWaveBlurAmount;
uniform float uQWaveFogDensity;
uniform float uQWaveFogColorR;
uniform float uQWaveFogColorG;
uniform float uQWaveFogColorB;
uniform float uQWaveDarken;
uniform float uQWaveTurbulence;
uniform float uQWaveSharpness;
```

#### 3c. セクション4（量子波屈折）を拡張
既存のセクション4を以下で **置き換え** る。既存の屈折ロジックは維持しつつ、追加エフェクトを後段に追加:

```glsl
// 4. 量子波屈折（透明リキッドレンズ + 拡張エフェクト）
if (uQWaveStrength > 0.0001) {
    float qGradX = 0.0;
    float qGradY = 0.0;
    float qPsi = 0.0;

    int qCount = int(clamp(uQWaveCount, 1.0, 8.0));

    // 位相ノイズ（リキッド揺らぎ + 乱流）
    float phaseNoise = 0.0;
    if (uQWaveNoiseAmp > 0.001) {
        vec2 noiseCoord = vUv * uQWaveNoiseScale * 6.0 + vec2(uTime * 0.05, uTime * 0.03);
        phaseNoise = fbm(noiseCoord) * uQWaveNoiseAmp;
    }
    // 乱流: 小スケールの高周波ノイズを追加
    float turb = 0.0;
    if (uQWaveTurbulence > 0.001) {
        turb = (valueNoise(vUv * 50.0 + uTime * 0.3) - 0.5) * uQWaveTurbulence;
    }

    for (int n = 0; n < 8; n++) {
        if (n >= qCount) break;
        float idx = float(n);
        float angle = idx * 0.4 + 0.1 * sin(idx * 2.3);
        float kMag = uQWaveBaseFreq * (1.0 + idx * 0.25);
        float kx = kMag * cos(angle);
        float ky = kMag * sin(angle) * uQWaveYInfluence;
        float omega = uQWaveDispersion * kMag * kMag;
        float phase = kx * vUv.x + ky * vUv.y - omega * uTime * uQWaveSpeed + idx * 1.618 + phaseNoise + turb;
        float amp = 1.0 / (1.0 + idx * 0.4);
        qPsi   += amp * sin(phase);
        qGradX += amp * kx * cos(phase);
        qGradY += amp * ky * cos(phase);
    }

    // ガウシアンエンベロープ
    float envDist = length(vUv - 0.5) * 2.0;
    float envelope = exp(-envDist * envDist / max(uQWaveEnvelope * uQWaveEnvelope, 0.01));

    // 波の強度（正規化 |ψ|）— エフェクトのマスクに使用
    float psiAbs = abs(qPsi) / max(uQWaveCount * 0.5, 1.0);
    psiAbs = clamp(psiAbs, 0.0, 1.0);

    // シャープネス適用（勾配のコントラスト調整）
    float gradMag = length(vec2(qGradX, qGradY));
    float sharpFactor = mix(0.5, 2.0, uQWaveSharpness);
    qGradX *= sharpFactor;
    qGradY *= sharpFactor;

    // 勾配 → UVオフセット（屈折）
    vec2 qOffset = vec2(-qGradX, -qGradY) * uQWaveStrength * envelope;
    qOffset.x /= uAspect;

    // --- ぼかし ---
    vec3 qRefracted;
    if (uQWaveBlurAmount > 0.0005) {
        float blurAmt = uQWaveBlurAmount * psiAbs * envelope;
        qRefracted = discBlur(vUv + qOffset, blurAmt);
    } else {
        qRefracted = texture2D(tDiffuse, vUv + qOffset).rgb;
    }

    // --- 色収差 ---
    if (uQWaveCaberration > 0.0001) {
        float ca = uQWaveCaberration * psiAbs * envelope;
        qRefracted.r = texture2D(tDiffuse, vUv + qOffset * (1.0 + ca)).r;
        qRefracted.b = texture2D(tDiffuse, vUv + qOffset * (1.0 - ca)).b;
    }

    // 屈折適用
    color = mix(color, qRefracted, envelope);

    // --- 暗化 ---
    if (uQWaveDarken > 0.001) {
        float darkMask = psiAbs * envelope * uQWaveDarken;
        color *= (1.0 - darkMask);
    }

    // --- 霧（白濁）---
    if (uQWaveFogDensity > 0.001) {
        vec3 fogColor = vec3(uQWaveFogColorR, uQWaveFogColorG, uQWaveFogColorB);
        float fogMask = psiAbs * envelope * uQWaveFogDensity;
        color = mix(color, fogColor, fogMask);
    }

    // --- 発光 ---
    if (uQWaveGlowAmount > 0.001) {
        vec3 glowColor = vec3(uQWaveGlowColorR, uQWaveGlowColorG, uQWaveGlowColorB);
        float glowMask = psiAbs * psiAbs * envelope * uQWaveGlowAmount;
        color += glowColor * glowMask;
    }

    // --- リムライト ---
    if (uQWaveRimBright > 0.001) {
        // 勾配の大きさ = 屈折のエッジ → リムライト
        float normGrad = clamp(gradMag * 0.1, 0.0, 1.0);
        float rimMask = normGrad * envelope * uQWaveRimBright;
        color += vec3(rimMask * 0.5, rimMask * 0.7, rimMask * 1.0);
    }
}
```

### Step 4: `src/main/render-loop.js` を編集

既存の量子波 toggle ブロックを以下に **置き換え** る:

```js
// 量子波屈折
if (toggles.quantumWave) {
    const qp = quantumWaveParams;
    const du = distortionPass.uniforms;
    du.uQWaveStrength.value = qp.strength;
    du.uQWaveSpeed.value = qp.speed;
    du.uQWaveBaseFreq.value = qp.baseFreq;
    du.uQWaveDispersion.value = qp.dispersion;
    du.uQWaveNoiseAmp.value = qp.noiseAmp;
    du.uQWaveNoiseScale.value = qp.noiseScale;
    du.uQWaveCount.value = qp.waveCount;
    du.uQWaveEnvelope.value = qp.envelope;
    du.uQWaveYInfluence.value = qp.yInfluence;
    du.uQWaveGlowAmount.value = qp.glowAmount;
    du.uQWaveGlowColorR.value = qp.glowColorR;
    du.uQWaveGlowColorG.value = qp.glowColorG;
    du.uQWaveGlowColorB.value = qp.glowColorB;
    du.uQWaveCaberration.value = qp.caberration;
    du.uQWaveRimBright.value = qp.rimBright;
    du.uQWaveBlurAmount.value = qp.blurAmount;
    du.uQWaveFogDensity.value = qp.fogDensity;
    du.uQWaveFogColorR.value = qp.fogColorR;
    du.uQWaveFogColorG.value = qp.fogColorG;
    du.uQWaveFogColorB.value = qp.fogColorB;
    du.uQWaveDarken.value = qp.darken;
    du.uQWaveTurbulence.value = qp.turbulence;
    du.uQWaveSharpness.value = qp.sharpness;
} else {
    distortionPass.uniforms.uQWaveStrength.value = 0;
}
```

### Step 5: コミット & プッシュ
- メッセージ: `feat: extend quantum wave params — glow, blur, fog, caberration, rim, turbulence, sharpness`
- ブランチ: `feature/kesson-codex-app-qrefract74`

### Step 6: 検証
- `node --check` を全変更ファイルに対して実行
- `git status --short` がクリーンであることを確認
- `git push origin feature/kesson-codex-app-qrefract74`

## 完了条件
1. quantumWaveParams に14個の新プロパティが追加されている
2. distortion-pass.js に14個の新 uniform と拡張セクション4が追加されている
3. render-loop.js で全パラメータがリアルタイム同期されている
4. 全新パラメータがデフォルト 0.0（発光なし・ぼかしなし等）のため、v4 の見た目が変わらない
5. 既存エフェクト（セクション0〜3）が壊れていない
6. `node --check` が全ファイルで通過

## 禁止事項
- 既存の量子波パラメータ（strength〜yInfluence）のデフォルト値変更禁止
- 既存エフェクト（セクション0〜3）のロジック変更禁止
- 新規ファイルの追加禁止（既存3ファイルの変更のみ）

---

## 🔴 完了報告（実装者が必ずこのフォーマットで出力すること）

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app-qrefract74`
- ワークツリー: `~/dev/kesson-codex-app`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `feat: extend quantum wave params — glow, blur, fog, caberration, rim, turbulence, sharpness`
- push 先: `origin/feature/kesson-codex-app-qrefract74`

### 変更ファイル一覧
- `path/to/file1` — 変更概要
- `path/to/file2` — 変更概要

### 検証結果
- [ ] `node --check` 通過（対象: ...）
- [ ] `git status --short` クリーン
- [ ] `git push origin feature/kesson-codex-app-qrefract74` 成功

### 残作業・注意事項
- （なければ「なし」と記入）

---

## 目視確認手順（DT / ユーザー用）
```bash
cd ~/dev/kesson-codex-app
./serve.sh
# ブラウザで http://localhost:3001 を開いて確認

# デフォルトでは新パラメータ全て0 → v4と同じ見た目（回帰確認）

# テストプリセット例:
const cfg = await import('/src/config.js');
Object.assign(cfg.quantumWaveParams, {
  strength: 0.05,
  glowAmount: 0.3,     // うっすら発光
  caberration: 0.02,   // 虹色フリンジ
  rimBright: 0.4,      // エッジ光
  blurAmount: 0.02,    // すりガラス
  fogDensity: 0.15,    // 白濁
  darken: 0.1,         // やや暗い
  turbulence: 0.3,     // 乱流
  sharpness: 0.8,      // シャープ
});
```
