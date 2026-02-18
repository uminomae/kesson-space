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
Raymarching + SDF（Signed Distance Function）で、深海シーン内に脈動する有機的な「意識体」を描画する。
Three.js のメッシュジオメトリではなく、**フラグメントシェーダー内の数学だけで3D形状をリアルタイム生成**する。

## アーキテクチャ

### 統合方式
- `PlaneGeometry(4, 4)` + カスタム `ShaderMaterial` を既存 `scene` に `Mesh` として追加
- `transparent: true`, `depthWrite: false`, `side: THREE.DoubleSide`
- 背景ピクセルは `discard` で透過 → 既存シーンの上に重なる
- `renderOrder` を高めに設定し、ナビオーブより手前に描画

### ファイル構成（新規3ファイル + 既存2ファイル変更）

**新規ファイル:**
1. `src/shaders/sdf-entity.glsl.js` — 頂点 + フラグメントシェーダー（GLSL）
2. `src/sdf-entity.js` — Three.js 統合モジュール（Mesh 生成、uniform 更新）

**変更ファイル:**
3. `src/config/params.js` — `toggles` に `sdfEntity: true` 追加、`sdfEntityParams` 追加
4. `src/main/render-loop.js` — animate() 内で SDF entity の uniform 更新呼び出し追加
5. `src/main.js` — `bootstrapMainScene` 後に SDF entity を初期化・scene に追加

---

## 実装手順

### Step 1: 既存ファイルを読む
以下のファイルをリモート `feature/kesson-codex-app-sdf71` ブランチから読み、構造を把握すること:
- `src/config/params.js` — toggles と xxxParams の定義パターン
- `src/main.js` — エントリポイントの構造
- `src/main/render-loop.js` — animate() の構造、breathValue の使い方
- `src/shaders/gem-orb.glsl.js` — GLSL-in-JS の命名・export パターン参考
- `src/animation-utils.js` — `breathValue()` の引数・戻り値

### Step 2: `src/shaders/sdf-entity.glsl.js` を新規作成

GLSL-in-JS 形式（テンプレートリテラルで export）。

#### 頂点シェーダー
```glsl
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

#### フラグメントシェーダー要件

**uniforms:**
- `uniform float uTime;` — 経過時間
- `uniform float uBreath;` — breathValue（-1.0 〜 1.0）
- `uniform vec2 uMouse;` — マウス位置（-1〜1 正規化）
- `uniform vec2 uResolution;` — Plane のピクセルサイズ

**必須実装 — SDF プリミティブ関数:**
```glsl
float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
```

**必須実装 — SDF 合成演算:**
```glsl
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}
```

**必須実装 — 3D ノイズ（simplex or value noise）:**
- 表面変形用。hash関数ベースの value noise で十分。
- `noise.glsl.js` に既存の `snoise` があるが、**シェーダー内に自己完結で書くこと**（import 不要にする）。

**必須実装 — Scene SDF（距離関数の合成）:**
- メイン球体（半径 0.8）+ ノイズ変形
- サブ球体 3〜4個（半径 0.3〜0.5）をメイン周囲に配置、`sin(uTime)` で軌道変化
- 全体を `opSmoothUnion(k=0.5)` でブレンド → アメーバ状の有機体
- `uBreath` でメイン球体半径を `0.8 + 0.1 * uBreath` のように脈動

**必須実装 — Raymarching ループ:**
```glsl
float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < 64; i++) {  // 64 steps（モバイル性能考慮）
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

**必須実装 — ライティング:**
- ディフューズ: 上方ライト `vec3(0.3, 1.0, 0.5)` で `max(dot(normal, lightDir), 0.0)`
- リムライト: `pow(1.0 - max(dot(normal, -rd), 0.0), 3.0)` → 青白い縁取り
- 内部発光: SSS 風に `exp(-distance * 2.0)` で中心が光る
- カラー: 深海テーマ `vec3(0.1, 0.3, 0.8)` ベース、リムは `vec3(0.4, 0.6, 1.0)`

**必須実装 — 背景透過:**
- Raymarching で hit しなかったピクセルは `discard;` で完全透過

**マウス反応:**
- `uMouse` で `sceneSDF` 内のサブ球体位置を微妙にオフセット（±0.2 程度）

### Step 3: `src/sdf-entity.js` を新規作成

```javascript
// sdf-entity.js — Raymarching SDF 意識体
import * as THREE from 'three';
import { sdfEntityVert, sdfEntityFrag } from './shaders/sdf-entity.glsl.js';

export function createSdfEntity() {
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
            uResolution: { value: new THREE.Vector2(512, 512) },
        },
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 5;
    // 初期位置: シーン中央やや下、ナビオーブの間
    mesh.position.set(0, -5, 20);
    // カメラ方向を常に向く
    mesh.userData.isSdfEntity = true;

    return { mesh, material };
}

export function updateSdfEntity(material, time, breathVal, mouse) {
    material.uniforms.uTime.value = time;
    material.uniforms.uBreath.value = breathVal;
    material.uniforms.uMouse.value.set(mouse.smoothX || 0, mouse.smoothY || 0);
}
```

**重要:** `mesh` は billboard（常にカメラを向く）にする。`render-loop.js` 内で `mesh.lookAt(camera.position)` を毎フレーム呼ぶ。

### Step 4: `src/config/params.js` を変更

#### toggles に追加:
```javascript
sdfEntity: true,  // Raymarching SDF 意識体
```
`orbRefraction: true,` の次の行に追加。

#### sdfEntityParams を新規追加（ファイル末尾、`vortexParams` の後）:
```javascript
// --- SDF Entity パラメータ ---
export const sdfEntityParams = {
    posX: 0,
    posY: -5,
    posZ: 20,
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
    scene.add(sdfEntity.mesh);
}
```

`startRenderLoop` の引数オブジェクトに `sdfEntity` を追加。

### Step 6: `src/main/render-loop.js` を変更

import 追加:
```javascript
import { updateSdfEntity } from '../sdf-entity.js';
```

`startRenderLoop` の引数に `sdfEntity` を追加。

`animate()` 内、`updateNavigation(time);` の後あたりに追加:
```javascript
if (toggles.sdfEntity && sdfEntity) {
    sdfEntity.mesh.lookAt(camera.position);
    updateSdfEntity(sdfEntity.material, time, breathVal, mouse);
}
```

### Step 7: コミット & プッシュ
- メッセージ: `feat: add raymarching SDF consciousness entity (#71)`
- `Fix #71` をメッセージに含める
- ブランチ: `feature/kesson-codex-app-sdf71`

---

## 禁止事項
- main ブランチへの直接 push 禁止
- feature/dev への直接マージ禁止
- 既存シェーダーファイルの変更禁止（新規ファイルのみ）
- npm / 外部ライブラリの追加禁止（Three.js の既存 import のみ使用）
- Raymarching のステップ数を 80 以上にしない（モバイル性能考慮）

## 完了条件
- [ ] `node --check` が新規・変更ファイル全てで通過
- [ ] `git status --short` クリーン
- [ ] シェーダーコンパイルエラーが出ないよう、GLSL 構文を慎重に確認
- [ ] `sdfEntityVert` / `sdfEntityFrag` が正しく export されている

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
- `src/sdf-entity.js` — 新規: Three.js 統合モジュール
- `src/config/params.js` — toggles.sdfEntity 追加、sdfEntityParams 追加
- `src/main.js` — SDF entity 初期化・scene追加
- `src/main/render-loop.js` — animate() に SDF uniform 更新追加

### 検証結果
- [ ] `node --check` 通過（対象: 上記5ファイル）
- [ ] `git status --short` クリーン
- [ ] その他実行した検証コマンドと結果

### 残作業・注意事項
- （なければ「なし」と記入）
