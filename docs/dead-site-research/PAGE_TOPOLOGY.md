# Bolt — Designs: video vs. existing `bolt-designs/` source

Source video: `bolt-designs.mp4` (1920x1080, 60fps, 1:29.85, has audio — audio not narrated speech, just ambient/music, no transcript needed).
Existing project: `bolt-designs/` (Vite + React + R3F). This is NOT a rebuild-from-scratch — it's an existing, mostly-matching implementation. Video recording shows manual up/down scroll scrubbing (sections repeat non-linearly) to demo scroll-reactive 3D emblem, not a single linear pass.

## Confirmed matching (no change needed)
- Hero: "Shockingly Good Websites" + tagline — `Hero.jsx` matches exactly.
- LogoPill ("⚡ Bolt — Designs" pill, top-left) — matches.
- CTAButton ("Get in touch" pill, fixed bottom-center) — matches.
- Services section (Web Design / Web Dev / 3D Design / Animations, same copy) — `Services.jsx` matches.
- Manifesto block 2 ("Quick on the reply. Sharp with design. Always plugged in.") — matches.
- Fixed 3D bolt emblem + swirling background reacting to scroll — `Background.jsx` / `BoltEmblem.jsx` present, matches visually.
- Black Mango Production project card (dark, X mark) — roughly matches `BlackMangoPreview`.

## Gaps found (video shows, code missing/wrong)
1. **Missing tagline block** — "Built for Speed. Designed with heart." appears (t≈12s) between Hero and the manifesto paragraph. Not in `Manifesto.jsx` at all.
2. **Manifesto block 1 incomplete** — video's full paragraph is "Bolt Designs started as a wild idea between two brothers — One with a passion for visuals, the other with an eye for clean, fast tech." Code's block 1 only has the second half ("One with a passion...").
3. **Contact section entirely missing** — video (t≈50-56s) shows a full contact section: heading "Get in touch", fields Name*, Email*, Company name*, Service* (dropdown), Budget Range*, Project Brief* (textarea), Submit button — set beside a giant scroll-revealed "Bolt — Designs" wordmark in the background. No `Contact.jsx` exists; only the fixed pill `CTAButton` exists (that's a nav CTA, not this section).
4. **Coinpliance preview content wrong** — video shows a real-content mockup: "MEMBERS & PARTNERS" heading + partner logo row (Crypto Tax Forum, Walchain, Blockchain Belgium, House of Web3) on black. Code's `CoinpliancePreview` shows unrelated abstract "POTENTIAL." shapes.
5. **Chain — Labs preview content wrong** — video shows a dark mockup with "MASTERMINDS" wordmark + glowing wireframe head/rings graphic. Code's `ChainLabsPreview` shows an unrelated "Recent Projects" list (Protocol 01/Layer 02/Mesh 03).
6. **Fourth project missing: "Maisonsiete"** — video shows a 4th project card, light/white browser mockup, "MAISONSIETE & CO." wordmark, automotive-badge-style logo, fashion+automotive brand copy ("Where two worlds collide — where fashion meets automotive culture..."). Not present in `projects` array (only 3 entries).

## Confidence
All gaps are high-confidence — each is a clearly readable, static text/layout frame, not motion-dependent guesswork.

## Plan
- Add missing tagline + complete manifesto paragraph in `Manifesto.jsx`.
- Build `Contact.jsx`: heading, form (uncontrolled inputs are fine, no backend wired unless requested), giant background wordmark type treatment, insert after `Projects` in `App.jsx`.
- Rewrite `CoinpliancePreview` and `ChainLabsPreview` to match observed content.
- Add `MaisonsietePreview` + entry to `projects` array in `Projects.jsx`.
