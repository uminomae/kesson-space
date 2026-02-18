# 指示書: x-logoの浮遊アニメーション復活（v3 — 子メッシュに直接適用）

## Issue
https://github.com/uminomae/kesson-space/issues/54

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## 作業ブランチ
- ベース: `dev`
- 作業: `feature/kesson-codex-app-xlogo-float54-v3`

## 背景
v1: `updateXLogo()` から `applyXLogoGroupPosition()` に yOffset を渡した → ソルバー入力に加算されて打ち消された
v2: ソルバー出力後に group.position.y に yOffset を加算した → コード上は正しいが、振幅が微小で視覚的に揺れが見えない

**v3 の方針**: group.position はビューポートソルバー専用とし、浮遊アニメーションは **group 内部の子オブジェクト** (`_xLogoRoot` または `_xLogoMesh`) に直接適用する。これはPDFオーブの `obj.position.y = data.baseY + floatOffset` と同じパターン。

## 対象ファイル
- `src/nav-objects.js`

## 実装手順

### Step 1: ファイルを読む
リモート `feature/kesson-codex-app-xlogo-float54-v3` ブランチの `src/nav-objects.js` を読み、
`updateXLogo()` 関数と `applyXLogoGroupPosition()` 関数を確認する。

### Step 2: applyXLogoGroupPosition() を修正 — yOffset パラメータを削除
v2 で追加した yOffset は不要になるため、元に戻す。

**現状のコード:**
```js
function applyXLogoGroupPosition(group, camera = _xLogoCamera, yOffset = 0) {
    if (!group) return;
    const worldY = xLogoParams.posY;
    const { posX, posY, posZ } = getResponsiveXLogoPosition(camera, worldY);
    group.userData.baseY = xLogoParams.posY;
    group.position.set(posX, posY + yOffset, posZ);
}
```

**修正後:**
```js
function applyXLogoGroupPosition(group, camera = _xLogoCamera) {
    if (!group) return;
    const worldY = xLogoParams.posY;
    const { posX, posY, posZ } = getResponsiveXLogoPosition(camera, worldY);
    group.userData.baseY = xLogoParams.posY;
    group.position.set(posX, posY, posZ);
}
```

変更点:
1. 第3引数 `yOffset = 0` を削除
2. `posY + yOffset` を `posY` に戻す

### Step 3: updateXLogo() を修正 — 子メッシュに浮遊を適用

**現状のコード（updateXLogo 内の先頭部分）:**
```js
export function updateXLogo(time, camera = _xLogoCamera) {
    _xLogoCamera = camera || _xLogoCamera;
    if (!_xLogoGroup) return;
    // 浮遊アニメーション（ゆらゆら）
    const floatOffset = Math.sin(time * 0.6) * 0.15;
    applyXLogoGroupPosition(_xLogoGroup, _xLogoCamera, floatOffset);
```

**修正後:**
```js
export function updateXLogo(time, camera = _xLogoCamera) {
    _xLogoCamera = camera || _xLogoCamera;
    if (!_xLogoGroup) return;

    // グループ位置はビューポートソルバーで確定（浮遊オフセットなし）
    applyXLogoGroupPosition(_xLogoGroup, _xLogoCamera);

    // 浮遊アニメーション: グループ内の子メッシュに直接適用
    const floatY = Math.sin(time * 0.6) * 0.15;
    const data = _xLogoGroup.userData;
    if (data.xLogoRoot) {
        data.xLogoRoot.position.y = floatY;
    } else if (data.xLogoMesh) {
        data.xLogoMesh.position.y = floatY;
    }
```

変更点:
1. `applyXLogoGroupPosition` 呼び出しから `floatOffset` 引数を除去
2. `floatY` を計算し、`_xLogoGroup.userData.xLogoRoot.position.y` （または fallback で `xLogoMesh.position.y`）に直接代入
3. 子メッシュの初期 y は 0 なので、`floatY` がそのまま浮遊振幅になる

### Step 4: コミット & プッシュ
- メッセージ: `fix: apply float animation to child mesh instead of group (Fix #54)`
- ブランチ: `feature/kesson-codex-app-xlogo-float54-v3`

## 完了条件
1. `applyXLogoGroupPosition()` から yOffset パラメータが削除されている
2. `updateXLogo()` 内で子メッシュ（`xLogoRoot` or `xLogoMesh`）の `position.y` に `Math.sin(time * 0.6) * 0.15` が毎フレーム代入されている
3. ビューポート基準のレスポンシブ配置が維持されている
4. 他のオブジェクト（オーブ、Gem）に変更がない
5. コミットメッセージに `Fix #54` が含まれている

## 禁止事項
- `main` ブランチへの直接 push 禁止
- `dev` への直接マージ禁止
- `applyXLogoGroupPosition()` と `updateXLogo()` 以外の関数への変更禁止
- 新規ファイルの追加禁止
- 新規依存ライブラリの追加禁止
