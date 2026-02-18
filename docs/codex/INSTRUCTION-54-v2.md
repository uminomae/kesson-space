# 指示書: x-logoの浮遊アニメーション復活（v2 — ソルバー出力後に加算）

## Issue
https://github.com/uminomae/kesson-space/issues/54

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## 作業ブランチ
- ベース: `dev`
- 作業: `feature/kesson-codex-app-xlogo-float54-v2`

## 背景
前回の修正（v1）では `updateXLogo()` から `applyXLogoGroupPosition()` の第3引数 yOffset に
浮遊オフセットを渡したが、効果がなかった。

**根本原因**: `applyXLogoGroupPosition()` 内で yOffset を worldY に加算してから
ビューポート%ソルバー（`getResponsiveXLogoPosition`）に渡しているが、
ソルバーが「画面上から20%の位置」を満たすY座標を逆算するため、
yOffset の効果が完全に打ち消される。

**正しい修正**: ソルバーの出力後に yOffset を加算する。

## 対象ファイル
- `src/nav-objects.js`

## 実装手順

### Step 1: ファイルを読む
リモート `feature/kesson-codex-app-xlogo-float54-v2` ブランチの `src/nav-objects.js` を読み、
`applyXLogoGroupPosition()` 関数を確認する。

### Step 2: applyXLogoGroupPosition() を修正
ソルバーへの入力から yOffset を除外し、ソルバー出力後に yOffset を加算する。

**現状のコード:**
```js
function applyXLogoGroupPosition(group, camera = _xLogoCamera, yOffset = 0) {
    if (!group) return;
    const worldY = xLogoParams.posY + yOffset;
    const { posX, posY, posZ } = getResponsiveXLogoPosition(camera, worldY);
    group.userData.baseY = xLogoParams.posY;
    group.position.set(posX, posY, posZ);
}
```

**修正後:**
```js
function applyXLogoGroupPosition(group, camera = _xLogoCamera, yOffset = 0) {
    if (!group) return;
    const worldY = xLogoParams.posY;
    const { posX, posY, posZ } = getResponsiveXLogoPosition(camera, worldY);
    group.userData.baseY = xLogoParams.posY;
    group.position.set(posX, posY + yOffset, posZ);
}
```

変更点は2箇所:
1. `const worldY = xLogoParams.posY + yOffset;` → `const worldY = xLogoParams.posY;`
   （ソルバー入力から yOffset を除外）
2. `group.position.set(posX, posY, posZ);` → `group.position.set(posX, posY + yOffset, posZ);`
   （ソルバー出力後に yOffset を加算）

### Step 3: updateXLogo() に浮遊オフセットがあることを確認
`updateXLogo()` 関数内に既に以下のコードがあることを確認する（v1で追加済み）:
```js
const floatOffset = Math.sin(time * 0.6) * 0.15;
applyXLogoGroupPosition(_xLogoGroup, _xLogoCamera, floatOffset);
```
もしなければ追加する。

### Step 4: コミット & プッシュ
- メッセージ: `fix: apply float offset after viewport solver (Fix #54)`
- ブランチ: `feature/kesson-codex-app-xlogo-float54-v2`

## 完了条件
1. `applyXLogoGroupPosition()` でソルバー入力に yOffset を含めない
2. `applyXLogoGroupPosition()` でソルバー出力の posY に yOffset を後付け加算する
3. `updateXLogo()` 内で floatOffset が `applyXLogoGroupPosition()` に渡されている
4. ビューポート基準のレスポンシブ配置が維持されている
5. 他のオブジェクト（オーブ、Gem）に変更がない
6. コミットメッセージに `Fix #54` が含まれている

## 禁止事項
- `main` ブランチへの直接 push 禁止
- `dev` への直接マージ禁止
- `applyXLogoGroupPosition()` と `updateXLogo()` 以外の関数への変更禁止
- 新規ファイルの追加禁止
- 新規依存ライブラリの追加禁止
