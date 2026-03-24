<!-- Ported from: creation-space (2026-03-24) -->
# デザインシステム -- CSS デザイントークン

**正本**: `src/styles/main.css` の `:root` ブロック

## 正本参照

| 層 | 正本 | 確認方法 |
|---|---|---|
| デザイントークン（変数値） | `src/styles/main.css` の `:root` | ファイルを直接読む |
| 変更ルール・制約 | 本ファイル | -- |

## CSS変更前に必ず行うこと

1. 本ファイルを読む
2. `src/styles/main.css` の `:root` を読み、変更対象の変数がどのコンポーネントで使われているかを確認する

## 変更してよい範囲

- 色の値（色相・彩度・明度の微調整）
- フォントサイズの `clamp()` 値
- `radius`, `transition` の値
- 新しいコンポーネント変数の追加

## 変更時に守るべき制約

- 変数名の命名規則: `--kesson-{category}-{name}` または `--color-{name}`
- `rgb()` ではなく `r, g, b` の 3 値で定義する。`rgba()` で透明度を柔軟に変えるため
- ダークテーマ前提: 背景は暗い。テキストは明るい。コントラストを確保する
- `main.css` を変更したら影響範囲を確認する
- **Bootstrap 優先**: レイアウト・スペーシング・ボタン・レスポンシブ制御は Bootstrap ユーティリティクラスを最優先で使う。カスタム CSS は Bootstrap で実現不可能なものに限定する

## カテゴリと命名パターン

| prefix | 用途 | 例 |
|---|---|---|
| `--color-*` | 基本パレット | accent, sub-text, highlight, link, heading, bg-body |
| `--kesson-font-*` | タイポグラフィ | serif-display, serif-ui, mono-ui, size-ui-xs/sm/arrow |
| `--kesson-letter-*` | レタースペーシング | ui-tight, ui-normal, ui-wide, ui-heading |
| `--kesson-radius-*` | ボーダー半径 | sm, md, lg |
| `--kesson-transition-*` | トランジション | standard, snappy |
| `--kesson-focus-*` | フォーカスリング | ring, ring-soft |
| `--kesson-ui-*` | UI 部品 | label-color, arrow-color, label-hover-color |
| `--kesson-action-*` | ボタン・アクション | bg, border, text, bg-hover, text-hover |
| `--kesson-card-*` | カードコンポーネント | border, border-strong, shadow-soft, shadow-rich, bg |
| `--kesson-offcanvas-*` | オフキャンバスパネル | text, heading, link, width, bg |
| `--kesson-viewer-*` | ビューワー | overlay-closed/open, glass-bg/border/shadow, x-handle |
| `--kesson-md-*` | Markdown 要素 | h1-h4, link, quote, inline-code, table-*, strong, em, pre-bg, pdf-link |
| `--kesson-error-*` | エラー表示 | color, size |
| `--kesson-scrollbar-*` | スクロールバー | thumb |
| `--kesson-dev-*` | 開発モード | toggle-bg, toggle-bg-hover, toggle-border |
| `--kesson-section-*` | セクション | content-padding, grid-margin-top |
| `--kesson-topbar-*` | トップバー | main-title-size, main-title-size-sm, title-size |

## 判断基準

- サイト全体の空気を変えたいなら root token を触る
- 特定 UI だけを調整したいなら component-local 変数を優先する
- 同じ色や影の値を複数 CSS に直書きしている箇所を見つけたら、新規直書きは増やさず token へ寄せる
