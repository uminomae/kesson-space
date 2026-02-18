# Bugfix: T-055 Keyboard Navigation Not Working

## Symptom
- Tab key does NOT move focus between nav-label buttons
- Focus ring (outline) does NOT appear on keyboard focus
- Enter/Space does NOT trigger link action on focused label

Other features (orb display, hover, click, scroll fade) all work correctly.

## Root Cause Analysis

### Issue 1: Duplicate `.nav-label` CSS blocks in main.css
`src/styles/main.css` contains TWO `.nav-label` definition blocks:
- **Block A** (around line 30): Original from index.html extraction. Has `:focus-visible` and `.is-nav-focused` rules with `text-shadow` transition.
- **Block B** (near end, after "T-018: Extracted from nav-objects.js" comment): Duplicate extraction. Has only `:focus` rule, no `.is-nav-focused` match. Overwrites Block A's base properties.

**Fix**: Remove Block B entirely (the duplicate `.nav-label`, `.nav-label:focus`, `.nav-label:hover`, `.nav-label--gem`, `.nav-label--x` rules near end of file). Keep ONLY Block A. Keep `.nav-label--hidden` from Block B (move it next to Block A if not already present).

### Issue 2: Verify JS keyboard handlers work after CSS fix
After fixing CSS, verify in browser:
1. Tab cycles through: orb labels (3) → Gem label → X logo label
2. Focus ring (blue outline) appears on focused label
3. Enter/Space on focused orb label opens PDF viewer
4. Enter/Space on Gem/X label opens external link

## Files to Modify

### `src/styles/main.css`
1. Find the SECOND `.nav-label` block (after the comment `T-018: Extracted from nav-objects.js injectNavLabelStyles()`).
2. Delete ALL duplicate rules from that section: `.nav-label`, `.nav-label:focus`, `.nav-label:hover`, `.nav-label--gem`, `.nav-label--gem:hover`, `.nav-label--x`, `.nav-label--x:hover`.
3. KEEP `.nav-label--hidden` — move it right after the first `.nav-label` block (Block A) if it doesn't already exist there.
4. Verify Block A already has these rules (should exist, do not re-add if present):
   ```css
   .nav-label:focus-visible,
   .nav-label.is-nav-focused {
     outline: 2px solid rgba(100, 150, 255, 0.86);
     outline-offset: 4px;
     filter: blur(0px) !important;
     text-shadow: 0 0 18px rgba(110, 160, 255, 0.72), 0 0 6px rgba(0, 0, 0, 0.85);
   }
   ```

### `src/nav-objects.js` — No changes expected
The JS code (createHtmlLabel, syncLabelFocusState, keydown handler) looks correct. If CSS fix alone doesn't resolve the issue, investigate:
- Whether `syncLabelFocusState` called every frame in `updateSingleLabel` is force-blurring a focused element
- Whether canvas event listeners are preventing keyboard events from reaching buttons

## Testing
1. Open site locally (`python3 -m http.server 8080`)
2. Press Tab key — focus should cycle through all 5 nav labels
3. Focused label should show blue outline ring
4. Press Enter or Space on a focused label — should open PDF/external link
5. Scroll down — labels should fade and become non-focusable (tabIndex=-1)
6. Scroll back up — labels should become focusable again

## Commit Message
```
fix(T-055): remove duplicate nav-label CSS that blocked keyboard focus styles
```

## Branch Strategy
- Work on: `feature/bugfix-t055-keyboard-nav`
- Target merge: `dev`
