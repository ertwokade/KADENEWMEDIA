---
name: edit-section
description: Edit a specific section or component of a cloned or custom Next.js website. Use when the user wants to change a particular part of the page — text, layout, colors, animations, or structure — without touching the rest. Triggers on phrases like "hero section'ı değiştir", "navbar'ı düzenle", "footer'a şunu ekle", "bu bölümü kaldır", "pricing section'ı güncelle", "edit the hero", "change the navbar", "update the footer", "modify this section", "add a button to", "remove the X section". Arguments should describe what to change and how.
argument-hint: "<section-name> <what-to-change>"
user-invocable: true
---

# Edit Section

You are about to make targeted edits to a specific section or component of this website.

**Arguments received:** `$ARGUMENTS`

Parse the intent from `$ARGUMENTS`:
- **Which section** — hero, navbar, footer, pricing, features, testimonials, CTA, etc.
- **What to change** — text, layout, colors, add element, remove element, animation, responsive behavior
- **How** — the specific new value or instruction

If the intent is ambiguous, ask one clarifying question before proceeding. Don't ask multiple questions at once.

## Pre-Flight

1. Identify the target component file. Search `src/components/` and `src/app/` for the section mentioned in `$ARGUMENTS`.
   - Use grep to find components by name (e.g., `Hero`, `Navbar`, `Footer`, `Pricing`)
   - If multiple files match, list them and ask the user which one
2. Read the full component file before making any changes.
3. If `docs/research/components/` exists, check for a matching spec file — it contains the original design intent and extracted CSS values.

## Understanding the Edit Request

Before touching any code, classify the edit:

**Text edit** — changing copy, labels, CTAs, headings
- Lowest risk, surgical find-and-replace in the component
- Never change surrounding JSX structure

**Asset edit** — swapping images, videos, icons
- Copy new asset to `public/`, update `src` attribute
- Check width/height constraints

**Style edit** — colors, spacing, typography, borders, shadows
- Find the specific Tailwind class or CSS variable to change
- Check if the value comes from a CSS variable in `globals.css` — prefer changing the variable over hardcoding
- If adding new styles, prefer Tailwind utility classes

**Layout edit** — column count, order, alignment, spacing between elements
- Read the full component to understand the flexbox/grid structure before changing
- Test at all breakpoints after — layout changes often break responsive behavior

**Structural edit** — adding a new element, removing an element, reordering
- This is the highest risk category — read carefully before touching
- After adding an element, verify TypeScript types still pass
- After removing an element, grep for references to it elsewhere

**Animation edit** — changing transitions, adding/removing motion
- Check if Framer Motion, CSS transitions, or Tailwind animate classes are used
- Match the existing animation system — don't introduce a new library

## Making the Edit

1. **Read the file** completely first — never edit blind.
2. **Make the smallest possible change** that achieves the user's goal. Don't refactor surrounding code.
3. **Preserve all existing behavior** not mentioned in `$ARGUMENTS` — hover states, responsive classes, animations.
4. **One logical change per edit** — if the user asked for two things, do them sequentially and verify each.

### For text changes:
Find the exact string and replace it. If the text comes from a data array or object, update the data, not the JSX template.

### For color changes:
First check if the color is a CSS variable reference (e.g., `text-primary`, `bg-background`). If so, it's better to update the variable in `globals.css` than to override it inline. Only use inline overrides for one-off exceptions.

### For adding elements:
Place the new element in a position that makes visual sense. Match the styling pattern of adjacent elements — same padding, same font size, same color scheme. Don't invent new styles when existing ones fit.

### For removing elements:
Remove the JSX block cleanly. Check if it had associated TypeScript props that can also be removed. Grep for any imports that are now unused.

## Verification

After every edit:

1. **TypeScript check:** `npx tsc --noEmit` — must pass with zero errors
2. **Build check:** `npm run build` — must pass
3. **Visual check:** If browser MCP is available, navigate to the page and screenshot the edited section at desktop (1440px). If the change was responsive-related, also check at 390px.
4. **Regression check:** Confirm that sections adjacent to the edited one still look correct.

If verification fails:
- TypeScript error → fix the type issue before declaring done
- Build error → trace the error to its source and fix it
- Visual issue → re-read the original component, understand what went wrong, fix it

## Completion

Report:
- File(s) changed: [paths]
- What was changed: [concise description]
- TypeScript: passing
- Build: passing
- Screenshot: [if browser MCP was used]
- Any caveats or things to watch out for
