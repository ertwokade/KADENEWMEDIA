# Homepage specification

## Overview

- Interaction model: scroll + pointer + time driven
- Runtime: Next.js static HTML, local JS/CSS chunks, WebGL canvas
- Desktop reference: `docs/design-references/original/original-1440x900-full.png`
- Mobile reference: `docs/design-references/original/original-390x844-top.png`

## Foundation

- Light background: `rgb(251, 250, 244)`
- Dark background: `rgb(15, 17, 17)`
- Text color derives from `--label-1`
- Accent/selection: `#c0fe04`
- Sans: TikTok Sans
- Mono: Geist Mono
- Display mono: Departure Mono

## Layout

- Root viewport is fixed and hides native document scrolling.
- Inner scroll area uses full width/height, `overflow-y:auto`, hidden scrollbar.
- Project section uses 12-column responsive grid.
- Footer fills one viewport height.

## Assets

- `model/hello.gltf` + `hello.bin`
- `model/cnt.gltf` + `cnt.bin`
- `model/cursor.glb`
- `sticker_img/s_01.png` … `s_12.png`
- `img/m3.png`
- `work/*.png`

## Responsive behavior

- Desktop: 12-column editorial composition and wide hero.
- Mobile: cards stack or use paired half-width rows as on the original.
- Both layouts retain fixed HUD, WebGL scene and independent scroll container.

