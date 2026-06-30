---
name: netlify-deploy
description: Deploy the current Next.js project to Netlify. Handles build verification, environment variables, and deployment. Use when ready to publish changes live on Netlify. Triggers on phrases like "netlify'e yükle", "netlify deploy", "netlify'e at", "deploy to netlify", "publish on netlify", "netlify canlı", "ship to netlify".
argument-hint: "[--prod] [--preview] [--env KEY=VALUE] [--site site-name-or-id]"
user-invocable: true
---

# Netlify Deploy

You are about to deploy the current Next.js project to Netlify.

**Arguments received:** `$ARGUMENTS`

Parse optional flags:
- `--prod` — deploy to production (default if on main/master branch)
- `--preview` — force a draft/preview deployment
- `--env KEY=VALUE` — set/override an environment variable
- `--site` — specify a Netlify site name or ID (if multiple sites exist)

## Pre-Flight Checklist

Run these checks BEFORE deploying. Do not proceed if any fail.

**1. Clean build:**
```bash
npm run build
```
Must pass with zero errors. If it fails, stop and report the build error. Do not deploy a broken build.

**2. TypeScript check:**
```bash
npx tsc --noEmit
```
Must pass with zero errors.

**3. Lint check:**
```bash
npm run lint
```
Warn on lint errors but don't block on warnings.

**4. Git status:**
Check for uncommitted changes. Warn the user if any exist. Do not force a commit.

**5. Netlify CLI:**
Check if Netlify CLI is installed: `netlify --version`. If not: `npm i -g netlify-cli` then `netlify login`.

**6. Site link:**
Check if this project is linked to a Netlify site: `netlify status`. If not linked, run `netlify link` and let the user choose/create a site. If `--site` was specified, use: `netlify link --id <site-id>` or `netlify link --name <site-name>`.

**7. netlify.toml:**
Check if `netlify.toml` exists in the project root. If it doesn't, create a minimal one for Next.js:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Also check if `@netlify/plugin-nextjs` is installed: `npm list @netlify/plugin-nextjs`. If not: `npm install @netlify/plugin-nextjs`.

**8. Environment variables:**
Check for `.env.local` / `.env`. Warn the user to ensure production env vars are set in the Netlify dashboard (Site settings → Environment variables). List variable names (not values).

## Deployment

### Determine deployment type:

**Production deploy** (`--prod` flag OR on `main`/`master` branch AND no `--preview` flag):
```bash
netlify deploy --build --prod
```

**Draft/preview deploy:**
```bash
netlify deploy --build
```

### If `--env` flags were provided:
Set them before deploying: `netlify env:set KEY VALUE` for each one, then run the deploy command.

### Run the deployment:

Execute the Netlify CLI command and stream the output. Watch for:
- Build progress
- Plugin outputs (especially `@netlify/plugin-nextjs`)
- Any build errors on Netlify's side
- Draft URL or production URL

## Post-Deploy

After successful deployment:

1. **Get the deployment URL** from the CLI output
2. **Open the URL** via browser MCP and take a screenshot to verify the live site
3. **Check browser console** on the live URL for runtime errors

Common Netlify-specific issues:
- **Next.js API routes not working:** Ensure `@netlify/plugin-nextjs` is installed and in `netlify.toml`
- **Image optimization broken:** Add `images.unoptimized = true` in `next.config.ts` OR configure Netlify Image CDN
- **Missing env vars:** Check Netlify dashboard → Site settings → Environment variables
- **Build cache stale:** Try `netlify deploy --build --clear-cache`

## Report

```
## Netlify Deploy Complete

Type: Production / Draft
URL: https://your-site.netlify.app
Draft URL: https://deploy-preview-xxx.netlify.app (if preview)
Build: ✅ Passed (local) + ✅ Passed (Netlify)
Live check: ✅ Site loading correctly

Deployment time: ~Xs
```

If deploy failed:
```
## Netlify Deploy Failed

Error: [error message]
Likely cause: [diagnosis]
Fix: [what to do]
```
