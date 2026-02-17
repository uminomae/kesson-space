# INSTRUCTION-42: 言語切替時スクロール位置修正

## Issue
https://github.com/uminomae/kesson-space/issues/42

## ブランチ
`feature/kesson-codex-app-scroll42`（feature/dev から分岐）

## 現状
DT（プロジェクト管理）が暫定的に以下2箇所を修正済み。品質確認・調整が必要。

### 1. `index.html` — `<head>` 内インラインスクリプト（DT追加済み）
```html
<script>if('scrollRestoration' in history) history.scrollRestoration='manual';</script>
```
- ブラウザのスクロール復元をJSモジュール実行前に無効化する
- これがないと、switchLang()内の設定はリロード後のブラウザ復元に間に合わない

### 2. `src/i18n.js` — `switchLang()` 内（DT追加済み）
```js
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
```

## タスク

### 必須
1. `index.html` の `<head>` インラインスクリプトが正しく動作するか確認
2. lang切替（JA→EN、EN→JA）後にページトップ（scrollY === 0）から開始することを確認
3. 下までスクロールした状態でlang切替しても、トップに戻ることを確認

### 判断が必要な点
- `i18n.js` switchLang() 内の `scrollRestoration` + `scrollTo` は `<head>` インラインと重複している。ベルト＆サスペンダーとして残すか、冗長として削除するか判断してよい（どちらでもOK、コミットメッセージに理由を記載）

### 禁止
- 他ファイルへの変更（スコープ外）
- 新規依存の追加

## 完了条件
- lang切替後にページトップから開始する（scrollY === 0）
- 既存のスクロール連動UI（カメラ潜水、フェードイン/アウト）が壊れていない
- コミットメッセージに `Fix #42` を含める
