# Haoqi Inner Page System

## Source
- Reference route: `http://127.0.0.1:4182/reunimos/`
- Destination scope: 68 existing Kade inner routes under `haoqi-clone/`

## Shared components
- Fixed full-viewport HUD with brand at top-left, navigation at top-right, clock at bottom-left, coordinates at bottom-center, location at bottom-right.
- Independent full-height scroll container with hidden scrollbar and overscroll containment.
- Centered article: `max-width: 880px`, desktop padding `96px 24px`, mobile padding `64px 22px`.
- Article title: TikTok Sans, 48px desktop, 60px line-height, variable width 120.
- Mono labels: Geist Mono, uppercase, dotted hover outline.
- Metadata footer: subtle 3% label background, 12px radius, responsive grid.
- Ambient field canvas behind content, pointer-reactive but non-interactive.

## Interaction model
- Time-driven text scramble on HUD, eyebrow, title, and metadata values.
- Scroll-driven reveal of sections/content using IntersectionObserver.
- Pointer-driven HUD coordinates and ambient canvas displacement.
- Click-driven three-state theme toggle.
- Smooth scroll-to-top from the coordinate label.
- Hover-driven dotted navigation outlines and lifting cards.

## Responsive behavior
- Desktop: four-corner HUD, 880px article, two-column cards/forms where applicable.
- Mobile: secondary navigation hidden, coordinate/location HUD hidden, one-column cards/forms and metadata.
- Reduced motion: reveal/scramble/canvas motion suppressed where appropriate.

## Content preservation
- Existing Kade titles, descriptions, service data, forms, legal copy, operational gateways, route paths, and API endpoints remain unchanged.
