# 指示書: #74 量子場リキッドシーン v2 — 波動関数ベース GLSL シェーダー

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/74

## 作業ブランチ・ワークツリー
- ベース: `main`
- 作業: `feature/kesson-codex-app-qwave74`
- ワークツリー: `~/dev/kesson-codex-app`

---

## ⚠️ 重要: v1（qfluid74）との違い

v1 は Raymarching SDF によるメタボール塊を実装したが、ビジュアルが求める方向と異なった。
本 v2 では **量子力学の波動関数を数式ベースでシェーダーに落とし込む** アプローチに変更。
3D Raymarching ではなく **2D フラグメントシェーダー**（vortex パターン踏襲）で実装する。

---

## 量子力学の数式分析とGLSLマッピング

### 1. 波動関数の重ね合わせ（Superposition）

量子力学の基本: 自由粒子の波動関数
```
ψ(r, t) = Σₙ Aₙ · exp(i(kₙ · r - ωₙt + φₙ))
```
- `kₙ`: 波数ベクトル（波の方向と周波数）
- `ωₙ`: 角周波数
- `φₙ`: 初期位相
- `Aₙ`: 振幅

**GLSL実装**: exp(iθ) = cos(θ) + i·sin(θ) なので：
```glsl
// 単一波の実部と虚部
float re = A * cos(dot(k, pos) - omega * t + phi);
float im = A * sin(dot(k, pos) - omega * t + phi);
```

### 2. 確率密度 |ψ|²（Probability Density）

```
|ψ|² = ψ*ψ = (Σ re)² + (Σ im)²
```
これが **輝度** に対応する。複数波の干渉で明暗パターンが生まれる。

**GLSL実装**:
```glsl
float totalRe = 0.0;
float totalIm = 0.0;
for (int n = 0; n < WAVE_COUNT; n++) {
    float phase = dot(k[n], pos) - omega[n] * uTime + phi[n];
    totalRe += A[n] * cos(phase);
    totalIm += A[n] * sin(phase);
}
float probability = totalRe * totalRe + totalIm * totalIm;
```

### 3. 分散関係（Dispersion Relation）

自由粒子: `ω = ℏk² / (2m)` → 波数が大きい成分ほど速く進む → 波束が自然に広がる。
GLSL では簡略化: `omega = baseSpeed * k * k` とする。

### 4. リキッド揺らぎへの応用

量子場の数式をベースにしつつ、**有機的な流動感** を出すための拡張:

- **位相ノイズ**: φₙ に FBM ノイズを加算 → 波面が有機的に歪む
- **波数ベクトルの回転**: kₙ を時間で緩やかに回転 → 流れの方向が変化
- **ガウシアンエンベロープ**: 波束を局在化し、空間的に波が集中する領域を作る
- **複素振幅のカラーマッピング**: Re/Im を色相にマッピング → 位相の視覚化

### 5. 見本画像の遷移構造（参考程度）

見本は左:波動 → 中央:スリット → 右:粒子 の構造だが、
本実装では遷移を x 座標のグラデーションとして **緩やかに** 取り入れる:
- 左領域: 波動干渉パターンが支配的（多数波の重ね合わせ）
- 中央: 遷移ゾーン（干渉+集中）
- 右領域: 波束が収縮し発光スポットに集中

ただしこれは厳密な再現ではなく、**全体としてリキッド的な揺らぎ** を優先する。

---

## ビジュアル要件

- 量子場の波動関数重ね合わせによる干渉パターン
- FBM ノイズで位相を歪ませたリキッド的な揺らぎ
- |ψ|² 確率密度 → 輝度マッピング → シアン〜青の発光
- 時間経過で波面がゆっくり流動（位相変化 + 波数回転）
- x 座標で緩やかに波動→集中のグラデーション（参考程度）
- 深海的な暗い背景に対して発光する線条パターン
- PlaneGeometry + フラグメントシェーダー（vortex パターン踏襲）

---

## 変更対象ファイル（4ファイル）

### 1. 新規: `src/shaders/quantum-field.glsl.js`

以下の設計に従って GLSL シェーダーを実装すること。
コード全文は実装者が数式に基づいて書くこと（コピペ用コードは提供しない）。

```javascript
// quantum-field.glsl.js — 量子場波動関数シェーダー

export const quantumFieldVertexShader = `
    // 標準的な varying vec2 vUv パススルー
`;

export const quantumFieldFragmentShader = `
    precision highp float;

    // --- Uniforms ---
    // uTime, uSpeed: 時間制御
    // uResolution: アスペクト比補正用
    // uWaveCount: 重ね合わせる波の数（float、ループ内でint変換）
    // uBaseFreq: 基本波数の大きさ
    // uDispersion: 分散関係の強さ（omega = uDispersion * k²）
    // uNoiseAmp: 位相ノイズ振幅（リキッド揺らぎの強さ）
    // uNoiseScale: 位相ノイズの空間周波数
    // uEnvelopeWidth: ガウシアンエンベロープの幅
    // uTransitionCenter: 波動→集中の遷移中心 x 座標
    // uTransitionWidth: 遷移の幅
    // uColorR, uColorG, uColorB: ベースカラー
    // uGlowR, uGlowG, uGlowB: 発光カラー
    // uIntensity, uOpacity: 全体制御

    // --- 実装すべき関数 ---

    // 1. snoise(vec2): 2D simplex noise（既存 noise.glsl.js から転記してよい）

    // 2. fbm(vec2): 4オクターブ FBM

    // 3. quantumField(vec2 pos):
    //    - WAVE_COUNT 個の波を重ね合わせる
    //    - 各波の波数ベクトル kₙ:
    //      角度 θₙ = n * 2π / WAVE_COUNT + uTime * 0.05（緩やかに回転）
    //      kₙ = uBaseFreq * (1.0 + n * 0.3) * vec2(cos(θₙ), sin(θₙ))
    //    - 角周波数: ωₙ = uDispersion * dot(kₙ, kₙ)（分散関係）
    //    - 位相: φₙ = fbm(pos * uNoiseScale + n * 7.3) * uNoiseAmp（ノイズ揺らぎ）
    //    - 実部: totalRe += cos(dot(kₙ, pos) - ωₙ * uTime * uSpeed + φₙ)
    //    - 虚部: totalIm += sin(dot(kₙ, pos) - ωₙ * uTime * uSpeed + φₙ)
    //    - 確率密度: |ψ|² = (totalRe² + totalIm²) / WAVE_COUNT²（正規化）
    //    - return |ψ|²

    // 4. main():
    //    - UV → pos（アスペクト比補正、-1..1 中心）
    //    - ガウシアンエンベロープ: envelope = exp(-dot(pos,pos) / uEnvelopeWidth²)
    //    - probability = quantumField(pos) * envelope
    //    - x座標による遷移: transition = smoothstep で左（波動）→右（集中）
    //      左側: probability をそのまま（干渉パターン広がり）
    //      右側: probability を pow() で鋭くし、発光スポットに集中
    //    - 色: baseColor * probability + glowColor * pow(probability, 3.0)
    //    - alpha: probability ベース、edgeFade 込み
    //    - discard if alpha < 0.001
`;
```

**実装の自由度**: 上記は数式設計のガイドライン。見た目が美しくなるなら
パラメータの微調整や追加の視覚効果（リム発光、色相シフトなど）は自由に加えてよい。
ただし **量子力学の波動関数重ね合わせ → |ψ|² 確率密度** の核心構造は必ず保つこと。

### 2. 新規: `src/shaders/quantum-field.js`

vortex.js パターン踏襲。マテリアル生成・メッシュ生成。

```javascript
import * as THREE from 'three';
import { quantumFieldParams } from '../config.js';
import { quantumFieldVertexShader, quantumFieldFragmentShader } from './quantum-field.glsl.js';

export function createQuantumFieldMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime:             { value: 0.0 },
            uResolution:       { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uSpeed:            { value: quantumFieldParams.speed },
            uIntensity:        { value: quantumFieldParams.intensity },
            uWaveCount:        { value: quantumFieldParams.waveCount },
            uBaseFreq:         { value: quantumFieldParams.baseFreq },
            uDispersion:       { value: quantumFieldParams.dispersion },
            uNoiseAmp:         { value: quantumFieldParams.noiseAmp },
            uNoiseScale:       { value: quantumFieldParams.noiseScale },
            uEnvelopeWidth:    { value: quantumFieldParams.envelopeWidth },
            uTransitionCenter: { value: quantumFieldParams.transitionCenter },
            uTransitionWidth:  { value: quantumFieldParams.transitionWidth },
            uColorR:           { value: quantumFieldParams.colorR },
            uColorG:           { value: quantumFieldParams.colorG },
            uColorB:           { value: quantumFieldParams.colorB },
            uGlowR:            { value: quantumFieldParams.glowR },
            uGlowG:            { value: quantumFieldParams.glowG },
            uGlowB:            { value: quantumFieldParams.glowB },
            uOpacity:          { value: quantumFieldParams.opacity },
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

**追加箇所1**: `toggles` オブジェクトに以下を追加（既存項目の後に）:
```javascript
    quantumField: false,  // デフォルトOFF
```

**追加箇所2**: ファイル末尾（`DISTORTION_PARAMS` の前）に以下を追加:
```javascript
// --- 量子場波動関数パラメータ ---
export const quantumFieldParams = {
    speed:            0.3,     // 時間進行速度
    intensity:        1.2,     // 全体輝度
    waveCount:        12.0,    // 重ね合わせ波の数
    baseFreq:         3.0,     // 基本波数
    dispersion:       0.08,    // 分散関係の強さ（ω = dispersion * k²）
    noiseAmp:         1.5,     // 位相ノイズ振幅（大→リキッド感強）
    noiseScale:       0.8,     // 位相ノイズ空間周波数
    envelopeWidth:    2.0,     // ガウシアンエンベロープ幅
    transitionCenter: 0.2,     // 波動→集中 遷移の中心x座標
    transitionWidth:  0.8,     // 遷移の幅（大→緩やか）
    colorR:           0.04,    // ベースカラー（深い青）
    colorG:           0.10,
    colorB:           0.18,
    glowR:            0.10,    // 発光カラー（シアン）
    glowG:            0.35,
    glowB:            0.55,
    opacity:          0.85,
    posX:             8,
    posY:             -5,
    posZ:             5,
    size:             15,
};
```

### 4. 編集: `src/scene.js`

v1 と同じ統合パターン。以下を追加:

**import に追加**:
```javascript
import { createQuantumFieldMaterial, createQuantumFieldMesh } from './shaders/quantum-field.js';
```
config import に `quantumFieldParams` を追加。

**モジュール変数に追加**:
```javascript
let _quantumFieldMaterial;
let _quantumFieldMesh;
```

**createScene() 内、vortex の後に追加**:
```javascript
    // 量子場（波動関数シェーダー）
    _quantumFieldMaterial = createQuantumFieldMaterial();
    _quantumFieldMesh = createQuantumFieldMesh(_quantumFieldMaterial);
    scene.add(_quantumFieldMesh);
```

**updateScene(time) 内、vortex ブロックの後に追加**:
```javascript
    // --- 量子場 ---
    _quantumFieldMesh.visible = toggles.quantumField;
    if (toggles.quantumField) {
        const qfu = _quantumFieldMaterial.uniforms;
        qfu.uTime.value = time;
        qfu.uResolution.value.set(window.innerWidth, window.innerHeight);
        qfu.uSpeed.value = quantumFieldParams.speed;
        qfu.uIntensity.value = quantumFieldParams.intensity;
        qfu.uWaveCount.value = quantumFieldParams.waveCount;
        qfu.uBaseFreq.value = quantumFieldParams.baseFreq;
        qfu.uDispersion.value = quantumFieldParams.dispersion;
        qfu.uNoiseAmp.value = quantumFieldParams.noiseAmp;
        qfu.uNoiseScale.value = quantumFieldParams.noiseScale;
        qfu.uEnvelopeWidth.value = quantumFieldParams.envelopeWidth;
        qfu.uTransitionCenter.value = quantumFieldParams.transitionCenter;
        qfu.uTransitionWidth.value = quantumFieldParams.transitionWidth;
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

---

## 完了条件
1. `node --check` が全対象ファイルで通過
2. ブラウザで `toggles.quantumField = true` にすると波動関数ベースの干渉パターンが表示される
3. パターンがリキッド的に揺らぎ、時間経過で流動する
4. 見た目が「量子場の波動」を連想させる線条パターン（メタボール塊ではない）
5. 既存シーン要素（水面、光、渦など）に影響しない
6. `git status --short` がクリーン

## 禁止事項
- main ブランチへの直接 push 禁止
- feature/dev への直接マージ禁止
- 既存ファイルの意図しない変更禁止
- 新規 npm 依存の追加禁止
- `src/shaders/noise.glsl.js` の変更禁止（2D snoise は quantum-field.glsl.js 内にコピーしてよい）
- Raymarching SDF は使わない（v1 のアプローチ）
- コミットメッセージに `Fix #74` を含めること

## 実装上の注意
- **核心**: 波動関数の重ね合わせ → |ψ|² 確率密度 の数式構造を忠実に実装すること
- ループ内で sin/cos を回すので、waveCount は 12 が上限目安（モバイル考慮）
- FBM ノイズの位相歪みが「リキッド感」の鍵。noiseAmp を大きくするとより有機的になる
- PlaneGeometry 1x1 + scale（vortex パターンと同じ）
- ブランチのベースは **main**

---
## 🔴 完了報告（実装者が必ずこのフォーマットで出力すること）

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app-qwave74`
- ワークツリー: `~/dev/kesson-codex-app`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `feat: quantum field wave function shader (Fix #74)`
- push 先: `origin/feature/kesson-codex-app-qwave74`

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
cd ~/dev/kesson-codex-app
./serve.sh
# ブラウザで http://localhost:3001 を開いて確認
# コンソールで toggles.quantumField = true を実行して表示確認
```
