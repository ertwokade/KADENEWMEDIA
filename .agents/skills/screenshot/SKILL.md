---
name: screenshot
description: Take before/after screenshots of the current site for visual comparison. Captures the dev server at multiple viewports and saves timestamped images. Use to document changes, compare edits visually, or create a quick visual audit. Triggers on phrases like "screenshot al", "ekran görüntüsü", "önce sonra karşılaştır", "nasıl görünüyor", "take a screenshot", "capture the page", "before/after", "show me how it looks", "visual comparison", "snap the page".
argument-hint: "[--page /path] [--before] [--after] [--compare] [--all-pages]"
user-invocable: true
---

# Screenshot

You are about to take screenshots of the running site for visual documentation or comparison.

**Arguments received:** `$ARGUMENTS`

Parse optional flags:
- `--page /path` — specific page to screenshot (default: `/`)
- `--before` — label this as a "before" snapshot (saved with `before-` prefix)
- `--after` — label this as an "after" snapshot, auto-pairs with latest `before-` for comparison
- `--compare` — side-by-side diff of latest before/after pair
- `--all-pages` — screenshot every route found in `src/app/`

## Pre-Flight

1. Check if the dev server is running at `http://localhost:3000`. If not, start it: `npm run dev` (background, wait for Ready).
2. Confirm browser MCP is available. If not, stop and tell the user.
3. Determine the label: `before`, `after`, or `snapshot` (default if neither flag given).
4. Ensure `docs/design-references/` exists.

## Screenshot Flow

### Single page (default)

For each target page, take screenshots at 3 viewports in this order:

1. **Desktop** — 1440 × 900px viewport, full-page scroll capture
2. **Tablet** — 768 × 1024px viewport, full-page scroll capture  
3. **Mobile** — 390 × 844px viewport, full-page scroll capture

**File naming:**
```
docs/design-references/<label>-<page-slug>-desktop-<YYYYMMDD-HHMMSS>.png
docs/design-references/<label>-<page-slug>-tablet-<YYYYMMDD-HHMMSS>.png
docs/design-references/<label>-<page-slug>-mobile-<YYYYMMDD-HHMMSS>.png
```

Examples:
- `before-home-desktop-20250315-143022.png`
- `after-home-desktop-20250315-143512.png`

### All pages (`--all-pages`)

Discover all routes by reading `src/app/` directory structure. For each `page.tsx` found, derive the route path and screenshot it at all 3 viewports.

Skip: `src/app/api/`, `src/app/_`, dynamic routes like `[slug]` (skip unless example data is available).

### Section-level screenshots

If the user mentions a specific section (e.g., "hero bölümünün screenshot'ını al"), scroll to that section and screenshot just the viewport showing that section. Save with the section name in the filename.

## Comparison Mode (`--compare`)

When `--compare` is passed, or when `--after` is passed and a matching `before-` file exists:

1. Find the most recent `before-<page>-<viewport>-*.png` for each viewport
2. Find the most recent `after-<page>-<viewport>-*.png` for each viewport
3. Create a side-by-side comparison image using browser MCP canvas, or describe the differences textually if image merging isn't available:

**Textual comparison format:**
```
## Visual Comparison: home — desktop

Before: before-home-desktop-20250315-143022.png
After:  after-home-desktop-20250315-143512.png

Observed changes:
- Hero heading: font size appears larger
- Primary button: color changed from blue to orange
- Navbar: background is now white (was transparent)
- Footer: added new link column

No visible regressions detected in:
- Card section layout
- Testimonials section
- Mobile navigation
```

## Output

After all screenshots are taken, display:

```
## Screenshots Taken

### Home (/)
- 📸 Desktop: docs/design-references/<filename>
- 📸 Tablet:  docs/design-references/<filename>
- 📸 Mobile:  docs/design-references/<filename>

### [Other pages if --all-pages]
...

Total: X screenshots saved to docs/design-references/
```

If `--compare` was used, append the comparison report.

## Quick Usage Patterns

**Before an edit:**
```
/screenshot --before
```

**After an edit:**
```
/screenshot --after --compare
```

**Just see how a specific page looks:**
```
/screenshot --page /about
```

**Full site audit:**
```
/screenshot --all-pages
```
