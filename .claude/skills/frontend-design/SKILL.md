---
name: frontend-design
description: Design-quality pass for a Next.js + shadcn/ui + Tailwind v4 site — turns a functional-but-plain UI into something that looks intentionally designed. Use when the user wants the frontend to look better, more premium, more modern, or "less AI-generated". Triggers on phrases like "tasarımı güzelleştir", "daha modern yap", "daha premium görünsün", "arayüzü iyileştir", "make it look better", "polish the design", "more modern UI", "less generic", "improve the visual design", "make it look premium". Optional argument names a page/route or section to focus on.
argument-hint: "[page-or-section]"
user-invocable: true
---

# Frontend Design

You are doing a **design-quality pass** on the current Next.js + shadcn/ui + Tailwind v4 project. The goal is to take a UI that works but looks generic and make it look deliberately, tastefully designed — the kind of thing a senior product designer would ship.

Focus target: **$ARGUMENTS** if provided (a page, route, or named section). If empty, assess the whole app and prioritize the highest-traffic surface (usually the landing page).

This is not a rewrite. You are refining what exists — tightening spacing, fixing hierarchy, unifying tokens, adding the small details that separate "clearly AI-generated" from "designed." Preserve behavior and content; change how it looks and feels.

## Pre-Flight

1. Verify the project builds: `npm run build`. If it doesn't, fix the build first — you can't judge design on a broken app.
2. Take before screenshots. Prefer the `screenshot` skill if available; otherwise run the dev server and capture the target at 1440px, 768px, and 390px. These are your baseline for the after-comparison.
3. Read `src/app/globals.css` and `src/app/layout.tsx` to learn the existing design tokens (colors, fonts, radius, spacing scale) and font setup. Work **within** this token system — don't introduce one-off hex values or arbitrary pixel numbers when a token exists.

## The Design Principles

Internalize these. Every change you make should be traceable to one of them.

### 1. Hierarchy Is Everything

The single biggest tell of an amateur UI is flat hierarchy — everything competes for attention, so nothing wins. Establish a clear order:

- **One** primary action per view. It gets the strongest visual weight (solid fill, brand color). Everything else is secondary (outline, ghost) or tertiary (text link).
- Type scale should have real contrast. A hero headline at `text-2xl` sitting next to body at `text-base` reads as timid. Big things should be genuinely big (`text-5xl`–`text-7xl` for hero headlines), small things genuinely small.
- Use weight and color, not just size. Muted foreground for secondary text (`text-muted-foreground`), full foreground for primary. Bold for emphasis, not for everything.

### 2. Space Is a Design Element

Generous, consistent whitespace is what makes a design feel premium. Cramped is the default failure mode.

- Use a consistent spacing scale (Tailwind's 4/8-based scale). Don't mix `gap-3`, `gap-[13px]`, `mt-5`, `mb-7` randomly — pick rhythm values and stick to them.
- Sections need room to breathe. Vertical section padding of `py-20`/`py-24`/`py-32` on desktop is normal for landing pages, not excessive.
- Constrain line length. Body text should live in a `max-w-prose` / `max-w-2xl` container — full-width paragraphs are hard to read and look unconsidered.

### 3. Restraint With Color

- Lean on the neutral palette (background, foreground, muted, border) for 90% of the UI. Use the brand/accent color sparingly — for the primary action and a few intentional highlights. Color everywhere means color nowhere.
- Borders and dividers should be subtle (`border-border`, low-contrast). Harsh full-black borders look cheap.
- Prefer soft, layered shadows over hard drop shadows. A believable shadow is large, soft, and low-opacity (`shadow-lg` tuned down, or a custom multi-layer shadow), not `0 2px 4px black`.

### 4. Typography Details Matter

- Set tracking on large headings (`tracking-tight` on display sizes reads more refined).
- Comfortable line-height on body (`leading-relaxed` / `leading-7`).
- Don't leave orphans and awkward wraps in headlines — use `text-balance` on headings and `text-pretty` on paragraphs.
- If the project only uses one system font, consider a proper display/body pairing via `next/font` — but only if it fits the brand. Font choice is high-leverage.

### 5. Depth, Motion, and Detail

These are the finishing touches that signal "someone cared":

- **Micro-interactions:** hover/focus states on every interactive element — subtle scale, color, or shadow transitions (`transition-colors`, `transition-transform`, 150–250ms, ease-out). Never leave a button with no hover feedback.
- **Focus-visible states** for keyboard users — a visible ring. This is both a polish and an accessibility win.
- **Rounded corners consistently** — pick a radius from the token system and apply it uniformly. Mixed radii look accidental.
- **Gradients and texture, used tastefully** — a subtle background gradient, a soft radial glow behind a hero, a faint grid/noise. Restraint is key; one tasteful accent beats five.
- **Consistent iconography** — one icon set, consistent stroke width and size. Mismatched icons are an instant tell.

### 6. Responsive Is Not Optional

A design that only looks good at 1440px is half-finished. Check that hierarchy, spacing, and readability hold at 768px and 390px. Stack columns gracefully, scale type down, keep tap targets ≥44px.

## Method

Work in tight, observable loops — change, look, adjust. Don't do a giant blind refactor.

1. **Audit against the principles.** Go through the target surface and list the specific problems: flat hierarchy here, cramped spacing there, no hover states, harsh borders, inconsistent radii, weak type scale. Be concrete — cite the component and the issue.

2. **Fix tokens first, then components.** If the whole app suffers from the same issue (radius, shadow, muted color, section rhythm), fix it at the token level in `globals.css` so every component benefits. Then handle component-specific refinements.

3. **Go section by section** for the target page. For each: hierarchy → spacing → color → type → detail/motion → responsive. Don't move on until the section reads clean at all three viewports.

4. **Verify continuously.** Keep `npx tsc --noEmit` green as you go. Run `npm run build` before finishing.

5. **After screenshots + diff.** Capture the same viewports as the baseline and compare before/after. Every change should be a visible improvement — if a change didn't clearly help, revert it.

## What NOT to Do

- **Don't change content or copy** unless the user asked — you're a designer here, not a copywriter. (Trimming an obviously placeholder "Lorem ipsum" is fine.)
- **Don't introduce arbitrary values** (`p-[17px]`, `#3a3a3a`) when a token or scale step exists. One-off values are how a design system rots.
- **Don't pile on effects.** Five gradients, three shadows, and a glow on everything is worse than a clean, restrained surface. When in doubt, remove.
- **Don't break responsive** to make desktop prettier. Check mobile after every meaningful change.
- **Don't ship without hover/focus states.** A button with no interactive feedback is the most common "unfinished" tell.
- **Don't fight the brand.** If `customize-clone` set brand colors/fonts, design within them — don't swap the palette on a whim.
- **Don't leave the build broken.** Every step must keep `npx tsc --noEmit` and `npm run build` passing.

## Completion

When done, report:
- Which surface(s) you refined
- Token-level changes made in `globals.css` (and why)
- The main hierarchy/spacing/detail fixes per section
- Before/after screenshot paths at each viewport
- Build status (`npm run build`)
- Anything you deliberately left alone and why
