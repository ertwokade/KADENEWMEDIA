# Article route specification

## Overview

- Interaction model: scroll + link/anchor + image overlay
- Applies to all six project/article routes.

## Exact shared structure

- Fixed full-screen HUD/header
- Article: centered, full width, `max-width: 880px`
- Article padding: `24px`; vertical padding `72px`, desktop `96px`
- Header top padding: `10vh`
- H1: `30px` mobile, `48px` desktop; bold, tight leading/tracking
- Section headings use 24/20/18 px hierarchy
- Body: 14 px mobile, 16 px desktop, relaxed line height
- Metadata footer: subtle label background, 12 px radius, 16/24 px padding

## States

- Internal heading links preserve hash navigation.
- External links open their original destinations.
- Image figures preserve grids and zoom affordances.
- Light/dark theme is shared with the homepage.

## Responsive behavior

- Article width remains capped at 880 px on desktop.
- Mobile uses 24 px horizontal padding.
- Images and grids never exceed viewport width.
- Tested at 390 px and 1440 px with no runtime errors.

