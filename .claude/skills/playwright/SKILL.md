---
name: playwright
description: Launch the dev server and run visual + interactive tests on the current Next.js project using Playwright. Tests responsive behavior, hover/scroll/click interactions, animations, and cross-browser rendering. Use after any edit to verify nothing broke. Triggers on phrases like "test et", "görsel test", "playwright çalıştır", "responsive kontrol et", "butonları test et", "scroll davranışı doğrula", "run playwright", "visual test", "check responsive", "test interactions", "verify animations", "does it look right".
argument-hint: "[--url http://localhost:3000] [--page /about] [--mobile] [--full]"
user-invocable: true
---

# Playwright Visual & Interactive Test

You are about to launch the dev server and visually test the current state of the site using Playwright (via browser MCP or Playwright MCP).

**Arguments received:** `$ARGUMENTS`

Parse optional flags:
- `--url` — base URL to test (default: `http://localhost:3000`)
- `--page /path` — specific page to test (default: `/`, can specify multiple)
- `--mobile` — focus on mobile viewport testing
- `--full` — run the complete test suite (all viewports, all interactions)

## Pre-Flight

1. Check if the dev server is already running. If not, start it: `npm run dev` (run in background, wait for "Ready" output before proceeding).
2. Verify browser MCP or Playwright MCP is available. If neither is connected, tell the user and stop.
3. If `--url` is not provided, default to `http://localhost:3000`.

## Test Suite

Run these tests in order. For each test, take a screenshot and note any issues found.

---

### 1. Desktop Baseline (1440px)

Navigate to the target page at 1440px viewport width.

- [ ] Page loads without console errors (check browser console)
- [ ] All sections are visible — no hidden overflow, no zero-height containers
- [ ] Images load (no broken image icons)
- [ ] Fonts render correctly (not falling back to system fonts)
- [ ] No horizontal scrollbar at 1440px
- [ ] Take a full-page screenshot → save as `docs/design-references/test-desktop-<timestamp>.png`

---

### 2. Tablet (768px)

Resize to 768px viewport width.

- [ ] Layout reflows correctly — no overlapping elements
- [ ] Navigation adapts (hamburger menu appears if applicable)
- [ ] Text remains readable (no clipping, no overflow)
- [ ] Images scale correctly
- [ ] Take screenshot → `docs/design-references/test-tablet-<timestamp>.png`

---

### 3. Mobile (390px)

Resize to 390px viewport width.

- [ ] Single-column layout works
- [ ] Touch targets are large enough (buttons/links at least 44px tall)
- [ ] No horizontal scroll
- [ ] Navigation is accessible (hamburger menu opens/closes)
- [ ] Hero text is readable without zooming
- [ ] Take screenshot → `docs/design-references/test-mobile-<timestamp>.png`

---

### 4. Navigation & Routing

- [ ] Click every nav link — verify correct page loads, no 404s
- [ ] Browser back button works correctly
- [ ] Active nav link is highlighted on current page
- [ ] Mobile menu opens and closes correctly

---

### 5. Interactive Elements

For every interactive element on the page:

**Buttons:**
- Hover → verify hover state appears (color change, scale, shadow)
- Click → verify correct action (navigation, modal open, form submit)
- Tab through all buttons → verify focus states are visible

**Links:**
- Internal links → verify they navigate correctly
- External links → verify they open in a new tab (`target="_blank"`)

**Forms (if present):**
- Fill with valid data → verify submit works
- Submit empty → verify validation messages appear
- Verify error states look correct

**Dropdowns/Menus:**
- Open → verify correct items appear
- Click item → verify correct action
- Click outside → verify menu closes

**Modals/Dialogs:**
- Trigger open → verify overlay appears, scroll locks
- Press Escape → verify modal closes
- Click overlay → verify modal closes

---

### 6. Scroll Behavior

Scroll from top to bottom slowly:

- [ ] Sticky header: does it change appearance on scroll? Record the scroll position where it triggers. Verify the transition is smooth.
- [ ] Scroll-triggered animations: do elements fade/slide in as they enter viewport?
- [ ] Parallax effects: do they move at the right speed?
- [ ] Scroll-snap: do sections snap correctly?
- [ ] Back to top: if present, does it appear after scrolling and work?
- [ ] No jank or layout shift during scroll

---

### 7. Hover States

Hover over every element that should have a hover state:

- [ ] Navigation items
- [ ] Buttons (all variants)
- [ ] Cards
- [ ] Links
- [ ] Images with hover effects

For each: verify the transition is smooth (not instant), the correct properties change, and it reverts correctly on mouse-out.

---

### 8. Animation Verification

For each animated element:

- [ ] Entrance animations play on page load (not stuck in initial state)
- [ ] Scroll-triggered animations trigger at the right scroll position
- [ ] Animations complete fully (not cut off)
- [ ] No elements stuck in mid-animation state after the animation completes
- [ ] `prefers-reduced-motion` respected (if implemented)

---

### 9. Console Error Check

Open browser DevTools console and check for:
- [ ] JavaScript errors (red)
- [ ] Failed network requests (404 images, fonts, scripts)
- [ ] React hydration warnings
- [ ] TypeScript/prop type errors surfaced at runtime

Report every error found, even if visually the page looks fine.

---

### 10. Performance Spot Check (optional, run if `--full`)

- [ ] Largest Contentful Paint (LCP) image loads quickly — no long blank above the fold
- [ ] No layout shift (CLS) after fonts load
- [ ] No unoptimized images (check for missing `width`/`height` on `<img>` tags)

---

## Issue Report

After all tests, produce a structured report:

```
## Playwright Test Results

### ✅ Passing
- [list each passing test area]

### ❌ Issues Found
- [issue description] — [file and line if known] — [severity: low/medium/high]

### 📸 Screenshots
- Desktop: docs/design-references/test-desktop-<timestamp>.png
- Tablet: docs/design-references/test-tablet-<timestamp>.png
- Mobile: docs/design-references/test-mobile-<timestamp>.png

### 🔧 Recommended Fixes
- [fix description] — [which file to edit]
```

If issues were found, ask the user: "Want me to fix these now?" If yes, apply fixes using /edit-section and re-run the affected tests.
