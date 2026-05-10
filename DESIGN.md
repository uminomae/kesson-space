# kesson-space — DESIGN.md

> Self-contained design system entrypoint for Claude Design ingestion.
> Source of truth: `src/styles/tokens.css`. Programmatic version: `src/styles/tokens.json`.
> Format: [Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/format/) 9-section.

## 1. Visual Theme & Atmosphere
- **Mood**: 静謐で深い暗背景の上に、navy-blue (藍青) のアクセントが欠損 (kesson) の輪郭を彫り込む
- **Density**: ナビゲーション主導、セクション間の遷移を強く描き出す
- **Philosophy**: 欠損駆動思考 (kesson) を体現する、何があるかではなく **何が無いか** を浮かび上がらせる UI
- **Differentiator (vs creation-space / awareness-space)**: ks は **navy-blue accent palette** + **stronger nav presence** (extended color tokens で nav-gem / focus-ring / embed-handle を独立)

## 2. Color Palette & Roles

| Token | Value | Role |
|-------|-------|------|
| `--ds-color-bg-body` | `#050508` | Body 背景 (深い暗) |
| `--ds-color-accent` | `rgb(100, 150, 255)` (#6496ff) | Accent (links, focus, emphasis) |
| `--ds-color-heading` | `rgb(255, 255, 255)` | Heading 文字色 |
| `--ds-color-sub-text` | `rgb(180, 200, 230)` | Sub-text |
| `--ds-color-highlight` | `rgb(220, 230, 245)` | Highlight |
| `--ds-color-link` | `rgb(130, 170, 255)` | Link |

ks 固有 (extended color tokens, ks#181):
| Token | Value | Role |
|-------|-------|------|
| `--color-accent-soft` | `rgb(150, 190, 245)` | Card cover-note のソフト accent |
| `--color-focus-ring` | `rgb(150, 190, 255)` | Section heading focus ring |
| `--color-nav-gem` | `rgb(180, 195, 240)` | nav-label--gem ベース |
| `--color-nav-gem-hover` | `rgb(200, 215, 255)` | nav-label--gem ホバー |
| `--color-embed-handle` | `rgb(200, 215, 245)` | x-embed-handle |

Action は accent-backed (as と同型): `--ks-action-bg: rgba(accent, 0.1)`, hover で `rgba(accent, 0.2)`。

## 3. Typography Rules
- **Display Serif**: `Noto Serif JP, Yu Mincho, MS PMincho, serif` (`--ds-font-serif-display`)
- **UI Serif**: `Georgia, Noto Serif JP, serif` (`--ds-font-serif-ui`)
- **Mono**: `SF Mono, Fira Code, Consolas, monospace` (`--ds-font-mono-ui`)
- (注: ks は cs/as と異なり sans-ui を独立定義していない)

階層:
- h1: `clamp(1.0rem, 5.5vmin, 2.0rem)` (`--ds-h1-size`)
- Section heading: 0.88rem
- Card title: 1.0rem / Card text: 0.92rem
- UI base: 0.85rem (xs) / 0.88rem (sm)
- Topbar link: 0.88rem (cs と同等)

Letter spacing scale:
- tight 0.03em / normal 0.06em / wide 0.1em / heading 0.15em

## 4. Component Stylings

### Card
- bg: `--ks-card-bg` (`rgba(20, 25, 40, 0.9)` ソリッド)
- border: `--ds-card-border` / hover: `--ds-card-border-strong`
- cover-note は `--color-accent-soft` で柔らかく
- shadow: `--ds-card-shadow-soft` / `--ds-card-shadow-rich`
- radius: `--ds-radius-md` (3px)

### Topbar / Navigation (ks の主役)
- height: 3.25rem (`--ks-topbar-height`)
- bg: `rgba(10, 14, 24, 0.10)` blurred 14px
- title: `clamp(0.96rem, 1.85vw, 1.38rem)`
- nav-label--gem は `--color-nav-gem` ベース、hover で `--color-nav-gem-hover`
- 詳細は `--ks-topbar-*` 参照

### Action (button-like)
- bg: `rgba(accent, 0.1)` → hover で `rgba(accent, 0.2)` (accent-backed)
- text: sub-text 50% alpha → hover で highlight 70%
- border: `rgba(accent, 0.2)`

### Section heading
- focus ring: `--color-focus-ring` (#181 で独立した token)

### Viewer / embed
- glass bg: `rgba(12, 18, 30, 0.88)`
- x-handle: `rgba(--color-embed-handle, 0.7)`

### Dev panels / HUD
- 暗背景 (`rgba(7, 12, 24, 0.96)`) + 藍色 border
- 詳細は `--ks-dev-panel-*` / `--ks-dev-hud-*` 参照

## 5. Layout Principles
- Spacing baseline: 1rem / 1.5rem (`--ds-section-content-padding: 1rem 1.5rem 0`)
- Section grid margin top: 1.5rem
- Navigation を主役にしたセクション分割

## 6. Depth & Elevation

Z-index は `--ks-z-*` semantic tokens に集約 (cs/as と命名同型、ks#210):

```
content (1, 2) → raised (5, 6) → ui-low (10) → ui-mid (15-21)
→ topbar (60) → viewer-overlay (200) → modal-info (500)
→ dev-panel (1000) → dev-overlay (1001) → dev-hub (1100-1150)
→ slides (1500-1510)
```

Shadow:
- soft: `0 4px 12px rgba(accent, 0.15)`
- rich: `0 8px 24px rgba(0, 0, 0, 0.38), 0 0 12px rgba(accent, 0.15)`

## 7. Do's and Don'ts
- ✅ **Do**: `--ds-*` で共通 token を参照 (cs/as/ks 横断対称)
- ✅ **Do**: ks 固有値は `--ks-*` namespace
- ✅ **Do**: extended color tokens (`--color-accent-soft` / `--color-nav-gem` 等) は ks 個性として活用
- ✅ **Do**: ナビゲーションを主役に、強い nav presence で構成
- ❌ **Don't**: 生 `rgba(100, 150, 255, ...)` を書かない (token 化必須)
- ❌ **Don't**: z-index を数値直書きしない (`--ks-z-*` を使用)
- ❌ **Don't**: CDN / 多重 alias / 外部 design-system 参照 (self-contained 原則)

## 8. Responsive Behavior
- Mobile / desktop は `clamp()` ベースで自動追従
- Topbar title: `clamp(0.96rem, 1.85vw, 1.38rem)`
- h1: `clamp(1.0rem, 5.5vmin, 2.0rem)`
- 明示的 breakpoint は最小限、`vmin` / `vw` による流動スケーリング優先

## 9. Agent Prompt Guide

kesson-space スタイルで UI を生成するプロンプト雛形:

> 「kesson-space スタイルで [コンポーネント名] を作って。
> bg は `--ds-color-bg-body` (#050508)、accent は `--ds-color-accent` (#6496ff)。
> Nav 系は `--color-nav-gem` (#b4c3f0) ベース、hover で `--color-nav-gem-hover` (#c8d7ff)。
> Card cover-note は `--color-accent-soft` (#96bef5)、focus ring は `--color-focus-ring` (#96beff)。
> action は accent-backed (`rgba(accent, 0.1)` → 0.2)、
> radius は `--ds-radius-md` (3px)、
> z-index は `--ks-z-*` semantic tokens から選ぶ。
> 欠損駆動: **何があるかでなく何が無いか** で構造を作る。」

色クイック参照:
- BG: `#050508`
- Accent: `#6496ff`
- Heading: `#ffffff`
- Sub-text: `rgb(180, 200, 230)`
- Link: `rgb(130, 170, 255)`
- Nav gem: `rgb(180, 195, 240)` / hover `rgb(200, 215, 255)`
- Accent soft: `rgb(150, 190, 245)`
- Focus ring: `rgb(150, 190, 255)`
