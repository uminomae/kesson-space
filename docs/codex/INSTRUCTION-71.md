# 指示書: #71 Raymarching SDF — 深海に浮かぶ有機的意識体エフェクト

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/71

## 作業ブランチ
- ベース: `feature/dev`
- 作業: `feature/kesson-codex-app-sdf71`

## 概要
Raymarching + SDF（Signed Distance Function）で、**専用シーン内**に脈動する有機的な「意識体」を描画する。
Three.js のメッシュジオメトリではなく、**フラグメントシェーダー内の数学だけで3D形状をリアルタイム生成**する。

## ビジュアルリファレンス
- **テーマ**: 量子の場理論・意識
- **色味**: 青白い発光（白コア + 青〜水色のリムライト）、黒背景に対して浮かぶ
- **質感**: 内部から光る半透明体（SSS風）+ 強いリムライト縁取り
- **形状**: 複数の光球が滑らかに融合・脈動するアメーバ的形態
- **参考イメージ**: 発光する白い球体群、波動パターン、軌道リング — 量子的な佇まい

## アーキテクチャ

### 統合方式 — 別シーン方式（xLogoScene パターン踏襲）

既存の xLogoScene と同じ方式で、**SDF専用のシーン・カメラ**を持つ。

```
メインシーン（scene + camera）         → 深海・オーブ・流体
xLogoシーン（xLogoScene + xLogoCamera） → Xロゴ（既存）
sdfシーン（sdfScene + sdfCamera）       → SDF意識体（新規）
```

描画順序（render-loop.js の animate() 末尾）:
```javascript
renderer.clear();
if (toggles.postProcess) {
    composer.render();
} else {
    renderer.render(scene, camera);
}
renderer.clearDepth();
renderer.render(xLogoScene, xLogoCamera);
renderer.clearDepth();
if (toggles.sdfEntity) {
    renderer.render(sdfScene, sdfCamera);
}
```

### ファイル構成

**新規ファイル（2つ）:**
1. `src/shaders/sdf-entity.glsl.js` — 頂点 + フラグメントシェーダー（GLSL）
2. `src/sdf-entity.js` — Three.js 統合（Scene/Camera/Mesh 生成、uniform 更新）

**変更ファイル（3つ）:**
3. `src/config/params.js` — `toggles` に `sdfEntity: true` 追加、`sdfEntityParams` 追加
4. `src/main.js` — SDF entity 初期化、startRenderLoop に渡す
5. `src/main/render-loop.js` — animate() に SDF 描画追加

---

## 実装手順

### Step 1: 既存ファイルを読む
以下のファイルをリモート `feature/kesson-codex-app-sdf71` ブランチから読み、構造を把握すること:
- `src/config/params.js` — toggles と xxxParams の定義パターン
- `src/main.js` — エントリポイント。特に xLogoScene/xLogoCamera の生成パターンを参考にする
- `src/main/render-loop.js` — animate() の末尾の描画順序（scene → xLogoScene）を参考にする
- `src/main/bootstrap.js` — bootstrapMainScene の戻り値パターン
- `src/shaders/gem-orb.glsl.js` — GLSL-in-JS の命名・export パターン参考
- `src/animation-utils.js` — `breathValue()` の引数・戻り値

### Step 2: `src/shaders/sdf-entity.glsl.js` を新規作成

GLSL-in-JS 形式（テンプレートリテラルで export）。
`export const sdfEntityVert = \`...\`;` / `export const sdfEntityFrag = \`...\`;` の形式。

#### 頂点シェーダー（sdfEntityVert）
```glsl
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

#### フラグメントシェーダー（sdfEntityFrag）要件

**uniforms:**
- `uniform float uTime;` — 経過時間
- `uniform float uBreath;` — breathValue（-1.0 〜 1.0）
- `uniform vec2 uMouse;` — マウス位置（-1〜1 正規化）
- `uniform vec2 uResolution;` — Plane のピクセルサイズ

**必須実装 — SDF プリミティブ関数:**
```glsl
float sdSphere(vec3 p, float r) { return length(p) - r; }
```

**必須実装 — SDF 合成演算:**
```glsl
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}
```

**必須実装 — 3D ノイズ:**
- 表面変形用。hash関数ベースの value noise で十分。
- **シェーダー内に自己完結で書くこと**（外部 import 不要）。

**必須実装 — Scene SDF（距離関数の合成）:**
- メイン球体（半径 0.8）+ ノイズ変形で表面を歪ませる
- サブ球体 3〜4個（半径 0.3〜0.5）をメイン周囲に配置、`sin(uTime)` で軌道変化
- 全体を `opSmoothUnion(k=0.5)` でブレンド → 融合する光球群
- `uBreath` でメイン球体半径を `0.8 + 0.1 * uBreath` のように脈動

**必須実装 — Raymarching ループ:**
```glsl
float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < 64; i++) {
        vec3 p = ro + rd * t;
        float d = sceneSDF(p);
        if (d < 0.001) break;
        t += d;
        if (t > 20.0) break;
    }
    return t;
}
```

**必須実装 — 法線推定:**
```glsl
vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        sceneSDF(p + e.xyy) - sceneSDF(p - e.xyy),
        sceneSDF(p + e.yxy) - sceneSDF(p - e.yxy),
        sceneSDF(p + e.yyx) - sceneSDF(p - e.yyx)
    ));
}
```

**必須実装 — ライティング（青白い発光体）:**
- **ベースカラー**: `vec3(0.6, 0.8, 1.0)` — 青白い基調
- **ディフューズ**: 上方ライト `normalize(vec3(0.3, 1.0, 0.5))` で基本照明
- **リムライト（強め）**: `pow(1.0 - max(dot(normal, -rd), 0.0), 3.0)` × `vec3(0.4, 0.7, 1.0)` — 青い縁取り。強度高め（×1.5〜2.0）
- **内部発光（SSS風）**: `exp(-hitDist * 3.0)` × `vec3(0.9, 0.95, 1.0)` — 白く光るコア
- **最終色の加算合成**: diffuse + rim + sss をブレンドし、中心ほど白く、縁ほど青白い

**必須実装 — 背景透過:**
- Raymarching で hit しなかったピクセルは `discard;` で完全透過

**マウス反応:**
- `uMouse` で `sceneSDF` 内のサブ球体位置を微妙にオフセット（±0.2 程度）

### Step 3: `src/sdf-entity.js` を新規作成

**別シーン方式**: xLogoScene のパターンに倣い、専用の Scene + Camera + Mesh を生成。

```javascript
// sdf-entity.js — Raymarching SDF 意識体（別シーン方式）
import * as THREE from 'three';
import { sdfEntityVert, sdfEntityFrag } from './shaders/sdf-entity.glsl.js';

export function createSdfEntity() {
    // --- 専用シーン ---
    const sdfScene = new THREE.Scene();

    // --- 専用カメラ（正面から見る固定カメラ） ---
    const sdfCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    sdfCamera.position.set(0, 0, 5);
    sdfCamera.lookAt(0, 0, 0);

    // --- SDF Plane ---
    const geometry = new THREE.PlaneGeometry(4, 4);
    const material = new THREE.ShaderMaterial({
        vertexShader: sdfEntityVert,
        fragmentShader: sdfEntityFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
            uTime: { value: 0 },
            uBreath: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        },
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);  // シーン中央
    sdfScene.add(mesh);

    return { sdfScene, sdfCamera, mesh, material };
}

export function updateSdfEntity(material, sdfCamera, mainCamera, time, breathVal, mouse) {
    material.uniforms.uTime.value = time;
    material.uniforms.uBreath.value = breathVal;
    material.uniforms.uMouse.value.set(mouse.smoothX || 0, mouse.smoothY || 0);
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);

    // メインカメラと光学パラメータを同期
    sdfCamera.aspect = mainCamera.aspect;
    sdfCamera.updateProjectionMatrix();
}
```

### Step 4: `src/config/params.js` を変更

#### toggles に追加:
`orbRefraction: true,` の次の行に:
```javascript
sdfEntity: true,  // Raymarching SDF 意識体
```

#### sdfEntityParams を新規追加（ファイル末尾、`vortexParams` の後）:
```javascript
// --- SDF Entity パラメータ ---
export const sdfEntityParams = {
    planeSize: 4,
};
```

### Step 5: `src/main.js` を変更

import 追加（他の import 群の後、`DEV_MODE` 定義の前あたり）:
```javascript
import { createSdfEntity } from './sdf-entity.js';
```

`initScrollUI();` の後に追加:
```javascript
let sdfEntity = null;
if (toggles.sdfEntity) {
    sdfEntity = createSdfEntity();
}
```

`startRenderLoop` の呼び出しの引数オブジェクトに追加:
```javascript
sdfEntity,
```

### Step 6: `src/main/render-loop.js` を変更

import 追加:
```javascript
import { updateSdfEntity } from '../sdf-entity.js';
```

`startRenderLoop` の分割代入引数に `sdfEntity` を追加。

`animate()` 内、`updateXLogo(time, xLogoCamera);` の後あたりに追加:
```javascript
if (toggles.sdfEntity && sdfEntity) {
    updateSdfEntity(sdfEntity.material, sdfEntity.sdfCamera, camera, time, breathVal, mouse);
}
```

`animate()` 末尾の描画ブロックを変更。現在:
```javascript
renderer.clear();
if (toggles.postProcess) {
    composer.render();
} else {
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(xLogoScene, xLogoCamera);
}
statsEnd();
```

変更後:
```javascript
renderer.clear();
if (toggles.postProcess) {
    composer.render();
} else {
    renderer.render(scene, camera);
}
renderer.clearDepth();
renderer.render(xLogoScene, xLogoCamera);
if (toggles.sdfEntity && sdfEntity) {
    renderer.clearDepth();
    renderer.render(sdfEntity.sdfScene, sdfEntity.sdfCamera);
}
statsEnd();
```

**注意**: `postProcess` が true の場合も xLogoScene と sdfScene を描画するよう、
xLogoScene の描画を if ブロックの**外**に移動する。既存コードでは xLogoScene が
else ブロック内にあるが、これを外に出す。

### Step 7: resize ハンドラー更新

`attachResizeHandler` 内の `onResize()` で sdfCamera の aspect も更新する。
`startRenderLoop` の引数に `sdfEntity` を渡し、`attachResizeHandler` にも渡す:

```javascript
// attachResizeHandler 内
if (sdfEntity) {
    sdfEntity.sdfCamera.aspect = camera.aspect;
    sdfEntity.sdfCamera.updateProjectionMatrix();
}
```

### Step 8: コミット & プッシュ
- メッセージ: `feat: add raymarching SDF consciousness entity (Fix #71)`
- ブランチ: `feature/kesson-codex-app-sdf71`

---

## 禁止事項
- main ブランチへの直接 push 禁止
- feature/dev への直接マージ禁止
- 既存シェーダーファイルの変更禁止（新規ファイルのみ）
- npm / 外部ライブラリの追加禁止（Three.js の既存 import のみ使用）
- Raymarching のステップ数を 80 以上にしない（モバイル性能考慮）
- `postProcess` 有効時のメインシーン描画（composer.render()）を変更しない

## 完了条件
- [ ] `node --check` が新規・変更ファイル全てで通過
- [ ] `git status --short` クリーン
- [ ] シェーダーコンパイルエラーが出ないよう、GLSL 構文を慎重に確認
- [ ] `sdfEntityVert` / `sdfEntityFrag` が正しく export されている
- [ ] 別シーン方式で描画されること（sdfScene + sdfCamera）

---

## 完了報告（実装者が記入）

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app-sdf71`
- ワークツリー: `~/dev/kesson-codex-app` or `~/dev/kesson-codex-app-sdf71`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `feat: add raymarching SDF consciousness entity (Fix #71)`
- push 先: `origin/feature/kesson-codex-app-sdf71`

### 変更ファイル一覧
- `src/shaders/sdf-entity.glsl.js` — 新規: Raymarching フラグメントシェーダー
- `src/sdf-entity.js` — 新規: Three.js 統合（別シーン方式）
- `src/config/params.js` — toggles.sdfEntity 追加、sdfEntityParams 追加
- `src/main.js` — SDF entity 初期化
- `src/main/render-loop.js` — animate() に SDF 更新・描画追加

### 検証結果
- [ ] `node --check` 通過（対象: 上記5ファイル）
- [ ] `git status --short` クリーン
- [ ] その他実行した検証コマンドと結果

### 残作業・注意事項
- （なければ「なし」と記入）
