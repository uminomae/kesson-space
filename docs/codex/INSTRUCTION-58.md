# 指示書: メインシーンとxLogoシーンの呼吸（明滅）を同期

## Issue
https://github.com/uminomae/kesson-space/issues/58

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## 作業ブランチ
- ベース: `dev`
- 作業: `feature/kesson-codex-2-breath58`

## 背景
アプリは2つのThree.jsシーンを重ねてレンダリングしている:
1. **メインシーン**: 背景・水面・欠損光・オーブ等。`breathValue()` による呼吸アニメーションあり
2. **xLogoシーン**: Xロゴ専用。ライトが固定値で呼吸に連動していない

メインシーンが呼吸で暗くなっても、xLogoだけ一定の明るさで浮いて見えてしまう。

## 対象ファイル（3ファイル）
1. `src/main/bootstrap.js` — xLogoライト参照のエクスポート
2. `src/main.js` — ライト参照の受け渡し
3. `src/main/render-loop.js` — breathVal によるライト強度変調

## 実装手順

### Step 1: 3ファイルを読む
リモート `feature/kesson-codex-2-breath58` ブランチの以下を読む:
- `src/main/bootstrap.js`
- `src/main.js`
- `src/main/render-loop.js`
- `src/config.js` （breathConfig の構造を確認）

### Step 2: bootstrap.js — xLogoライトを return に追加

**現状（bootstrap.js 内、xLogoライト生成部分）:**
```js
const xLogoAmbient = new THREE.AmbientLight(0xffffff, 0.6);
const xLogoKey = new THREE.DirectionalLight(0xffffff, 0.9);
xLogoKey.position.set(10, 12, 8);
xLogoScene.add(xLogoAmbient, xLogoKey);
```

**変更**: return オブジェクトに `xLogoAmbient` と `xLogoKey` を追加する。

```js
return {
    scene,
    camera,
    renderer,
    composer,
    distortionPass,
    dofPass,
    fluidSystem,
    liquidSystem,
    liquidTarget,
    xLogoScene,
    xLogoCamera,
    xLogoGroup,
    xLogoAmbient,   // ← 追加
    xLogoKey,        // ← 追加
};
```

### Step 3: main.js — 分割代入で受け取り、startRenderLoop に渡す

**現状（main.js 内の分割代入）:**
```js
const {
    scene,
    camera,
    renderer,
    composer,
    distortionPass,
    dofPass,
    fluidSystem,
    liquidSystem,
    liquidTarget,
    xLogoScene,
    xLogoCamera,
    xLogoGroup,
} = bootstrapMainScene(container);
```

**変更**: `xLogoAmbient`, `xLogoKey` を追加。

```js
const {
    scene,
    camera,
    renderer,
    composer,
    distortionPass,
    dofPass,
    fluidSystem,
    liquidSystem,
    liquidTarget,
    xLogoScene,
    xLogoCamera,
    xLogoGroup,
    xLogoAmbient,   // ← 追加
    xLogoKey,        // ← 追加
} = bootstrapMainScene(container);
```

**startRenderLoop 呼び出しの引数にも追加:**

既存の引数リストの末尾に追加:
```js
startRenderLoop({
    // ... 既存の引数すべて ...
    xLogoAmbient,   // ← 追加
    xLogoKey,        // ← 追加
});
```

### Step 4: render-loop.js — startRenderLoop の引数受け取り + animate 内で呼吸同期

**4a: 関数パラメータに追加**

`startRenderLoop` の分割代入パラメータに `xLogoAmbient`, `xLogoKey` を追加する。

**4b: animate() 内に呼吸同期コードを追加**

`const breathVal = breathValue(time, breathConfig.period);` の行の後（`updateScrollUI` の前後あたり）に以下を追加:

```js
// xLogoシーンのライトをメインの呼吸に同期
const breathDim = 0.7 + 0.3 * breathVal;  // breathVal=0で0.7、breathVal=1で1.0
if (xLogoAmbient) xLogoAmbient.intensity = 0.6 * breathDim;
if (xLogoKey) xLogoKey.intensity = 0.9 * breathDim;
```

**パラメータ説明:**
- `breathVal` は 0〜1 を往復する値（`breathValue()` の出力）
- `breathDim` は 0.7〜1.0 の範囲で変動し、呼吸の暗→明を表現
- ベース強度（0.6, 0.9）に `breathDim` を掛けることで、メインシーンの呼吸と同じタイミングで明滅する
- 振幅30%（0.7〜1.0）は初期値。目視確認後に調整する可能性あり

### Step 5: コミット & プッシュ
- メッセージ: `feat: sync xLogo scene lighting with main breath animation (Fix #58)`
- ブランチ: `feature/kesson-codex-2-breath58`

## 完了条件
1. `bootstrap.js` の return に `xLogoAmbient`, `xLogoKey` が含まれている
2. `main.js` で両ライト参照を受け取り `startRenderLoop` に渡している
3. `render-loop.js` の `animate()` 内で `breathVal` に連動して xLogo ライト強度が毎フレーム更新されている
4. 既存の呼吸アニメーション（FOV呼吸等）に影響がない
5. コミットメッセージに `Fix #58` が含まれている

## 禁止事項
- `main` ブランチへの直接 push 禁止
- `dev` への直接マージ禁止
- `bootstrap.js`, `main.js`, `render-loop.js` 以外のファイルへの変更禁止
- 新規ファイルの追加禁止
- 新規依存ライブラリの追加禁止
- ライトの色（0xffffff）の変更禁止
