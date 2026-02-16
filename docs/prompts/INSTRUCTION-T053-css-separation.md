# 指示書: T-053 index.html CSS分離リファクタリング

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## 作業ブランチ
- ベース: `feature/dev`
- 作業: `feature/t053-css-separation`

## 目的
index.html 内のインラインCSS（`<style>` タグ + `style=""` 属性）を外部CSSファイルに分離し、保守性を向上させる。

## 完了条件
1. index.html の `<style>` タグ内CSSが全て外部ファイルに移動されていること
2. HTML要素の `style=""` 属性がCSSクラスに置き換えられていること
3. index.html に `<link rel="stylesheet" href="./src/styles/main.css">` が追加されていること
4. ブラウザ表示が変更前と完全に同一であること（視覚的デグレなし）
5. コミット＆プッシュ完了

## CSS分離先

```
src/styles/main.css
```

1ファイルに統合する。セクション分けはコメントで管理:

```css
/* ============================
   Base / Reset
   ============================ */

/* ============================
   Credit (左上)
   ============================ */

/* ============================
   Overlay / Title (左下)
   ============================ */

/* ============================
   Typography (h1, subtitle, tagline)
   ============================ */

/* ============================
   English Override
   ============================ */

/* ============================
   Spacers
   ============================ */

/* ============================
   Scroll Hints
   ============================ */

/* ============================
   Control Guide (右上)
   ============================ */

/* ============================
   Articles Section
   ============================ */

/* ============================
   Devlog Gallery
   ============================ */

/* ============================
   Cards (共通)
   ============================ */

/* ============================
   Offcanvas / Session Content
   ============================ */

/* ============================
   Surface Button
   ============================ */

/* ============================
   Lightbox
   ============================ */

/* ============================
   Responsive (mobile landscape)
   ============================ */
```

## 実装手順

### Step 1: 現状確認
- `index.html` を読み、`<style>` タグ内の全CSSを把握
- HTML内の `style=""` 属性を全て洗い出す

### Step 2: 外部CSSファイル作成
- `src/styles/main.css` を新規作成
- `<style>` タグ内の全CSSをそのまま移動（変更しない）
- セクションコメントで整理

### Step 3: inline style の CSS クラス化
以下の `style=""` をCSSクラスに置換:

| 要素 | 現在の inline style | 新CSSクラス |
|---|---|---|
| `#articles-section` | `position:relative; z-index:5;` | `.section-base` |
| articles内の wrapper div | `position:relative; z-index:20; padding:3rem 1.5rem 0;` | `.section-header-wrapper` |
| articles/devlog の h2 | 長い inline style | `.section-heading` |
| `#devlogOffcanvas` | `width: 85%; background: rgba(10, 14, 26, 0.98);` | `.kesson-offcanvas` |
| `#articlesOffcanvas` | 同上 | `.kesson-offcanvas`（共通化） |
| offcanvas h5 | `letter-spacing: 0.15em;` | `.offcanvas-title` |
| `#detail-cover-img` | `cursor: pointer;` | `.clickable-img` |
| `#lightbox-image` | `max-height: 80vh; cursor: pointer;` | `.lightbox-img` |

### Step 4: index.html を更新
- `<style>` タグを削除
- `<link rel="stylesheet" href="./src/styles/main.css">` をBootstrap CSSの直後に追加
- inline `style=""` をクラス名に置換

### Step 5: 検証
- `<style>` タグが index.html に残っていないこと
- `style=""` 属性が最小限（動的に必要なもの以外ゼロ）であること
- CSSクラスの命名が一貫していること

### Step 6: コミット & プッシュ
- メッセージ: `refactor(T-053): extract inline CSS to src/styles/main.css`
- ブランチ: `feature/t053-css-separation`

## 注意事項
- CSSの値は変更しない（移動のみ）
- `@keyframes` アニメーションも外部CSSに移動する
- Bootstrap のクラス（`d-none`, `mb-3`, `row g-3` 等）はそのまま残す
- `importmap` と `<script type="module">` はHTML内に残す
- Articles の inline `<script type="module">` もHTML内に残す（JS分離は別タスク）

## 禁止事項
- main ブランチへの直接 push 禁止
- feature/dev への直接マージ禁止
- CSSの値を変更する（色、サイズ、アニメーション等）
- JavaScript の変更
- HTML構造（DOM階層）の変更
