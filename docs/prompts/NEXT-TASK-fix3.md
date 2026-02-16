# NEXT-TASK-fix3.md — T-040-11-fix3: スペース調整 + TRACES名称変更

## タスク概要
1. Articles セクションの余分なスペースを削除（Bootstrap標準のコンテナ並びに）
2. スクロール時の左上ヘッダー表示を「DEVLOG」→「TRACES」に変更、サブテキスト（セッション数）を削除

## 出力先
🌿 ブランチ: `claude/articles-read-more-offcanvas-Ddbu0`（GitHub API経由）

## 変更内容

### 変更1: Articles セクションのスペース削除

**ファイル**: `index.html`

Articles セクション（`#articles-section`）のインラインスタイルから余分なpaddingを削除。

BEFORE (約713行目):
```html
<section id="articles-section" style="position:relative; z-index:5; padding:3rem 1.5rem;">
```

AFTER:
```html
<section id="articles-section" style="position:relative; z-index:5;">
```

また、CSSの `#articles-section` ブロック（約323行目）に不要なスタイルがあれば確認し、最小限にする。

### 変更2: DEVLOG → TRACES（左上スクロールヘッダー）

**ファイル**: `index.html`

#### 2a: devlog-gallery-section 内のインライン見出し

BEFORE:
```html
<h2 style="...">DEVLOG</h2>
<div id="devlog-inline-count" style="..."></div>
```

AFTER:
```html
<h2 style="...">TRACES</h2>
```

`devlog-inline-count` の div は **削除**。

#### 2b: devlog-gallery-header（fixed表示）

BEFORE:
```html
<div id="devlog-gallery-header">
  <h2>devlog</h2>
  <div class="count" id="gallery-session-count"></div>
</div>
```

AFTER:
```html
<div id="devlog-gallery-header">
  <h2>TRACES</h2>
</div>
```

`gallery-session-count` の div は **削除**。

#### 2c: CSS の .count スタイル

以下のCSSルールを削除:
```css
#devlog-gallery-header .count {
  font-size: 0.65rem;
  color: rgba(180, 200, 230, 0.35);
  margin-top: 4px;
}
```

#### 2d: JS でカウントを設定しているコード

`gallery-session-count` や `devlog-inline-count` に値を設定しているJSコードがあれば、該当行を削除（エラー回避）。src/devlog.js 等を確認すること。

## コミット
```
fix(T-040-11): Remove articles padding + rename DEVLOG to TRACES
```

## 完了条件
- [ ] Articles セクションの余分なpadding削除
- [ ] 左上ヘッダー「DEVLOG」→「TRACES」
- [ ] セッション数サブテキスト削除（HTML + CSS + JS参照）
- [ ] コンソールエラーなし
