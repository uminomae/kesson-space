# 指示書: x-logoの浮遊アニメーション復活

## Issue
https://github.com/uminomae/kesson-space/issues/54

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## 作業ブランチ
- ベース: `dev`
- 作業: `feature/kesson-codex-app-xlogo-float54`

## 背景
x-logo（Three.js 3Dオブジェクト）のゆらゆらした浮遊アニメーションが消えている。
PDFオーブには `Math.sin(time * 0.8 + index) * 0.3` による y軸浮遊があるが、
x-logoの `updateXLogo()` には浮遊処理がない。

`applyXLogoGroupPosition()` は既に `yOffset` パラメータ（第3引数）を受け取る構造になっているが、
`updateXLogo()` からの呼び出しでは `yOffset` を渡していない。

## 対象ファイル
- `src/nav-objects.js`

## 実装手順

### Step 1: 現状確認
リモート `feature/kesson-codex-app-xlogo-float54` ブランチの `src/nav-objects.js` を読み、
`updateXLogo()` 関数を確認する。

### Step 2: updateXLogo() に浮遊オフセットを追加
`updateXLogo()` 関数内の `applyXLogoGroupPosition()` 呼び出しの **直前** に
浮遊オフセット計算を追加し、第3引数として渡す。

**現状のコード（修正対象箇所）:**
```js
export function updateXLogo(time, camera = _xLogoCamera) {
    _xLogoCamera = camera || _xLogoCamera;
    if (!_xLogoGroup) return;
    // X/Yともに画面基準%でアンカーする（必要時のみ可視クランプ）。
    applyXLogoGroupPosition(_xLogoGroup, _xLogoCamera);
```

**修正後:**
```js
export function updateXLogo(time, camera = _xLogoCamera) {
    _xLogoCamera = camera || _xLogoCamera;
    if (!_xLogoGroup) return;
    // 浮遊アニメーション（ゆらゆら）
    const floatOffset = Math.sin(time * 0.6) * 0.15;
    applyXLogoGroupPosition(_xLogoGroup, _xLogoCamera, floatOffset);
```

### Step 3: コミット & プッシュ
- メッセージ: `fix: restore x-logo floating animation (Fix #54)`
- ブランチ: `feature/kesson-codex-app-xlogo-float54`

## 完了条件
1. `updateXLogo()` 内で `applyXLogoGroupPosition()` に浮遊オフセット（yOffset）が渡されている
2. 浮遊パラメータ: 周期 `time * 0.6`、振幅 `0.15`（オーブより控えめ）
3. ビューポート基準のレスポンシブ配置（`applyXLogoGroupPosition` の既存ロジック）が維持されている
4. 他のオブジェクト（オーブ、Gem）に変更がない
5. コミットメッセージに `Fix #54` が含まれている

## 禁止事項
- `main` ブランチへの直接 push 禁止
- `dev` への直接マージ禁止
- `src/nav-objects.js` の `updateXLogo()` 以外の関数への変更禁止
- 新規ファイルの追加禁止
- 新規依存ライブラリの追加禁止
