# Loading Stability Edit

## Current issues

- `Sidebar` reads search parameters during server rendering and is wrapped with a `null` Suspense fallback, so the entire navigation can disappear until hydration finishes.
- The model provider always starts with Llama 70B and applies the route default in a passive effect, causing a visible model-label swap after first paint.
- The operations iframe has no explicit loading surface, so users see an empty or partially painted frame while its standalone application initializes.
- Route links do not expose transition feedback when a navigation needs a server response.

## Changes

- Keep the sidebar renderable without `useSearchParams`; synchronize the operations view after mount and immediately on link interaction.
- Initialize the model provider from the current tool and apply route changes in a layout effect before paint.
- Add pending feedback inside navigation links.
- Render the operations iframe through a client wrapper with a stable skeleton and fade-in after `load`.
- Add a route-level operations loading shell for slow server transitions.

## Responsive expectations

- Desktop navigation remains fixed at 272px with no blank first frame.
- Mobile drawer opens with the same content and pending feedback.
- The operations loading shell fills the available main area without horizontal overflow.

## Verification

- Hard-load dashboard, tool, analytics and operations routes.
- Navigate between multiple sidebar links and query-based operation views.
- Verify desktop and 390px mobile layouts.
- Confirm zero browser console errors, TypeScript success and production build success in user and owner copies.
