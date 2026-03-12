# Workers Migration Audit (2026-03-12)

## Scope
Audit performed for `https://grindroom.nishantborse-2008.workers.dev` blank-page / `Internal Server Error` issue after migration from Pages to Workers.

## Reproduction Summary
1. Built the worker bundle successfully with `npm run build:cloudflare`.
2. Started local worker runtime via `wrangler dev .open-next/worker.js`.
3. Requested `/` and consistently received `500 Internal Server Error`.
4. Runtime stack trace shows:
   - `TypeError: Cannot read properties of undefined (reading 'default')`
   - at `interopDefault` in `.open-next/server-functions/default/handler.mjs`
   - called by `loadComponentsImpl` / `findPageComponentsImpl`

This confirms the failure is inside server component/module loading in the generated OpenNext worker runtime, not a browser-side rendering issue.

## Exact Problems Found

### 1) OpenNext runtime override is internally inconsistent for Workers
`open-next.config.ts` configures:
- `wrapper: "cloudflare-node"`
- `converter: "edge"`
- `middleware.external: true` with a separate edge wrapper.

This mixed mode is high-risk and is the primary reason the runtime fails while resolving app route modules under worker execution.

### 2) Migration is only partially moved from Pages to Workers conventions
Project scripts/docs still use Pages-first preview command (`wrangler pages dev .open-next/assets`) and landing-page env guidance says "Cloudflare Pages environment variables".
This creates operational drift where deployment behavior/variables differ from the actual Workers target.

### 3) Allowed server-action origin does not include the actual workers.dev hostname
`next.config.ts` currently allows `grindroom.workers.dev` but production host is `grindroom.nishantborse-2008.workers.dev`.
This is not the root cause for `/` 500, but will break server actions/auth flows after initial page load is fixed.

## Fix Plan (for next implementation chat)
1. Normalize OpenNext config to a supported Workers setup (remove conflicting wrapper/converter overrides).
2. Align local/prod scripts to Workers runtime (`wrangler dev`/`wrangler deploy` path) instead of Pages preview commands.
3. Update operational text/env guidance from "Pages" to "Workers".
4. Update `serverActions.allowedOrigins` to include actual production hostname.
5. Re-verify with:
   - local worker request to `/` returns 200
   - no `interopDefault` undefined errors in worker logs
   - routes `/`, `/rooms`, `/dashboard` behavior validated

## Why this causes your exact symptom
When the worker receives `/`, OpenNext fails while loading app modules in the server function (`interopDefault` reading `.default` on an undefined module), so the runtime falls back to a plain 500 body (`Internal Server Error`) before React can render your page.
