# 指示書: #74 量子場リキッドシーン — GLSL Raymarching SDF

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/74

## 作業ブランチ・ワークツリー
- ベース: `main`
- 作業: `feature/kesson-codex-app-qfluid74`
- ワークツリー: `~/dev/kesson-codex-app2`

## 概要
GLSL フラグメントシェーダーのみで Raymarching SDF による量子場リキッドエフェクトを実装する。
既存の vortex シーンパターン（PlaneGeometry + ShaderMaterial）を踏襲し、別シーンとして追加。

## ビジュアル要件
- Raymarching でカメラレイを飛ばし、SDF で液体的な有機形状を描画
- メタボール的な smooth union で複数球体が融合・分裂
- FBM ノイズによる表面歪みで量子場の揺らぎを表現
- Phong ライティング + subsurface scattering 風の発光
- 深海的な透明感（暗い青〜シアン系、既存の水面カラーと調和）
- 時間経過で脈動・ゆっくり形状変化

## 変更対象ファイル（4ファイル）

### 1. 新規: `src/shaders/quantum-field.glsl.js`
シェーダーコード（GLSL文字列のexport）。

```javascript
// quantum-field.glsl.js — 量子場リキッド Raymarching SDF シェーダー

export const quantumFieldVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const quantumFieldFragmentShader = `
    precision highp float;

    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uSpeed;
    uniform float uIntensity;
    uniform float uNoiseScale;
    uniform float uNoiseAmp;
    uniform float uBlobCount;
    uniform float uSmoothK;
    uniform float uSubsurface;
    uniform float uColorR;
    uniform float uColorG;
    uniform float uColorB;
    uniform float uGlowR;
    uniform float uGlowG;
    uniform float uGlowB;
    uniform float uOpacity;

    varying vec2 vUv;

    // --- Simplex Noise (2D/3D) ---
    // 実装者: 以下に 3D simplex noise を実装すること
    // snoise(vec3) → float [-1,1] を返す関数
    // 既存 noise.glsl.js の 2D snoise を参考に 3D 版を書くか、
    // 標準的な simplex3D 実装を使用してよい

    // --- SDF Primitives ---
    float sdSphere(vec3 p, float r) {
        return length(p) - r;
    }

    // Smooth union: k が大きいほど滑らかに融合
    float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
    }

    // --- FBM for displacement ---
    float fbm3(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        float f = 1.0;
        for (int i = 0; i < 4; i++) {
            v += a * snoise(p * f);
            a *= 0.5;
            f *= 2.03;
        }
        return v;
    }

    // --- Scene SDF ---
    // 複数メタボールを smooth union で融合
    // ノイズで表面を歪ませ、時間で位置が脈動
    float sceneSDF(vec3 p) {
        float t = uTime * uSpeed;

        // ノイズによる全体歪み
        vec3 displaced = p + fbm3(p * uNoiseScale + t * 0.3) * uNoiseAmp;

        // メタボール群（uBlobCount 個、円周上に配置 + 脈動）
        float d = 1e10;
        int count = int(uBlobCount);
        for (int i = 0; i < 8; i++) {  // max 8, 実際は uBlobCount で制御
            if (i >= count) break;
            float fi = float(i);
            float angle = fi * 6.2831853 / uBlobCount + t * 0.2;
            float radius = 1.2 + sin(t * 0.5 + fi * 1.7) * 0.4;
            vec3 center = vec3(
                cos(angle) * radius,
                sin(t * 0.3 + fi * 2.1) * 0.6,
                sin(angle) * radius
            );
            float blobR = 0.5 + sin(t * 0.7 + fi * 3.0) * 0.15;
            d = smin(d, sdSphere(displaced - center, blobR), uSmoothK);
        }

        // 中央の大きな球体
        float core = sdSphere(displaced, 0.8 + sin(t * 0.4) * 0.1);
        d = smin(d, core, uSmoothK * 1.5);

        return d;
    }

    // --- Normal estimation ---
    vec3 calcNormal(vec3 p) {
        vec2 e = vec2(0.002, 0.0);
        return normalize(vec3(
            sceneSDF(p + e.xyy) - sceneSDF(p - e.xyy),
            sceneSDF(p + e.yxy) - sceneSDF(p - e.yxy),
            sceneSDF(p + e.yyx) - sceneSDF(p - e.yyx)
        ));
    }

    // --- Raymarching ---
    float march(vec3 ro, vec3 rd, out int steps) {
        float t = 0.0;
        steps = 0;
        for (int i = 0; i < 80; i++) {
            vec3 p = ro + rd * t;
            float d = sceneSDF(p);
            if (d < 0.001) { steps = i; return t; }
            if (t > 20.0) break;
            t += d * 0.8;  // slight under-step for safety
            steps = i;
        }
        return -1.0;
    }

    void main() {
        // Screen UV → ray
        vec2 uv = (vUv - 0.5) * 2.0;
        uv.x *= uResolution.x / uResolution.y;

        vec3 ro = vec3(0.0, 0.0, 5.0);  // camera origin
        vec3 rd = normalize(vec3(uv, -1.5));  // ray direction

        int steps;
        float t = march(ro, rd, steps);

        if (t < 0.0) {
            // miss → transparent
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            return;
        }

        vec3 pos = ro + rd * t;
        vec3 nor = calcNormal(pos);

        // --- Lighting ---
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
        float diff = max(dot(nor, lightDir), 0.0);

        // Rim light
        float rim = pow(1.0 - max(dot(nor, -rd), 0.0), 3.0);

        // Subsurface scatter approximation
        float sss = pow(max(dot(rd, -lightDir), 0.0), 3.0) * uSubsurface;

        // Base color
        vec3 baseCol = vec3(uColorR, uColorG, uColorB);
        vec3 glowCol = vec3(uGlowR, uGlowG, uGlowB);

        // Compose
        vec3 color = baseCol * (diff * 0.6 + 0.2);  // diffuse + ambient
        color += glowCol * rim * 0.5;                // rim glow
        color += glowCol * sss;                      // subsurface
        color *= uIntensity;

        // Depth fade (objects further away are dimmer)
        float depthFade = exp(-t * 0.15);
        color *= depthFade;

        // Step-based glow (more steps = near surface = more glow)
        float stepGlow = float(steps) / 80.0 * 0.3;
        color += glowCol * stepGlow;

        float alpha = (0.6 + rim * 0.4) * depthFade * uOpacity;

        if (alpha < 0.001) discard;
        gl_FragColor = vec4(color, alpha);
    }
`;
```

**重要**: 上記は設計ガイド。`snoise(vec3)` の実装が必要。
既存 `noise.glsl.js` は 2D のみなので、3D simplex noise を追加実装すること。
外部コピペは可。Ashima の webgl-noise など標準実装を使ってよい。

### 2. 新規: `src/shaders/quantum-field.js`
マテリアル生成・メッシュ生成（`vortex.js` パターン完全踏襲）。

```javascript
// quantum-field.js — 量子場リキッド Raymarching SDF シーン

import * as THREE from 'three';
import { quantumFieldParams } from '../config.js';
import { quantumFieldVertexShader, quantumFieldFragmentShader } from './quantum-field.glsl.js';

export function createQuantumFieldMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime:       { value: 0.0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uSpeed:      { value: quantumFieldParams.speed },
            uIntensity:  { value: quantumFieldParams.intensity },
            uNoiseScale: { value: quantumFieldParams.noiseScale },
            uNoiseAmp:   { value: quantumFieldParams.noiseAmp },
            uBlobCount:  { value: quantumFieldParams.blobCount },
            uSmoothK:    { value: quantumFieldParams.smoothK },
            uSubsurface: { value: quantumFieldParams.subsurface },
            uColorR:     { value: quantumFieldParams.colorR },
            uColorG:     { value: quantumFieldParams.colorG },
            uColorB:     { value: quantumFieldParams.colorB },
            uGlowR:      { value: quantumFieldParams.glowR },
            uGlowG:      { value: quantumFieldParams.glowG },
            uGlowB:      { value: quantumFieldParams.glowB },
            uOpacity:    { value: quantumFieldParams.opacity },
        },
        vertexShader: quantumFieldVertexShader,
        fragmentShader: quantumFieldFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
}

export function createQuantumFieldMesh(material) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(
        quantumFieldParams.posX,
        quantumFieldParams.posY,
        quantumFieldParams.posZ
    );
    mesh.scale.set(quantumFieldParams.size, quantumFieldParams.size, 1);
    return mesh;
}
```

### 3. 編集: `src/config/params.js`

**追加箇所1**: `toggles` オブジェクトに以下を追加:
```javascript
    quantumField: false,  // デフォルトOFF
```

**追加箇所2**: ファイル末尾（`DISTORTION_PARAMS` の前）に以下を追加:
```javascript
// --- 量子場リキッド Raymarching パラメータ ---
export const quantumFieldParams = {
    speed:      0.2,
    intensity:  1.0,
    noiseScale: 1.5,
    noiseAmp:   0.3,
    blobCount:  5.0,
    smoothK:    0.5,
    subsurface: 0.4,
    colorR:     0.05,
    colorG:     0.12,
    colorB:     0.20,
    glowR:      0.15,
    glowG:      0.30,
    glowB:      0.45,
    opacity:    0.8,
    posX:       8,
    posY:       -5,
    posZ:       5,
    size:       12,
};
```

### 4. 編集: `src/scene.js`

**追加箇所1**: import に追加:
```javascript
import { createQuantumFieldMaterial, createQuantumFieldMesh } from './shaders/quantum-field.js';
```

また、import の config 行に `quantumFieldParams` を追加:
```javascript
import {
    sceneParams, toggles, vortexParams, quantumFieldParams,
    ...
} from './config.js';
```

**追加箇所2**: モジュール変数に追加:
```javascript
let _quantumFieldMaterial;
let _quantumFieldMesh;
```

**追加箇所3**: `createScene()` 関数内、vortex の後に追加:
```javascript
    // 量子場リキッド（Raymarching SDF）
    _quantumFieldMaterial = createQuantumFieldMaterial();
    _quantumFieldMesh = createQuantumFieldMesh(_quantumFieldMaterial);
    scene.add(_quantumFieldMesh);
```

**追加箇所4**: `updateScene(time)` 関数内、vortex ブロックの後に追加:
```javascript
    // --- 量子場リキッド ---
    _quantumFieldMesh.visible = toggles.quantumField;
    if (toggles.quantumField) {
        const qfu = _quantumFieldMaterial.uniforms;
        qfu.uTime.value = time;
        qfu.uSpeed.value = quantumFieldParams.speed;
        qfu.uIntensity.value = quantumFieldParams.intensity;
        qfu.uNoiseScale.value = quantumFieldParams.noiseScale;
        qfu.uNoiseAmp.value = quantumFieldParams.noiseAmp;
        qfu.uBlobCount.value = quantumFieldParams.blobCount;
        qfu.uSmoothK.value = quantumFieldParams.smoothK;
        qfu.uSubsurface.value = quantumFieldParams.subsurface;
        qfu.uColorR.value = quantumFieldParams.colorR;
        qfu.uColorG.value = quantumFieldParams.colorG;
        qfu.uColorB.value = quantumFieldParams.colorB;
        qfu.uGlowR.value = quantumFieldParams.glowR;
        qfu.uGlowG.value = quantumFieldParams.glowG;
        qfu.uGlowB.value = quantumFieldParams.glowB;
        qfu.uOpacity.value = quantumFieldParams.opacity;
        _quantumFieldMesh.position.set(
            quantumFieldParams.posX,
            quantumFieldParams.posY,
            quantumFieldParams.posZ
        );
        _quantumFieldMesh.scale.set(
            quantumFieldParams.size,
            quantumFieldParams.size,
            1
        );
    }
```

## 完了条件
1. `node --check` が全対象ファイルで通過
2. ブラウザで `toggles.quantumField = true` にすると Raymarching SDF のリキッド形状が表示される
3. 時間経過でメタボールが脈動・融合・分裂する
4. 既存シーン要素（水面、光、渦など）に影響しない
5. `git status --short` がクリーン（未コミットファイルなし）

## 禁止事項
- main ブランチへの直接 push 禁止
- feature/dev への直接マージ禁止
- 既存ファイルの意図しない変更禁止
- 新規 npm 依存の追加禁止（CDN の Three.js のみ使用）
- `src/shaders/noise.glsl.js` の既存 2D snoise を変更しない（3D版は quantum-field.glsl.js 内に自己完結させる）
- コミットメッセージに `Fix #74` を含めること

## 実装上の注意
- **snoise(vec3)** の実装が最重要。Ashima webgl-noise の simplex3D をそのまま使ってよい
- Raymarching のステップ数は 80 を目安にし、モバイルで極端に重くならないよう注意
- `uResolution` はメッシュ自体のサイズではなく window サイズを渡す（アスペクト比補正用）
- PlaneGeometry のサイズは 1x1 で、scale で制御（vortex パターンと同じ）
- ブランチのベースは **main** である。feature/dev ではない

---
## 🔴 完了報告（実装者が必ずこのフォーマットで出力すること）

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app-qfluid74`
- ワークツリー: `~/dev/kesson-codex-app2`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `feat: quantum field liquid raymarching SDF scene (Fix #74)`
- push 先: `origin/feature/kesson-codex-app-qfluid74`

### 変更ファイル一覧
- `path/to/file1` — 変更概要
- `path/to/file2` — 変更概要

### 検証結果
- [ ] `node --check` 通過（対象: ...）
- [ ] `git status --short` クリーン
- [ ] その他実行した検証コマンドと結果

### 残作業・注意事項
- （なければ「なし」と記入）

---
## 目視確認手順（DT / ユーザー用）
```bash
cd ~/dev/kesson-codex-app2
./serve.sh
# ブラウザで http://localhost:3001 を開いて確認
# コンソールで toggles.quantumField = true を実行して表示確認
```
