---
name: rich-slides
description: >
  Generate visually rich, self-contained 16:9 HTML slide decks from Markdown input.
  Use this skill whenever the user wants to create slides, presentations, or deck-style
  content for browser viewing or web publishing. Triggers on: "slides", "presentation",
  "deck", "slide show", or any request to convert markdown/text into a visual slide format.
  Produces HTML files, not .pptx.
---

# Rich Slides — MD to Browser-Ready 16:9 HTML Slides

## What This Skill Does

Transforms Markdown content into a self-contained, visually polished HTML file that
displays as a 16:9 slide deck in the browser. The output is a single `.html` file with
all CSS and JS inlined — no external dependencies, ready to deploy to any static site.

## Design Philosophy

The visual language is a dark glassmorphism theme matching kesson-space's design system.
Deep navy/charcoal backgrounds, frosted glass cards, subtle gradient accents
(blue -> violet -> green), and generous typography.

## Workflow

### Step 1: Understand the Input

The user provides content in one of these forms:

1. **Markdown with `---` slide separators** — Each `---` on its own line starts a new slide
2. **Plain text or bullet points** — You structure it into slides
3. **A file path to an existing .md** — Read and convert
4. **A topic** — You write the content AND create the slides

### Step 2: Generate the HTML

Run the generation script:

```bash
python3 scripts/generate-rich-slides.py \
  --input input.md \
  --output output.html \
  --title "Presentation Title" \
  --lang ja
```

Or with positional argument (output defaults to .html extension):

```bash
python3 scripts/generate-rich-slides.py content/guides/my-slides.md
```

### Step 3: Display via slide-viewer

The generated HTML is displayed in the browser via `openRichSlideViewer()`:

```js
import { openRichSlideViewer } from './src/slide-viewer.js';
openRichSlideViewer({ htmlUrl: './content/guides/my-slides.html', title: 'My Title' });
```

## File Organization

```
scripts/
  generate-rich-slides.py           <- Python script for MD -> HTML conversion

docs/
  rich-slides-design-spec.md        <- Detailed CSS patterns and layout templates

transform/rich-slides/
  SKILL.md                          <- This file (skill definition)

src/
  slide-viewer.js                   <- openRichSlideViewer() + openSlideViewer()
```

## References

- Read `docs/rich-slides-design-spec.md` for detailed CSS patterns, HTML structures,
  and layout templates for each slide type
- Ported from creation-space (2026-03-24)
