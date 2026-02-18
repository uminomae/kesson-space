# 指示書: #65 CSS Custom Properties化 — Phase 1 カラー変数化

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/65

## 作業ブランチ
- ベース: `feature/dev`
- 作業: `feature/kesson-codex-app-css-vars65`

## スコープ
**Phase 1 のみ**: main.css のハードコードされたカラー値を CSS Custom Properties に置換する。
見た目は一切変えない（リファクタリングのみ）。

## 実装手順

### Step 1: 対象ファイルを読む
- リモート `feature/kesson-codex-app-css-vars65` ブランチの `src/styles/main.css`

### Step 2: `:root` にカラー変数を定義
ファイル先頭の既存 `:root` ブロックに以下を追加する（既存の `--kesson-*` 変数はそのまま残す）:

```css
:root {
  /* === 既存変数（変更しない） === */
  /* --kesson-focus-ring, --kesson-card-bg, etc. */

  /* === カラーパレット（RGB値のみ） === */
  --color-accent: 100, 150, 255;
  --color-sub-text: 180, 200, 230;
  --color-highlight: 220, 230, 245;
  --color-link: 130, 170, 255;
  --color-heading: 255, 255, 255;
  --color-bg-body: #050508;
}
```

### Step 3: ハードコード値を変数参照に置換

以下のパターンをすべて置換する:

| 検索パターン | 置換先 |
|---|---|
| `rgba(100, 150, 255, X)` | `rgba(var(--color-accent), X)` |
| `rgb(100, 150, 255)` | `rgb(var(--color-accent))` |
| `rgba(180, 200, 230, X)` | `rgba(var(--color-sub-text), X)` |
| `rgb(180, 200, 230)` | `rgb(var(--color-sub-text))` |
| `rgba(220, 230, 245, X)` | `rgba(var(--color-highlight), X)` |
| `rgb(220, 230, 245)` | `rgb(var(--color-highlight))` |
| `rgba(130, 170, 255, X)` | `rgba(var(--color-link), X)` |
| `rgb(130, 170, 255)` | `rgb(var(--color-link))` |
| `rgba(255, 255, 255, X)` | `rgba(var(--color-heading), X)` |
| `rgb(255, 255, 255)` | `rgb(var(--color-heading))` |
| `#050508` (background) | `var(--color-bg-body)` |

**重要な注意:**
- `X` は各箇所固有の opacity 値（0.05, 0.2, 0.75 など）。opacity 値自体は変更しない。
- `rgba(100, 150, 255,` のようにスペースの有無やカンマ後のスペースに揺れがある可能性がある。正規表現で柔軟にマッチすること。
- `rgba(150, 175, 210, X)` や `rgba(200, 215, 240, X)` など、上記パターンに完全一致しない中間色がある場合は **変換しない**。判断に迷うものはスキップし、コミットメッセージに未変換の理由をメモすること。
- session-content 固有色（`#e2e8f0`, `#94a3b8`, `#f59e0b`）は Phase 1 スコープ外。変更しない。

### Step 4: 検証
- 変換前後で `:root` 変数以外の新規プロパティや値の追加がないこと
- `node --check` は CSS なので不要だが、構文エラー（閉じ括弧漏れ等）がないか目視
- 置換数をカウントし、コミットメッセージに記載（例: `44箇所のaccent, 25箇所のsub-text を変数化`）

### Step 5: コミット & プッシュ
- メッセージ: `refactor(css): extract hardcoded colors to CSS custom properties (Fix #65)`
- メッセージ本文に置換数サマリーを含める
- ブランチ: `feature/kesson-codex-app-css-vars65`

## 完了条件
1. main.css の `:root` に 6 つのカラー変数が定義されている
2. `rgba(100, 150, 255, ...)` 等のハードコード値がすべて `rgba(var(--color-accent), ...)` 形式に置換されている
3. 見た目が一切変わらない（opacity 値の変更なし、色の変更なし）
4. 既存の `--kesson-*` 変数に影響がない
5. コミットメッセージに置換数サマリーがある

## 禁止事項
- main ブランチへの直接 push 禁止
- feature/dev への直接マージ禁止
- main.css 以外のファイル変更禁止
- フォント変数化（Phase 2）に手を出さない
- 上記パターン表に完全一致しない色の変換禁止
- 新規 npm / CDN 依存の追加禁止
