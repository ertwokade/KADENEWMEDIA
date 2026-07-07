---
name: video-to-website
description: Rebuild a website from a screen-recording video (a scroll-through of a site) into the Next.js + shadcn/ui + Tailwind v4 project. Use when the user has a video of a website — a screen recording, screencast, or promo scroll — instead of a live URL, and wants it cloned/rebuilt. Triggers on phrases like "bu videodaki siteyi yap", "videodan site çıkar", "ekran kaydından site", "şu videoyu siteye çevir", "build the site from this video", "clone this video", "recreate the website in this recording", "turn this screen recording into a site". Provide the video file path as an argument.
argument-hint: "<path-to-video.mp4> [target-url-if-known]"
user-invocable: true
---

# Video to Website

You are rebuilding a website from a **video** — a screen recording that scrolls through the site — into the existing Next.js + shadcn/ui + Tailwind v4 project. This is the `clone-website` pipeline, but the source of truth is video frames instead of a live DOM.

Source video: **$ARGUMENTS**.

A video gives you the visual design and the motion/interaction feel, but it does NOT give you exact CSS values, real assets at full resolution, or DOM structure. Your job is to extract the maximum signal from the frames and reconstruct faithfully, being honest about what must be inferred.

## Pre-Flight

1. **Locate and validate the video.** Confirm the file at `$ARGUMENTS` exists and is a video (`ffprobe` it). If the path is wrong, ask the user for the correct one.
2. **Check for `ffmpeg`/`ffprobe`.** They are required for frame extraction. If missing, tell the user to install ffmpeg (`brew install ffmpeg`) before continuing.
3. **Ask for the live URL if it might exist.** A video is a lossy source. If the user also knows the real URL, the right move is almost always to switch to the `clone-website` skill instead — a live DOM beats frames every time. Only proceed video-only when there's genuinely no URL (unreleased site, competitor teardown, design mockup video, deleted page).
4. **Verify the base project builds:** `npm run build`. The Next.js + shadcn/ui + Tailwind v4 scaffold should be in place.
5. Create output dirs: `docs/research/`, `docs/research/frames/`, `docs/research/components/`, `docs/design-references/`, `scripts/`.

## Phase 1: Frame Extraction

Turn the video into an analyzable set of stills. Read the video's metadata first (`ffprobe -v error -show_format -show_streams`), then extract frames.

```bash
# Dense sampling — 2 frames/sec — into docs/research/frames/
ffmpeg -i "<VIDEO>" -vf "fps=2" -q:v 2 docs/research/frames/frame_%04d.png

# Also grab scene-change keyframes — these catch distinct sections and state changes
ffmpeg -i "<VIDEO>" -vf "select='gt(scene,0.3)',showinfo" -vsync vfr -q:v 2 docs/research/frames/scene_%04d.png
```

Tune the fps up for fast scrolls, down for slow ones. The goal is to have a clear still of every distinct section and every interaction/animation state (hover, tab switch, menu open, scroll-triggered header change).

Then **read the frames** (they're images — view them directly). Build a mental model of the page top to bottom.

## Phase 2: Reconstruction Analysis

Because you can't run `getComputedStyle()`, you reconstruct design tokens from pixels. Be systematic and write it all to `docs/research/VIDEO_ANALYSIS.md`.

### Global design tokens (infer from frames)
- **Colors:** sample dominant colors from the frames — background(s), primary/brand, text, borders, accents. Record as hex. If the site has light and dark sections, capture both.
- **Typography:** identify the type styles by eye — is the display font serif/sans/mono? Geometric or humanist? Match to the closest Google Font (state your best guess and 1–2 alternatives). Estimate the type scale from relative sizes across headings and body.
- **Spacing & radius:** estimate the section rhythm, container max-width, and corner radius from proportions in the frames.
- **Layout system:** grid vs. flex, column counts, sticky/fixed elements.

### Page topology
Map every distinct section top to bottom (from the scroll-through), name each, and note its layout. Save to `docs/research/PAGE_TOPOLOGY.md`.

### Motion & interaction (this is the video's superpower)
Video captures behavior that a static clone misses. Scrub the frames and document:
- Scroll-triggered changes (header shrinking/changing, elements fading/sliding in, stagger timing)
- Parallax layers moving at different rates
- Hover states, if the recording shows the cursor interacting
- Tab/carousel/accordion switches and their transitions
- Auto-playing loops, marquees, cycling content
- Smooth-scroll feel (Lenis-like easing vs. native)

Estimate durations and easing from how many frames a transition spans (frames ÷ fps = seconds). Record to `docs/research/BEHAVIORS.md`.

## Phase 3: Assets — Reconstruct, Don't Extract

You cannot download original assets from a video. For each asset, pick the right strategy and **log which one you used** so the gaps are auditable:

- **Text content:** transcribe verbatim from the frames. Read carefully — this is real content you CAN recover.
- **Logos & icons:** recreate as inline SVG / React components in `src/components/icons.tsx`, matched to the frames. Don't ship blurry cropped screenshots as logos.
- **Photos & rich imagery:** you can't recover full-res originals. Use tasteful, license-safe placeholders that match the composition and mood, OR crop the highest-quality frame as a temporary stand-in and clearly flag it for the user to replace. Never present an upscaled frame crop as final.
- **Videos/animations:** rebuild as CSS/JS motion or a placeholder loop; note where the original had video.

Write and run a placeholder/asset-prep script under `scripts/` where useful. Always tell the user exactly which assets are placeholders needing real replacements.

## Phase 4: Foundation Build

Sequential, done yourself (touches many files):

1. **Fonts** in `layout.tsx` via `next/font/google` — your best-match fonts from the analysis.
2. **globals.css** — the color tokens, radius, spacing, and keyframes you reconstructed. Map to shadcn token names where they fit.
3. **TypeScript types** in `src/types/` for the content structures.
4. **Icons** — the SVGs you recreated in `src/components/icons.tsx`.
5. Verify: `npm run build` passes.

## Phase 5: Component Build & Dispatch

Follow the same extract → spec → dispatch → merge loop as `clone-website`, with frames as the reference:

- For each section, write a spec file in `docs/research/components/<name>.spec.md`. Reference the specific frame(s) in `docs/research/frames/` as the visual source, and include the reconstructed styles, the interaction model, verbatim text, and asset strategy.
- Mark values as **measured-from-frame** vs. **inferred** so the builder (and the user) know the confidence level.
- Dispatch builder agents (in worktrees for parallel work). Keep each builder scoped small; each verifies `npx tsc --noEmit` before finishing.
- Merge branches, keeping `npm run build` green after each merge.

## Phase 6: Visual QA Against the Video

Play the video and your site side by side:

1. Compare section by section, top to bottom — proportions, colors, type, spacing.
2. Compare the **motion** — scroll through your build and check it feels like the recording (transition speed, easing, stagger, header behavior). This is where a video source has more to offer than a screenshot clone; use it.
3. Fix discrepancies at the spec or component level.
4. Verify responsive behavior at 1440 / 768 / 390 — the video likely only shows one width, so you must design the others sensibly and say so.

## What NOT to Do

- **Don't pretend inferred values are exact.** A video can't give you `getComputedStyle()`. Label reconstructed tokens as estimates and keep them consistent rather than falsely precise.
- **Don't ship frame crops as real assets.** Blurry, compressed screenshots of logos/photos are an instant tell. Recreate SVGs; use clean placeholders for photos and flag them.
- **Don't ignore the motion.** The whole reason to work from video instead of screenshots is that it captures behavior. If you build a static clone, you wasted the source.
- **Don't skip the URL question.** If a live site exists, `clone-website` will always produce a better result — offer to switch.
- **Don't under-sample fast scrolls.** If sections blur past, raise the fps and re-extract; a missed section is a missing component.
- **Don't leave the user guessing about gaps.** Explicitly list every placeholder asset and every inferred value they should verify.

## Completion

When done, report:
- Frames extracted and the sampling rate used
- Reconstructed design tokens (colors, fonts, radius) with confidence notes
- Sections built and components created
- **Asset ledger:** which assets are faithful recreations vs. placeholders the user must replace
- Motion/behaviors reproduced
- Build status (`npm run build`)
- Explicit list of inferred/low-confidence values and responsive assumptions to verify
