# 指示書: #75 波動パーティクル砂嵐 — 光の粒が波動関数で流動する GLSL シーン

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/75

## 作業ブランチ
- ベース: `feature/dev`
- 作業: `feature/kesson-codex-app-pstorm75`

## コンセプト
波動関数に従って無数の微小な光の粒が砂嵐のように流動するエフェクト。
別シーンメッシュとして配置（vortex パターン踏襲）。

- 極めて細かい光の粒（ピクセルレベル）が画面を埋め尽くす
- 波動関数 ψ の |ψ|² が粒の密度・明るさを制御
- 高密度域は砂嵐のように密集して明るい、低密度域は暗く疎
- ハッシュノイズで粒をランダム配置、波動場で移流（advection）
- 全体として波の干渉パターンが粒の集団運動で浮かび上がる
- 色はシアン〜青（既存シーンに馴染む深海パレット）

## 技術アプローチ
- **vortex.js パターン踏襲**: `PlaneGeometry` + `ShaderMaterial` + `AdditiveBlending`
- GLSL 2D フラグメントシェーダーのみ（Raymarching不使用）
- 8波の重ね合わせ（分散関係 ω = dispersion * k²）
- モバイル 30fps 以上を維持

## 実装手順

### Step 1: 対象ファイルを読む
以下をリモート `feature/kesson-codex-app-pstorm75` から読むこと:
- `src/shaders/vortex.js` — **構造のリファレンス**（material + mesh のパターン）
- `src/shaders/noise.glsl.js` — snoise 関数（import して再利用）
- `src/config/params.js` — 既存パラメータ構造
- `src/config/index.js` — re-export 構造
- `src/scene.js` — シーン統合パターン

### Step 2: `src/config/params.js` にパラメータ追加

#### 2a. toggles に追加
```js
particleStorm: true,  // 波動パーティクル砂嵐（デフォルトON）
```

#### 2b. 新規 export 追加（vortexParams の下あたり）
```js
// --- 波動パーティクル砂嵐パラメータ ---
export const particleStormParams = {
    speed:       0.15,    // 波の時間進行速度
    intensity:   1.0,     // 全体の明るさ
    opacity:     0.7,     // 全体の透明度
    baseFreq:    3.0,     // 基本周波数
    dispersion:  0.08,    // 分散関係 ω = dispersion * k²
    waveCount:   8.0,     // 重ね合わせ波数
    noiseAmp:    0.3,     // FBM位相ノイズ振幅
    noiseScale:  2.0,     // ノイズスケール
    grainDensity: 800.0,  // 粒の密度（ハッシュグリッド解像度）
    grainSize:   0.6,     // 粒の明るさカーブの鋭さ（0=ぼやけ 1=シャープ）
    advectStrength: 0.02, // 波動場による移流の強さ
    colorR:      0.3,     // ベース色 R
    colorG:      0.6,     // ベース色 G
    colorB:      0.9,     // ベース色 B
    posX:        0,       // メッシュ位置X
    posY:        0,       // メッシュ位置Y
    posZ:        5,       // メッシュ位置Z
    size:        60,      // メッシュスケール
};
```

### Step 3: `src/config/index.js` に export 追加
`particleStormParams` が re-export されるよう確認・追加。

### Step 4: `src/shaders/particle-storm.js` を新規作成
vortex.js の構造を踏襲する。以下の構造で作成:

```js
// particle-storm.js — 波動パーティクル砂嵐シェーダー
import * as THREE from 'three';
import { particleStormParams } from '../config.js';
import { noiseGLSL } from './noise.glsl.js';

export function createParticleStormMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime:          { value: 0.0 },
            uSpeed:         { value: particleStormParams.speed },
            uIntensity:     { value: particleStormParams.intensity },
            uOpacity:       { value: particleStormParams.opacity },
            uBaseFreq:      { value: particleStormParams.baseFreq },
            uDispersion:    { value: particleStormParams.dispersion },
            uWaveCount:     { value: particleStormParams.waveCount },
            uNoiseAmp:      { value: particleStormParams.noiseAmp },
            uNoiseScale:    { value: particleStormParams.noiseScale },
            uGrainDensity:  { value: particleStormParams.grainDensity },
            uGrainSize:     { value: particleStormParams.grainSize },
            uAdvectStrength:{ value: particleStormParams.advectStrength },
            uColorR:        { value: particleStormParams.colorR },
            uColorG:        { value: particleStormParams.colorG },
            uColorB:        { value: particleStormParams.colorB },
            uResolution:    { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            precision highp float;

            uniform float uTime;
            uniform float uSpeed;
            uniform float uIntensity;
            uniform float uOpacity;
            uniform float uBaseFreq;
            uniform float uDispersion;
            uniform float uWaveCount;
            uniform float uNoiseAmp;
            uniform float uNoiseScale;
            uniform float uGrainDensity;
            uniform float uGrainSize;
            uniform float uAdvectStrength;
            uniform float uColorR;
            uniform float uColorG;
            uniform float uColorB;
            uniform vec2 uResolution;
            varying vec2 vUv;

            ${noiseGLSL}

            // FBM (4 octaves)
            float fbm(vec2 p) {
                float value = 0.0;
                float amp = 0.5;
                float freq = 1.0;
                for (int i = 0; i < 4; i++) {
                    value += amp * snoise(p * freq);
                    amp *= 0.5;
                    freq *= 2.02;
                }
                return value;
            }

            // 高速ハッシュ（粒の配置用）
            float hash21(vec2 p) {
                vec3 p3 = fract(vec3(p.xyx) * 0.1031);
                p3 += dot(p3, p3.yzx + 33.33);
                return fract((p3.x + p3.y) * p3.z);
            }

            void main() {
                // アスペクト比補正
                vec2 pos = vUv * 2.0 - 1.0;
                float safeH = max(uResolution.y, 1.0);
                pos.x *= uResolution.x / safeH;

                float t = uTime * uSpeed;

                // --- 波動関数 ψ の計算 ---
                // |ψ|² を粒の密度・明るさに使用
                // 勾配 (dψ/dx, dψ/dy) を移流ベクトルに使用
                float psiReal = 0.0;
                float psiImag = 0.0;
                float gradRealX = 0.0;
                float gradRealY = 0.0;

                int wCount = int(clamp(uWaveCount, 1.0, 8.0));

                // 位相ノイズ（リキッド揺らぎ）
                float phaseNoise = fbm(pos * uNoiseScale + vec2(t * 0.05, t * 0.03)) * uNoiseAmp;

                for (int n = 0; n < 8; n++) {
                    if (n >= wCount) break;
                    float idx = float(n);

                    // 波数ベクトル（放射状にばらつかせる）
                    float angle = idx * 0.785 + 0.3 * sin(idx * 1.7);
                    float kMag = uBaseFreq * (1.0 + idx * 0.3);
                    float kx = kMag * cos(angle);
                    float ky = kMag * sin(angle);

                    // 分散関係
                    float omega = uDispersion * kMag * kMag;

                    // 位相
                    float phase = kx * pos.x + ky * pos.y - omega * t + idx * 1.618 + phaseNoise;

                    // 振幅減衰
                    float amp = 1.0 / (1.0 + idx * 0.35);

                    // ψ = Σ A * exp(i * phase) → real = cos, imag = sin
                    psiReal += amp * cos(phase);
                    psiImag += amp * sin(phase);

                    // 勾配（移流用）
                    gradRealX += amp * (-kx) * sin(phase);
                    gradRealY += amp * (-ky) * sin(phase);
                }

                // |ψ|² 確率密度（0〜1に正規化）
                float psiSq = (psiReal * psiReal + psiImag * psiImag);
                float maxPsiSq = uWaveCount * uWaveCount * 0.15; // 大まかな正規化
                float density = clamp(psiSq / max(maxPsiSq, 0.01), 0.0, 1.0);

                // --- 移流（advection）---
                // 波動場の勾配で粒の位置をずらす
                vec2 advect = vec2(gradRealX, gradRealY) * uAdvectStrength;

                // --- 粒（grain）の生成 ---
                // ハッシュノイズグリッドで粒をランダム配置
                // 移流ベクトルで時間経過とともに粒が流れる
                vec2 grainPos = (pos + advect * t) * uGrainDensity;
                vec2 gridCell = floor(grainPos);
                vec2 gridFrac = fract(grainPos);

                float grain = 0.0;
                // 近傍3x3セルを走査（粒の表示を安定させる）
                for (int gx = -1; gx <= 1; gx++) {
                    for (int gy = -1; gy <= 1; gy++) {
                        vec2 neighbor = vec2(float(gx), float(gy));
                        vec2 cellId = gridCell + neighbor;

                        // セルごとのランダム位置
                        float rnd = hash21(cellId);
                        vec2 particlePos = neighbor + vec2(
                            hash21(cellId + 0.1),
                            hash21(cellId + 0.2)
                        ) - gridFrac;

                        // 粒までの距離
                        float dist = length(particlePos);

                        // 粒の明るさ（距離 + ランダムサイズ）
                        float particleSize = 0.3 + rnd * 0.4;
                        float particleBright = smoothstep(particleSize, particleSize * uGrainSize, dist);

                        // ランダムな明滅（時間変化）
                        float flicker = 0.5 + 0.5 * sin(t * 2.0 + rnd * 6.283);
                        particleBright *= flicker;

                        grain += particleBright;
                    }
                }
                grain = clamp(grain, 0.0, 1.0);

                // --- 合成 ---
                // density（|ψ|²）で粒の見え方を制御
                float visibility = grain * density;

                // エッジフェード
                float edgeFade = smoothstep(1.8, 0.3, length(pos));
                visibility *= edgeFade;

                // 色: 密度に応じてシアン〜白にシフト
                vec3 baseColor = vec3(uColorR, uColorG, uColorB);
                vec3 brightColor = vec3(0.7, 0.85, 1.0); // 高密度域は白寄り
                vec3 color = mix(baseColor, brightColor, density * 0.5);
                color *= visibility * uIntensity;

                float alpha = visibility * uOpacity;
                if (alpha < 0.001) discard;
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
}

export function createParticleStormMesh(material) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(
        particleStormParams.posX,
        particleStormParams.posY,
        particleStormParams.posZ
    );
    mesh.scale.set(particleStormParams.size, particleStormParams.size, 1);
    return mesh;
}
```

**注意**: シェーダーコードは上記をそのまま使用すること。自己流の変更は禁止。

### Step 5: `src/scene.js` を編集

#### 5a. import 追加
```js
import { createParticleStormMaterial, createParticleStormMesh } from './shaders/particle-storm.js';
```
また、config import に `particleStormParams` を追加:
```js
import {
    sceneParams, toggles, vortexParams, particleStormParams,
    ...
} from './config.js';
```

#### 5b. モジュールスコープ変数を追加（`let _vortexMesh;` の下あたり）
```js
let _particleStormMaterial;
let _particleStormMesh;
```

#### 5c. createScene() にメッシュ生成を追加（渦の下）
```js
// 波動パーティクル砂嵐（#75）
_particleStormMaterial = createParticleStormMaterial();
_particleStormMesh = createParticleStormMesh(_particleStormMaterial);
scene.add(_particleStormMesh);
```

#### 5d. updateScene() に更新ロジック追加（渦ブロックの下）
```js
// --- 波動パーティクル砂嵐 (#75) ---
_particleStormMesh.visible = toggles.particleStorm;
if (toggles.particleStorm) {
    const pu = _particleStormMaterial.uniforms;
    pu.uTime.value = time;
    pu.uSpeed.value = particleStormParams.speed;
    pu.uIntensity.value = particleStormParams.intensity;
    pu.uOpacity.value = particleStormParams.opacity;
    pu.uBaseFreq.value = particleStormParams.baseFreq;
    pu.uDispersion.value = particleStormParams.dispersion;
    pu.uWaveCount.value = particleStormParams.waveCount;
    pu.uNoiseAmp.value = particleStormParams.noiseAmp;
    pu.uNoiseScale.value = particleStormParams.noiseScale;
    pu.uGrainDensity.value = particleStormParams.grainDensity;
    pu.uGrainSize.value = particleStormParams.grainSize;
    pu.uAdvectStrength.value = particleStormParams.advectStrength;
    pu.uColorR.value = particleStormParams.colorR;
    pu.uColorG.value = particleStormParams.colorG;
    pu.uColorB.value = particleStormParams.colorB;
    pu.uResolution.value.set(window.innerWidth, window.innerHeight);
    _particleStormMesh.position.set(
        particleStormParams.posX,
        particleStormParams.posY,
        particleStormParams.posZ
    );
    _particleStormMesh.scale.set(particleStormParams.size, particleStormParams.size, 1);
    _particleStormMesh.lookAt(_camera.position);
}
```

### Step 6: コミット & プッシュ
- メッセージ: `feat: particle storm wave function shader scene (Fix #75)`
- ブランチ: `feature/kesson-codex-app-pstorm75`

### Step 7: 検証
- `node --check` を全変更・新規ファイルに対して実行
- `git status --short` がクリーンであることを確認
- `git push origin feature/kesson-codex-app-pstorm75`

## 完了条件
1. `src/shaders/particle-storm.js` が新規作成されている
2. params.js に `particleStormParams` と `toggles.particleStorm` が追加されている
3. scene.js にメッシュ生成・更新ロジックが統合されている
4. 既存エフェクト（水面、光、渦、背景）が壊れていない
5. `node --check` が全ファイルで通過

## 禁止事項
- main ブランチへの直接 push 禁止
- feature/dev への直接マージ禁止
- 既存ファイル（vortex.js, water.js 等）のロジック変更禁止
- 新規 npm パッケージの追加禁止
- distortion-pass.js への変更禁止（#74 と競合する）
- Step 4 のシェーダーコードを自己流で変更禁止

---

## 🔴 完了報告（実装者が必ずこのフォーマットで出力すること）

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app-pstorm75`
- ワークツリー: `~/dev/kesson-codex-app2`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `feat: particle storm wave function shader scene (Fix #75)`
- push 先: `origin/feature/kesson-codex-app-pstorm75`

### 変更ファイル一覧
- `path/to/file1` — 変更概要
- `path/to/file2` — 変更概要

### 検証結果
- [ ] `node --check` 通過（対象: ...）
- [ ] `git status --short` クリーン
- [ ] `git push origin feature/kesson-codex-app-pstorm75` 成功

### 残作業・注意事項
- （なければ「なし」と記入）

---

## 目視確認手順（DT / ユーザー用）
```bash
cd ~/dev/kesson-codex-app2
./serve.sh
# ブラウザで http://localhost:3001 を開いて確認
# toggles.particleStorm はデフォルト true なので起動時から有効
# DevTools Console で以下を試す:
#   particleStormParams.grainDensity = 1200  → 粒を細かく
#   particleStormParams.intensity = 1.5      → 明るめ
#   particleStormParams.advectStrength = 0.05 → 流動を強く
#   toggles.particleStorm = false            → OFF確認
```
