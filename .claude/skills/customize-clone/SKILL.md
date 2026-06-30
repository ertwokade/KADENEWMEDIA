---
name: customize-clone
description: Apply your own brand, colors, fonts, content, and assets to a previously cloned website. Use this after /clone-website to swap out the original site's identity with yours. Triggers on phrases like "bu siteye markamı uygula", "renklerimi değiştir", "logomu ekle", "içerikleri güncelle", "kendi brandımı koy", "customize the clone", "rebrand", "swap colors", "replace logo", "update content". Arguments are optional brand overrides like --colors, --font, --logo, --name.
argument-hint: "[--colors \"#primary,#secondary\"] [--font \"FontName\"] [--logo ./path/to/logo] [--name \"Brand Name\"] [--content ./content.md]"
user-invocable: true
---

# Customize Clone

You are about to rebrand and customize a cloned website — replacing the original site's identity with the user's own brand.

**Arguments received:** `$ARGUMENTS`

Parse these optional flags from `$ARGUMENTS`:
- `--colors "..."` — comma-separated hex colors (first = primary, second = secondary, etc.)
- `--font "..."` — Google Font name or local font
- `--logo ./path` — path to logo file
- `--name "..."` — brand/company name
- `--content ./path` — markdown file with content overrides

If no arguments are provided, ask the user interactively for each piece of brand info before proceeding.

## Pre-Flight

1. Verify this is a cloned Next.js project: check for `src/app/globals.css`, `src/app/layout.tsx`, and `src/app/page.tsx`.
2. Check for `docs/research/` — the clone skill should have left design token and component spec files here. If missing, note that customization will be done by inspection rather than spec lookup.
3. Run `npm run build` to confirm the baseline builds before touching anything.

## Phase 1: Discover Current Brand Tokens

Read `src/app/globals.css` and extract all CSS custom properties in `:root` — these are the original site's design tokens that need to be replaced.

Also check:
- `src/app/layout.tsx` for current font imports and metadata (title, description)
- `public/seo/` for existing favicon and OG images
- `src/components/icons.tsx` for the logo SVG (usually named `LogoIcon`)

Map each token to its semantic role: which ones are primary color, background, text, accent, etc. Save this mapping — you'll need it to apply the new brand correctly.

## Phase 2: Color Swap

If `--colors` was provided, parse and apply. Otherwise ask the user: "What are your brand colors? Provide hex codes (e.g., primary: #FF6B00, secondary: #1A1A2E, background: #FFFFFF)."

Update `src/app/globals.css`:
- Replace the `:root` CSS variables with the new color values
- Keep the same variable names (shadcn tokens) — just replace the values
- Preserve the `.dark` block structure but update those values too
- If the user provided only 1-2 colors, derive a full palette using color theory:
  - Primary → lighten for hover states, darken for active states
  - Generate muted/subtle variants at 10-20% opacity
  - Keep neutral grays unless the user specifies otherwise

After updating, run `npm run build` to verify no CSS errors.

## Phase 3: Typography Swap

If `--font` was provided, use that. Otherwise ask: "What font do you want to use? (e.g., Inter, Geist, Poppins, or 'keep original')"

Update `src/app/layout.tsx`:
- Replace the current `next/font/google` import with the new font
- Update the `className` on the `<body>` tag
- If it's a self-hosted font, use `next/font/local` and place the font files in `public/fonts/`

Update `src/app/globals.css`:
- Replace `--font-sans`, `--font-mono`, and any other font variables with the new font stack

## Phase 4: Logo & Brand Identity

If `--logo` was provided, copy the file to `public/` and update references. Otherwise ask: "Do you have a logo file? (SVG preferred, PNG/WebP also fine). Drag it in or provide a path."

Steps:
1. Copy the logo to `public/logo.svg` (or `.png` etc.)
2. Find the logo component in `src/components/icons.tsx` (usually `LogoIcon`) and replace it with an `<img src="/logo.svg">` or an inline SVG
3. If the user provided a brand name via `--name`, update:
   - `layout.tsx` metadata: `title`, `description`, `openGraph.siteName`
   - Any hardcoded text that shows the original site's name — search with grep
4. Update `public/seo/` — replace favicon, apple-touch-icon, OG image:
   - If logo is SVG: generate a simple favicon from it (instruct user if automated conversion isn't possible)
   - Update `layout.tsx` metadata icons section

## Phase 5: Content Replacement

This is the most variable phase — it depends on how much content the user wants to change.

**If `--content` was provided:** Read the markdown file. Map each section in the file to the corresponding component. Update text content systematically.

**Otherwise:** Show the user a list of all text-heavy components found in `src/components/` and `src/app/page.tsx`. Ask which ones to update, or offer to go section by section interactively.

For each section being updated:
1. Read the current component file
2. Identify all hardcoded text strings
3. Replace with the user's content
4. Preserve all styling, layout, and structure — only text changes

**Never change:** CSS classes, component structure, animations, or layout during content replacement. Only text and src attributes.

## Phase 6: Asset Replacement

Check `public/images/` and `public/videos/` for assets from the original site.

Ask the user: "The cloned site has these images: [list]. Do you want to replace any with your own assets?"

For each replacement:
1. Copy the new asset to the same path as the original (overwrite)
2. If dimensions differ significantly, check the component's `width`/`height` props and update if needed
3. Update `alt` text to reflect the new content

## Phase 7: Final Verification

1. Run `npm run build` — must pass clean
2. Run `npm run dev` and take a screenshot at 1440px to confirm the rebrand looks correct
3. Check that no original brand names, colors, or logos are still visible
4. Verify dark mode still works if the original site had it

## Completion Report

When done, report:
- Colors updated: [list of CSS variables changed]
- Font updated: [from X to Y]
- Logo replaced: yes/no
- Brand name updated: yes/no, where
- Content sections updated: [list]
- Assets replaced: [count]
- Build status: passing/failing
- Any items that need manual attention
