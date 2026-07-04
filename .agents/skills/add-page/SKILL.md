---
name: add-page
description: Add a new page to a cloned or custom Next.js website using the existing design system, components, and style tokens. Use when the user wants to create a new route/page that matches the site's look and feel. Triggers on phrases like "yeni sayfa ekle", "about sayfası yap", "contact page oluştur", "blog sayfası ekle", "add a page", "create a new page", "build an about page", "new route", "add /contact", "make a pricing page". Arguments should include the page name/route and optionally a description of what it should contain.
argument-hint: "<page-name-or-route> [description of content/sections]"
user-invocable: true
---

# Add Page

You are about to create a new page for this Next.js website that seamlessly matches the existing design system.

**Arguments received:** `$ARGUMENTS`

Parse from `$ARGUMENTS`:
- **Page name / route** — "about", "/contact", "blog", "/pricing" etc.
- **Content description** — what sections, what purpose, what content should be on this page

If the route or purpose is unclear, ask before proceeding.

## Pre-Flight

1. **Understand the existing design system** — read these files before writing a single line:
   - `src/app/globals.css` — color tokens, typography scale, global styles
   - `src/app/layout.tsx` — root layout, font setup, metadata pattern
   - `src/app/page.tsx` — how the home page is structured (section imports, layout pattern)
   - `src/components/` — list all existing components, especially shared ones (Navbar, Footer, shared UI)
   - `src/lib/utils.ts` — available utilities (`cn()`)
   
2. **Check for reusable components** — grep for: Navbar, Header, Footer, Section wrapper, Container, Card, Button variants. The new page must use these, not recreate them.

3. **Determine the route** — map the page name to a Next.js App Router path:
   - "about" → `src/app/about/page.tsx`
   - "blog" → `src/app/blog/page.tsx`
   - "contact" → `src/app/contact/page.tsx`
   - Nested: "blog/[slug]" → `src/app/blog/[slug]/page.tsx`

4. Verify the route doesn't already exist.

## Phase 1: Page Architecture

Before writing code, define the page structure:

**Sections to include** (based on page type and user's description):

- **About page:** Hero with company story → Team section → Values/mission → CTA
- **Contact page:** Hero → Contact form → Map/location → Social links → FAQ
- **Pricing page:** Hero → Pricing tiers (cards) → Feature comparison table → FAQ → CTA
- **Blog list page:** Hero → Post grid/list → Pagination or infinite scroll
- **Blog post page:** Header → Article content → Author bio → Related posts → CTA
- **Services page:** Hero → Service cards → Process/how it works → Testimonials → CTA
- **Custom:** Derive sections from the user's description

For each section, decide:
- Does an existing component cover it? → reuse it
- Is there a similar component that can be adapted? → extend it with a prop variant
- Does it need a new component? → build it in `src/components/`

Write the page plan as a comment block at the top of the new page file before implementing.

## Phase 2: New Components

For each section that needs a new component:

1. **Match the design system exactly:**
   - Use the same CSS variables for colors (e.g., `text-foreground`, `bg-muted`, `border-border`)
   - Use the same Tailwind spacing scale as adjacent pages (eyeball `page.tsx` for patterns)
   - Use the same font weights and sizes as equivalent elements on the home page
   - Use `cn()` for conditional class merging

2. **Match the layout pattern:**
   - Read how existing sections structure their container (max-width, padding, centering)
   - Clone that pattern exactly — don't invent a new container width
   - Use the same breakpoints for responsive behavior

3. **Use existing icons and assets:**
   - Check `src/components/icons.tsx` before using external icon libraries
   - For new icons, add them to `icons.tsx`, don't import one-offs inline

4. **File placement:**
   - Page-specific components: `src/components/<PageName><SectionName>.tsx`
   - Shared/reusable components: `src/components/<ComponentName>.tsx`

## Phase 3: Build the Page File

Create `src/app/<route>/page.tsx`:

```tsx
import type { Metadata } from 'next'
// Import Navbar, Footer, and new section components

export const metadata: Metadata = {
  title: '<Page Title> | <Site Name>',
  description: '<SEO description>',
}

export default function <PageName>Page() {
  return (
    <main>
      <Navbar />
      {/* sections in order */}
      <Footer />
    </main>
  )
}
```

Follow the exact same metadata pattern as `layout.tsx` and existing pages. Match the `<main>` wrapper pattern.

## Phase 4: Navigation Integration

After creating the page, wire it into the site navigation:

1. **Find the Navbar component** — read it fully
2. **Add the new page to the nav links** — match the existing link format exactly (same component, same styling pattern)
3. If there's a mobile menu, add the link there too
4. If there's a Footer with site links, add it there as well
5. Check if there's a sitemap or `robots.txt` that needs updating

## Phase 5: Content

Populate the page with real, appropriate content:

- Use the user's brand name (check `layout.tsx` metadata for the site name)
- Write content that matches the page purpose — don't use Lorem Ipsum
- For placeholder images, use the same dimensions as similar images on the home page and reference `public/images/` for any existing assets that fit
- All copy should be professional and match the tone of the existing site's content

## Phase 6: Verification

1. `npx tsc --noEmit` — zero errors
2. `npm run build` — passes clean
3. If browser MCP is available:
   - Navigate to the new page route
   - Screenshot at 1440px desktop
   - Screenshot at 390px mobile
   - Verify the Navbar and Footer match the home page exactly
   - Verify no layout breaks, overflow issues, or unstyled elements
4. Click the nav link to the new page from the home page — confirm routing works

## Completion

Report:
- Route created: `/route-name`
- File created: `src/app/route/page.tsx`
- New components created: [list with paths]
- Existing components reused: [list]
- Navigation updated: yes/no, where
- TypeScript: passing
- Build: passing
- Screenshot: [if browser MCP used]
