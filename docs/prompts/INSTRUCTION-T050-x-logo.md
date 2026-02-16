# 指示書: T-050 X（Twitter）ロゴ 3Dオブジェクト追加

## 概要

kesson-space の3Dシーンに、光沢のある「X」ロゴをワールド空間に固定配置し、ふわふわ浮遊させる。
Gemini Gem と同じパターン（ShaderMaterial + HTMLラベル + ヒットスプライト）で実装する。

## 作業環境

- **ワークツリー**: `/Users/uminomae/dev/kesson-codex`
- **ベースブランチ**: `feature/dev`（最新を fetch & pull してから分岐）
- **作業ブランチ**: `feature/x-logo` （`feature/dev` から作成）
- **作業開始**: `cd /Users/uminomae/dev/kesson-codex && git fetch origin && git checkout feature/dev && git pull && git checkout -b feature/x-logo`

## 完了条件

1. 3Dシーン右側に光沢のある X ロゴが浮遊表示される
2. カメラに追従しない（ワールド空間固定）
3. クリックで X（Twitter）プロフィールが新タブで開く
4. HTMLラベル「X」がGemと同じパターンで表示される
5. 既存のGem・PDFオーブに影響がない

## 実装手順

### Step 1: `src/config.js` に X ロゴパラメータ追加

`gemParams` の下に追加:

```js
// --- Xロゴパラメータ ---
export const xLogoParams = {
    meshScale:     0.6,
    glowStrength:  0.8,
    rimPower:      6.0,
    innerGlow:     2.0,
    posX: 22,
    posY: 5,
    posZ: 12,
    labelYOffset: 1.5,
};
```

### Step 2: `src/i18n.js` に X データ追加

`gem` エントリの下に、ja / en 両方に追加:

```js
xLogo: {
    label: 'X',
    url: 'https://x.com/pjdhiro',
},
```

### Step 3: `src/shaders/x-logo.glsl.js` 新規作成

X 形状を SDF で描画する光沢シェーダー。以下の要件:

- **頂点シェーダー**: `gem-orb.glsl.js` と同様に `vNormal`, `vWorldPos`, `vViewDir` を出力
- **フラグメントシェーダー**:
  - X形状を SDF（2本の対角線バーの union）で生成
  - リムライト（白〜淡い青）で光沢感
  - `uTime` による微弱な呼吸パルス（明滅）
  - Additive blending, transparent, depthWrite: false
  - uniforms: `uTime`, `uGlowStrength`, `uRimPower`, `uInnerGlow`, `uHover`

**方針**: PlaneGeometry（正方形）に貼り、フラグメントシェーダーで X 形状をマスクする。球体ではなく平面メッシュを使用。

```glsl
// フラグメントシェーダーの X 形状 SDF 参考:
// 2本の回転した矩形の union
float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float xShape(vec2 uv) {
    vec2 centered = uv - 0.5;
    float angle = 0.785398; // PI/4
    // bar 1 (/)
    vec2 r1 = vec2(
        centered.x * cos(angle) - centered.y * sin(angle),
        centered.x * sin(angle) + centered.y * cos(angle)
    );
    float d1 = sdBox(r1, vec2(0.35, 0.08));
    // bar 2 (\)
    vec2 r2 = vec2(
        centered.x * cos(-angle) - centered.y * sin(-angle),
        centered.x * sin(-angle) + centered.y * cos(-angle)
    );
    float d2 = sdBox(r2, vec2(0.35, 0.08));
    return min(d1, d2);
}
```

色は白〜淡い青（`vec3(0.85, 0.9, 1.0)`）でグロー付き。

### Step 4: `src/nav-objects.js` に X ロゴ統合

Gem パターンに倣って追加。主要な変更点:

#### 4a. import 追加

```js
import { xLogoParams } from './config.js';
import { xLogoVertexShader, xLogoFragmentShader } from './shaders/x-logo.glsl.js';
```

#### 4b. モジュール変数追加

```js
let _xLogoLabelElement = null;
let _xLogoGroup = null;
let _xLogoMesh = null;
```

#### 4c. `createXLogoGroup()` 関数

```js
function createXLogoGroup() {
    const group = new THREE.Group();
    group.position.set(xLogoParams.posX, xLogoParams.posY, xLogoParams.posZ);

    // ヒットスプライト（レイキャスト用）
    const hitMat = new THREE.SpriteMaterial({
        transparent: true, opacity: 0.0, depthWrite: false,
    });
    const hitSprite = new THREE.Sprite(hitMat);
    const hitSize = xLogoParams.meshScale * 3.0;
    hitSprite.scale.set(hitSize, hitSize, 1);
    group.add(hitSprite);

    // X メッシュ（PlaneGeometry + ShaderMaterial）
    const geom = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTime:          { value: 0.0 },
            uGlowStrength:  { value: xLogoParams.glowStrength },
            uRimPower:      { value: xLogoParams.rimPower },
            uInnerGlow:     { value: xLogoParams.innerGlow },
            uHover:         { value: 0.0 },
        },
        vertexShader: xLogoVertexShader,
        fragmentShader: xLogoFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.scale.setScalar(xLogoParams.meshScale);
    mesh.renderOrder = 10;
    group.add(mesh);

    group.userData = { hitSprite, xLogoMesh: mesh };
    _xLogoMesh = mesh;

    return group;
}
```

#### 4d. `createNavObjects()` 内に追加（Gem セクションの後）

```js
// --- X Logo ---
const xData = strings.xLogo;
const xGroup = createXLogoGroup();
const xIndex = navMeshes.length;

xGroup.userData.hitSprite.userData = {
    type: 'nav',
    url: xData.url,
    label: xData.label,
    isXLogo: true,
    external: true,
};

Object.assign(xGroup.userData, {
    baseY: xLogoParams.posY,
    index: xIndex,
    isXLogo: true,
});

scene.add(xGroup);
navMeshes.push(xGroup);
_xLogoGroup = xGroup;

_xLogoLabelElement = createHtmlLabel(xData.label, 'nav-label--x', xData.url, true);
```

#### 4e. `updateNavObjects()` 内に X ロゴ更新追加

```js
if (data.isXLogo) {
    // 浮遊（Gemと位相をずらす）
    obj.position.y = data.baseY + Math.sin(time * 0.5 + 4.0) * 0.5;
    const mesh = data.xLogoMesh;
    if (mesh) {
        // 緩やかな回転（Y軸）
        mesh.rotation.y = Math.sin(time * 0.2) * 0.15;
        if (mesh.material.uniforms.uTime) {
            mesh.material.uniforms.uTime.value = time;
        }
    }
    return; // 既存のorb処理をスキップ
}
```

**注意**: `if (data.isGem)` ブロックの**前**に配置して early return する。

#### 4f. `updateNavLabels()` 内に X ラベル更新追加

Gem ラベル更新セクションの後に追加:

```js
if (_xLogoLabelElement && _xLogoGroup) {
    if (!visible || scrollFade <= 0) {
        _xLogoLabelElement.style.opacity = '0';
        _xLogoLabelElement.style.pointerEvents = 'none';
        return;
    }
    _xLogoGroup.getWorldPosition(_labelWorldPos);
    updateSingleLabel(_xLogoLabelElement, _labelWorldPos, xLogoParams.labelYOffset, camera, scrollFade);
}
```

#### 4g. CSS スタイル追加（`injectNavLabelStyles` 内）

```css
.nav-label--x {
    color: rgba(220, 225, 240, 0.85);
    text-shadow: 0 0 12px rgba(180, 190, 220, 0.5), 0 0 4px rgba(0, 0, 0, 0.8);
    font-weight: bold;
}
.nav-label--x:hover {
    color: rgba(240, 245, 255, 1.0);
}
```

### Step 5: テスト確認

```bash
cd /Users/uminomae/dev/kesson-codex
./serve.sh
# ブラウザで http://localhost:3001/ を開き以下を確認:
# - X ロゴが右側に表示されているか
# - ふわふわ浮遊しているか
# - カメラ回転時にワールド空間に固定されているか
# - クリックで https://x.com/pjdhiro が新タブで開くか
# - Gem・PDFオーブが壊れていないか
```

### Step 6: コミット & プッシュ

```bash
git add -A
git commit -m "feat: add glossy X logo floating nav object (T-050)"
git push origin feature/x-logo
```

## 禁止事項

- `main` ブランチへの直接 push 禁止
- `feature/dev` への直接マージ禁止（DTが確認後に行う）
- 既存シェーダーファイルの変更禁止
- `src/config.js` の既存パラメータ変更禁止

## 位置の参考

スクリーンショット上の配置:
- Gem（四芒星）: 画面中央やや右（config: posX=10, posY=2, posZ=15）
- X ロゴ: Gemの右上方向（config: posX=22, posY=5, posZ=12）
- カメラデフォルト: camX=-14, camY=0, camZ=34

位置が画面外になる場合は `posX` を 18〜25、`posZ` を 10〜18 の範囲で調整してよい。
