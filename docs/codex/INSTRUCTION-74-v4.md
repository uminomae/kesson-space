# 指示書: #74 v4 量子波屈折ディストーション — distortion-pass インライン統合

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/74

## 作業ブランチ
- ベース: `feature/dev`
- 作業: `feature/kesson-codex-app-qrefract74`

## コンセプト
波動関数の振幅に応じた**透明な屈折ディストーション**。
波自体は見えない。背景の像が歪むことで波の存在を知覚する。

- 振幅が大きい箇所 → UV を圧縮方向にオフセット（像が押し潰される）
- 振幅が小さい箇所 → UV を伸張方向にオフセット（像が引き伸ばされる）
- リキッドレンズ的な透明エフェクト

## 技術アプローチ: A案（インライン計算）
既存の `distortion-pass.js` の DistortionShader フラグメントシェーダーに
「セクション 4: 量子波屈折」を追加する。
背景テクスチャ（tDiffuse）のUVを波動関数の勾配でずらす。
**追加RTTは不要。**

## 実装手順

### Step 1: 対象ファイルを読む
以下のファイルをリモート `feature/kesson-codex-app-qrefract74` から読むこと:
- `src/shaders/distortion-pass.js`
- `src/config/params.js`
- `src/config/index.js`
- `src/main/render-loop.js`

### Step 2: `src/config/params.js` にパラメータ追加

#### 2a. toggles に追加
```js
quantumWave: true,  // 量子波屈折（デフォルトON）
```

#### 2b. 新規 export 追加（liquidParams の下あたり）
```js
// --- 量子波屈折パラメータ ---
export const quantumWaveParams = {
    strength:    0.025,   // 屈折の強さ（UVオフセット最大量）
    speed:       0.15,    // 波の時間進行速度
    baseFreq:    3.0,     // 基本周波数
    dispersion:  0.08,    // 分散関係 ω = dispersion * k²
    noiseAmp:    0.3,     // FBM位相ノイズ振幅（リキッド揺らぎ用）
    noiseScale:  2.0,     // ノイズスケール
    waveCount:   8.0,     // 重ね合わせ波数
    envelope:    0.6,     // ガウシアンエンベロープ幅
    yInfluence:  0.3,     // y方向の歪み影響度（0で水平のみ）
};
```

### Step 3: `src/config/index.js` に export 追加
`quantumWaveParams` が re-export されるよう確認・追加。

### Step 4: `src/shaders/distortion-pass.js` を編集

#### 4a. import に追加
```js
import { distortionParams, fluidParams, liquidParams, quantumWaveParams } from '../config.js';
```

#### 4b. DistortionShader.uniforms に追加
```js
'uQWaveStrength':   { value: quantumWaveParams.strength },
'uQWaveSpeed':      { value: quantumWaveParams.speed },
'uQWaveBaseFreq':   { value: quantumWaveParams.baseFreq },
'uQWaveDispersion': { value: quantumWaveParams.dispersion },
'uQWaveNoiseAmp':   { value: quantumWaveParams.noiseAmp },
'uQWaveNoiseScale': { value: quantumWaveParams.noiseScale },
'uQWaveCount':      { value: quantumWaveParams.waveCount },
'uQWaveEnvelope':   { value: quantumWaveParams.envelope },
'uQWaveYInfluence': { value: quantumWaveParams.yInfluence },
```

#### 4c. fragmentShader に uniform 宣言を追加
`varying vec2 vUv;` の直後あたり:
```glsl
uniform float uQWaveStrength;
uniform float uQWaveSpeed;
uniform float uQWaveBaseFreq;
uniform float uQWaveDispersion;
uniform float uQWaveNoiseAmp;
uniform float uQWaveNoiseScale;
uniform float uQWaveCount;
uniform float uQWaveEnvelope;
uniform float uQWaveYInfluence;
```

#### 4d. main() に「セクション 4: 量子波屈折」を追加
既存のセクション 3（リキッドエフェクト）の後、`gl_FragColor` の前に追加:

```glsl
// 4. 量子波屈折（透明リキッドレンズ）
if (uQWaveStrength > 0.0001) {
    // 波動関数 ψ の勾配を計算し、UVオフセットに変換
    // 8波の重ね合わせ（分散関係 ω = dispersion * k²）
    float qGradX = 0.0;
    float qGradY = 0.0;
    float qPsi = 0.0;
    
    int qCount = int(clamp(uQWaveCount, 1.0, 8.0));
    
    // 位相ノイズ（リキッド揺らぎ）
    float phaseNoise = 0.0;
    if (uQWaveNoiseAmp > 0.001) {
        phaseNoise = fbm(vUv * uQWaveNoiseScale * 6.0 + vec2(uTime * 0.05, uTime * 0.03)) * uQWaveNoiseAmp;
    }
    
    for (int n = 0; n < 8; n++) {
        if (n >= qCount) break;
        float idx = float(n);
        
        // 波数ベクトル（やや斜めの方向にばらつかせる）
        float angle = idx * 0.4 + 0.1 * sin(idx * 2.3);
        float kMag = uQWaveBaseFreq * (1.0 + idx * 0.25);
        float kx = kMag * cos(angle);
        float ky = kMag * sin(angle) * uQWaveYInfluence;
        
        // 分散関係
        float omega = uQWaveDispersion * kMag * kMag;
        
        // 位相
        float phase = kx * vUv.x + ky * vUv.y - omega * uTime * uQWaveSpeed + idx * 1.618 + phaseNoise;
        
        // 振幅減衰（高次ほど弱い）
        float amp = 1.0 / (1.0 + idx * 0.4);
        
        // ψ と ∂ψ/∂x, ∂ψ/∂y の解析的計算
        qPsi   += amp * sin(phase);
        qGradX += amp * kx * cos(phase);
        qGradY += amp * ky * cos(phase);
    }
    
    // ガウシアンエンベロープ（画面中心からの距離で減衰）
    float envDist = length(vUv - 0.5) * 2.0;
    float envelope = exp(-envDist * envDist / max(uQWaveEnvelope * uQWaveEnvelope, 0.01));
    
    // 勾配 → UVオフセット（勾配の逆方向 = レンズ効果）
    vec2 qOffset = vec2(-qGradX, -qGradY) * uQWaveStrength * envelope;
    
    // アスペクト比補正
    qOffset.x /= uAspect;
    
    // 背景をずらして読む
    vec3 qRefracted = texture2D(tDiffuse, vUv + qOffset).rgb;
    color = mix(color, qRefracted, envelope);
}
```

**重要**: 既存の `fbm()` 関数がシェーダー内に既に定義されている（セクション0〜1で使用中）ので、新規追加は不要。そのまま呼べる。

### Step 5: `src/main/render-loop.js` を編集

`animate()` 内、既存の `if (toggles.liquid)` ブロックの後に追加:

```js
// 量子波屈折
if (toggles.quantumWave) {
    distortionPass.uniforms.uQWaveStrength.value = quantumWaveParams.strength;
} else {
    distortionPass.uniforms.uQWaveStrength.value = 0;
}
```

また、ファイル先頭の import に `quantumWaveParams` を追加:
```js
import { distortionParams, fluidParams, quantumWaveParams } from '../config.js';
```

### Step 6: コミット & プッシュ
- メッセージ: `feat: quantum wave refraction distortion in post-process (Fix #74)`
- ブランチ: `feature/kesson-codex-app-qrefract74`

### Step 7: 検証
- `node --check` を全変更ファイルに対して実行
- `git status --short` がクリーンであることを確認
- `git push origin feature/kesson-codex-app-qrefract74`

## 完了条件
1. distortion-pass.js にセクション4（量子波屈折）が追加されている
2. 波自体は描画されず、背景の歪みのみで表現されている
3. params.js に quantumWaveParams と toggles.quantumWave が追加されている
4. render-loop.js で toggles.quantumWave による ON/OFF 制御が実装されている
5. 既存エフェクト（流体フィールド、熱波、オーブ屈折、リキッド、DOF）が壊れていない
6. `node --check` が全ファイルで通過

## 禁止事項
- main ブランチへの直接 push 禁止
- feature/dev への直接マージ禁止
- 既存エフェクト（セクション0〜3）のロジック変更禁止
- 新規 npm パッケージの追加禁止
- quantum-field.glsl.js / quantum-field.js への変更禁止（v2は別ブランチ）
- PlaneGeometry / 新規メッシュの追加禁止（ポストプロセスのみで完結させる）

---

## 🔴 完了報告（実装者が必ずこのフォーマットで出力すること）

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app-qrefract74`
- ワークツリー: `~/dev/kesson-codex-app1`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `feat: quantum wave refraction distortion in post-process (Fix #74)`
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
cd ~/dev/kesson-codex-app1
./serve.sh
# ブラウザで http://localhost:3001 を開いて確認
# toggles.quantumWave はデフォルト true なので起動時から有効
# DevTools Console で以下を試す:
#   quantumWaveParams.strength = 0.05  → 歪み強め
#   quantumWaveParams.strength = 0.01  → 歪み弱め
#   toggles.quantumWave = false        → OFF確認
```
