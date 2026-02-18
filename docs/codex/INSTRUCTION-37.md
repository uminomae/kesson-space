# 指示書: #37 innerHTML未サニタイズ — DOMPurify導入

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/37

## 作業ブランチ
- ベース: `feature/dev`
- 作業: `feature/kesson-codex-app-sanitize37`

## 概要
外部データ（JSON/markdown）を `innerHTML` へサニタイズせずに挿入している3箇所に DOMPurify を導入する。

## 対象ファイルと修正内容

### 1. DOMPurify の CDN 追加

`index.html` の `<script type="importmap">` に DOMPurify を追加する:
```json
"dompurify": "https://cdn.jsdelivr.net/npm/dompurify@3.2.4/dist/purify.es.mjs"
```

`devlog.html` の `<script type="importmap">` にも同様に追加する。

### 2. `src/pages/articles-section.js`

**対象**: `createCard()` 関数（innerHTML でカード HTML を組み立てている箇所）

**修正方針**: DOM API（createElement / textContent）ベースの構築に変更する。

具体的には:
- `item.url` にプロトコル検証を追加（`https://` と `http://` のみ許可、それ以外は `#` にフォールバック）
- `item.title`, `item.excerpt` は `textContent` で挿入
- `item.teaser`（画像URL）にもプロトコル検証を追加
- `innerHTML` による一括代入を廃止し、`createElement` + `appendChild` で組み立てる

### 3. `src/viewer.js`

**対象**: `openPdfViewer()` 関数内の `marked.parse(body)` → `innerHTML` 代入

**修正方針**: DOMPurify でサニタイズしてから挿入。

```javascript
import DOMPurify from 'dompurify';
```

`openPdfViewer()` 内:
```javascript
// 変更前
const html = marked.parse(body);
// 変更後
const html = DOMPurify.sanitize(marked.parse(body));
```

`openViewer()` 関数内の `contentEl.innerHTML = content;` も同様に:
```javascript
contentEl.innerHTML = DOMPurify.sanitize(content);
```

注意: `openXTimeline()` 内の DOM 構築は createElement ベースなので変更不要。ただし `footer.innerHTML` のリンク部分は `escapeHtml()` 済みの `handle` と `xUrl` を使っているので許容。

### 4. `devlog.html`

**対象**: インラインスクリプト内の `contentEl.innerHTML = rawContent ? marked.parse(rawContent) : '';`

**修正方針**: DOMPurify でサニタイズ。

```javascript
import DOMPurify from 'dompurify';
```

```javascript
// 変更前
contentEl.innerHTML = rawContent ? marked.parse(rawContent) : '';
// 変更後
contentEl.innerHTML = rawContent ? DOMPurify.sanitize(marked.parse(rawContent)) : '';
```

## 完了条件
1. 上記3ファイルの全 innerHTML 代入箇所がサニタイズ済みまたは DOM API ベースに変更されていること
2. DOMPurify が importmap 経由で読み込まれていること（npm install 不要）
3. `index.html` を手動で開いて articles カードが表示されること（ブラウザテスト不要、構文エラーがないことの確認で可）
4. コミットメッセージに `Fix #37` を含めること

## 禁止事項
- main ブランチへの直接 push 禁止
- feature/dev への直接マージ禁止
- 対象外ファイルの変更禁止
- npm / package.json への依存追加禁止（CDN importmap のみ）
- 既存の `escapeHtml()` 関数の削除禁止（他箇所で使用中）
- viewer.js の `openXTimeline()` 内の DOM 構築は変更しないこと
