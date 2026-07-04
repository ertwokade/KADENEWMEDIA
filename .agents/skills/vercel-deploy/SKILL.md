---
name: vercel-deploy
description: Deploy the current Next.js project to Vercel. Handles build verification, environment variables, and deployment. Use when ready to publish changes live. Triggers on phrases like "vercel'e yükle", "canlıya al", "deploy et", "yayınla", "vercel deploy", "push to vercel", "go live", "publish to vercel", "ship it", "deploy to production", "preview deploy".
argument-hint: "[--prod] [--preview] [--env KEY=VALUE]"
user-invocable: true
---

# Vercel Deploy

You are about to deploy the current Next.js project to Vercel.

**Arguments received:** `$ARGUMENTS`

Parse optional flags:
- `--prod` — deploy to production (default if on main/master branch)
- `--preview` — force a preview deployment (even on main branch)
- `--env KEY=VALUE` — set/override an environment variable for this deployment

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
Warn on lint errors but don't block deployment unless they are errors (not warnings).

**4. Git status:**
Check if there are uncommitted changes. Warn the user: "You have uncommitted changes. These will be deployed as-is from the working directory via Vercel CLI. Consider committing first for a clean git history." Do not force a commit — let the user decide.

**5. Vercel CLI:**
Check if Vercel CLI is installed: `vercel --version`. If not installed, run `npm i -g vercel` and then `vercel login` if not already authenticated.

**6. Environment variables:**
Check for a `.env.local` or `.env` file. If found, warn: "Your .env.local contains local environment variables. Make sure production environment variables are configured in the Vercel dashboard or passed via --env flags." List the variable names (not values) so the user can verify.

## Deployment

### Determine deployment type:

**Production deploy** (`--prod` flag OR currently on `main`/`master` branch AND no `--preview` flag):
```bash
vercel --prod
```

**Preview deploy** (all other cases):
```bash
vercel
```

### If `--env` flags were provided:
Add them to the command: `vercel --prod --env KEY=VALUE`

### Run the deployment:

Execute the Vercel CLI command and stream the output. Watch for:
- Build progress (Vercel rebuilds on their servers)
- Any build errors on Vercel's side (may differ from local if env vars are missing)
- Deployment URL

## Post-Deploy

After successful deployment:

1. **Get the deployment URL** from the CLI output
2. **Open the URL** via browser MCP and take a quick screenshot to verify the live site looks correct
3. **Check for runtime errors** — open browser console on the live URL and confirm no errors

If something looks wrong on the live URL but was fine locally, the most common causes are:
- Missing environment variables in Vercel dashboard
- Image domains not configured in `next.config.ts`
- API routes failing due to missing secrets

## Report

```
## Vercel Deploy Complete

Type: Production / Preview
URL: https://your-project.vercel.app
Build: ✅ Passed (local) + ✅ Passed (Vercel)
Live check: ✅ Site loading correctly

Deployment time: ~Xs
```

If deploy failed:
```
## Vercel Deploy Failed

Error: [error message]
Likely cause: [diagnosis]
Fix: [what to do]
```
