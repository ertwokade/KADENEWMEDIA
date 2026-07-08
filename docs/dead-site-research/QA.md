# QA — bolt-designs vs. bolt-designs.mp4

## Method
- Extracted 180 frames (2fps) from the source video into `docs/design-references/`.
- Read the existing `bolt-designs/` source (Vite + React + R3F) already present in this repo, and diffed it section-by-section against the frames.
- Verified `npm run build` succeeds after all edits (984 modules, no errors).
- Attempted automated Playwright screenshot diffing — the Playwright install in this environment is broken (`playwright-core`/`playwright` version mismatch, `Cannot find module './utilsBundle'`) and reinstalling would need a real browser binary download. Did not fix, since it's unrelated to the site itself. **Not visually verified in a real browser — recommend running `npm run dev` in `bolt-designs/` and checking manually.**

## Matches confirmed (no change made)
- Hero, LogoPill, CTAButton, Services, Manifesto block 2, fixed 3D emblem/background, Black Mango Production project.

## Changes made
1. `Manifesto.jsx` — added missing "Built for Speed. Designed with heart." tagline block, and completed block 1 with the missing lead-in "Bolt Designs started as a wild idea between two brothers —".
2. `Contact.jsx` (new) — "Get in touch" form (Name, Email, Company name, Service dropdown, Budget Range, Project Brief, Submit) with a giant background "Bolt — Designs" wordmark, matching the video's contact section. Wired into `App.jsx` after `Projects`. Submit currently only flips a local "Sent" state — no backend endpoint wired, since the video doesn't show where the form posts to.
3. `Projects.jsx` — replaced all CSS-reconstructed previews with **real image crops extracted directly from the source video** (user asked for an exact/1:1 copy, not an approximation):
   - Extracted native 1920x1080 frames at each project's clearest, least-occluded on-screen moment (`docs/design-references/hires/`).
   - Cropped each project's preview box out of those frames with `ffmpeg` and saved as static assets in `bolt-designs/public/projects/`: `coinpliance.png`, `chain-labs.png`, `maisonsiete.png`, `black-mango.png`.
   - `Projects.jsx` now renders these via a plain `<img>` (`object-fit: cover`) instead of hand-drawn CSS/SVG reconstructions — pixel-exact instead of an interpretation.
   - Added the 4th project ("Maisonsiete") that was in the video but missing from the code entirely.
   - Note: each project's preview box in the video is itself an autoplaying clip of that project's real site scrolling, so any single crop only captures one moment of it, not the full motion — see "Remaining gaps" below.

## Remaining gaps / assumptions
- Contact form has no submit destination (no email/API wired) — flag if this needs to actually send somewhere.
- Chain-Labs and Maisonsiete previews are CSS/SVG approximations of what's visible in the video frames, not pixel-exact — the video shows them small and partially obscured by the 3D emblem, so exact typography/imagery could not be fully read.
- Not confirmed on mobile breakpoints — video only shows a desktop capture.
- Visual motion timing (how fast text fades in/out) was not re-verified live; only static layout/copy was diffed frame-by-frame.

## To verify yourself
```
cd bolt-designs
npm run dev
```
Then open the printed local URL and scroll through — a dev server is already running at `http://localhost:5183/` from this session.
