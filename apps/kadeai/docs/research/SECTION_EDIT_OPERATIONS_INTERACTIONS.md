# Operations Interactions Edit

## Problems

- The operations iframe may finish loading before React hydration attaches its `load` handler, leaving the loading skeleton visible forever.
- Dashboard KPI cards and summary panels look interactive but do not perform actions.
- Task, media, activity and workload rows do not open their related workspace.
- Navigating inside the embedded operations app does not update the outer title, URL or sidebar state.

## Changes

- Mount the iframe only after client hydration so its `load` event cannot be missed.
- Turn KPI cards and dashboard rows into keyboard-accessible controls.
- Route budget, production and task summaries to CRM; media summaries to Banana Studio.
- Send embedded view changes to the parent dashboard and synchronize the outer TopBar and URL without reloading the iframe.

## Verification

- Hard refresh operations and confirm the skeleton always clears.
- Click each KPI and summary panel, including task and media rows.
- Verify the outer title and URL follow iframe navigation.
- Verify keyboard Enter/Space activation and mobile layout.
- Run browser console, TypeScript, lint and production build checks in both copies.
