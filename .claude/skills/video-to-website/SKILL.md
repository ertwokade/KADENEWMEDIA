---
name: video-to-website
description: Build a real, working website from a video reference — a screen recording, product demo, walkthrough, promo video, or a video capture of an existing site. Use when the user provides an .mp4/.mov/.webm (or a link to one) and wants a site built or rebuilt from it, as opposed to a static screenshot or live URL. Pairs with image-to-code (stills) and dead-site-cloner (inaccessible sites) for the video-specific parts: frame extraction, motion/timing inference, and audio/narration extraction.
---

# Video To Website

Treat the video as the source of truth for both the static layout and the motion. A screenshot only shows you what a section looks like; a video also shows you how it moves, in what order, and how fast — capture that instead of guessing at transitions.

If a live, accessible URL exists for the target, prefer `clone-website` — it can read real CSS and DOM. If the video is the only reference for a site that no longer exists or is unreachable, use `dead-site-cloner`, which shares the frame-extraction step below. Use this skill specifically when a video is the primary or only input and the goal is a real, deployable website (not a video-to-video edit — for that use a video editing tool instead).

## Safety Boundaries

- Only rebuild sites/products the user owns, is evaluating for internal reference, or has clear rights to reproduce.
- Do not copy third-party logos, trademarks, copyrighted footage, or verbatim brand copy without confirmed rights — replace with generated/placeholder equivalents when rights are unclear.
- Never produce a phishing, impersonation, or credential-harvesting clone.

## Workflow

1. Ingest the video and confirm what it actually shows.
2. Extract frames and (if narrated) a transcript.
3. Build a page/section topology from the frame sequence, in time order.
4. Write a per-section spec, noting both static layout and observed motion.
5. Implement the site using the project's existing stack.
6. Play the source video and the built site side by side to QA fidelity and timing.
7. Report fidelity, gaps, and assumptions.

Don't skip straight to coding unless the user explicitly wants a rough first pass.

## 1. Ingest And Scope

Confirm before extracting:
- Is this a recording of an existing website (rebuild target), or a product/promo video with no existing site (design source only)?
- Is there voiceover or on-screen text that states copy, feature names, or ordering explicitly? If so, it outranks visual guesswork.
- Desktop, mobile, or both — check the recorded viewport/aspect ratio.

## 2. Frame And Audio Extraction

```powershell
ffmpeg -i input.mp4 -vf "fps=2,scale=1440:-1" docs/design-references/frame-%04d.png
```

Use a higher `fps` (e.g. 6-8) around fast transitions or scroll-driven reveals, and drop back to 1-2 for static holds — a uniform low rate blurs fast motion and a uniform high rate produces thousands of near-duplicate stills. Delete near-duplicate frames; keep one per distinct visual state.

If the video has narration or voiceover, extract the transcript (existing captions, or an available transcription tool) and align key lines to timestamps — narration often names sections and their intended order more reliably than visuals alone.

If `ffmpeg` is unavailable, fall back to scrubbing the video and taking manual screenshots at each state change.

Name frames by section and state: `hero-load-start.png`, `hero-load-end.png`, `pricing-scroll-reveal.png`, `nav-menu-open.png`.

## 3. Topology From The Timeline

Write `docs/dead-site-research/PAGE_TOPOLOGY.md` (shared location with `dead-site-cloner`):

- Sections in the order they appear on the timeline, with their timestamp ranges.
- For each transition: what triggers it (scroll, click, timer, hover) and its rough duration.
- Fixed/sticky elements visible across multiple timestamps.
- Loops or repeated states (e.g. a carousel cycling) — capture one full cycle, not every repetition.
- Anything the video never shows (e.g. a footer only glimpsed for one frame) — mark as inferred, not observed.

## 4. Component Specs

For each section, write `docs/research/components/<section>.spec.md`, same fields as `dead-site-cloner`, plus:

- Motion: trigger, direction, duration estimate, easing feel, start state → end state, described frame-to-frame.
- Scroll-linked vs time-linked: does the animation progress with scroll position or play on a fixed timer?
- Source timestamp range so it can be re-checked against the original video.

Confidence-label everything as high/medium/low, same as the image-based workflow.

## 5. Implementation

- Build static layout first, verified against stills, before wiring up motion — a correct layout with no animation beats an animated layout with wrong proportions.
- Reproduce motion with CSS transitions/animations and IntersectionObserver/scroll-timeline for scroll-linked effects; reach for a JS animation library already in the project before adding a new dependency.
- Match easing and duration to what the video shows rather than defaulting to ease-in-out 300ms everywhere — abrupt cuts in the source should stay abrupt, not get smoothed out.
- Use the project's existing stack and component conventions.

## 6. Motion QA

- Play the source video and the running site side by side (or record the site and diff frame-by-frame).
- Check timing, not just presence of motion: does the reveal happen at the same relative scroll position / delay?
- Verify on both the recorded viewport and the responsive breakpoints the video didn't show — those are inferred, so flag assumptions.

Write `docs/dead-site-research/QA.md` covering layout fidelity, motion fidelity, transcript-derived copy used, and remaining gaps — same report shape as `dead-site-cloner`.

## Completion Report

Report: source video(s) used, sections built, motion reproduced vs simplified, copy taken from narration/on-screen text vs invented, and a fidelity estimate.

Remind the user that Claude or Codex may need to restart before a newly installed skill appears in the selector.
