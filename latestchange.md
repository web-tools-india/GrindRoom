# Latest Changes


## 2026-03-11 (root layout html lang + body typography utility classes)
- Updated `app/layout.tsx` root markup to set `<html lang="en">`.
- Updated the root `<body>` element to use `className="font-sans antialiased"` while keeping children rendering unchanged.

Why: This improves accessibility/SEO language signaling and standardizes global typography smoothing via Tailwind utilities without restructuring the layout tree.

## 2026-03-11 (design token expansion + body font standardization)
- Updated `app/globals.css` `body` font stack to use `font-family: 'DM Sans', sans-serif;` for consistent typography with the imported Google font.
- Expanded the `@theme inline` token map to include full semantic color aliases for surface layers, status/action colors, and text hierarchy (`--color-surface`, `--color-raised`, `--color-hover`, `--color-primary`, `--color-primary-hover`, `--color-success`, `--color-warning`, `--color-danger`, `--color-text-high`, `--color-text-mid`, `--color-text-low`) while keeping existing `:root` variables unchanged.

Why: This makes Tailwind theme token usage more complete and scalable across components while preserving the current underlying palette and avoiding breaking variable renames.

## 2026-03-11 (lockfile regeneration for Cloudflare npm ci/EUSAGE failure)
- Ran `npm install` to regenerate `package-lock.json` so it fully matches `package.json` dependency declarations, including Cloudflare/OpenNext toolchain packages added recently.
- Verified `lib/supabase/admin.ts` already starts with `import { createClient } from '@supabase/supabase-js'` and does not include `import 'server-only'`, so no code change was needed in that file.

Why: Cloudflare Pages install step failed with npm `EUSAGE` because lockfile and manifest drifted. Regenerating the lockfile restores deterministic installs for CI/deploy.

## 2026-03-11 (Cloudflare next-on-pages edge runtime compliance across all non-static routes)
- Added `export const runtime = "edge"` to all non-static App Router pages and route handlers required by Cloudflare build output: `app/page.tsx`, `app/rooms/page.tsx`, `app/dashboard/page.tsx`, `app/circles/page.tsx`, `app/room/[id]/page.tsx`, `app/profile/[username]/page.tsx`, `app/api/circles/create/route.ts`, `app/api/circles/join/route.ts`, `app/api/session/complete/route.ts`, and `app/auth/callback/route.ts`.
- Updated `app/api/circles/create/route.ts` invite code generation to use Web Crypto (`crypto.getRandomValues`) instead of Node-only `node:crypto/randomInt` so the route works under Edge runtime.

Why: Cloudflare `next-on-pages` failed after successful Next build because these routes were not marked for Edge runtime. Also, once Edge runtime is enabled, Node-only crypto APIs in route handlers can break deployment. This update makes runtime configuration and implementation consistent for Cloudflare Pages.

## 2026-03-11 (permanent Cloudflare build fix: disable prerender for Supabase-auth pages)
- Added `export const dynamic = "force-dynamic"` to `app/page.tsx`, `app/rooms/page.tsx`, `app/dashboard/page.tsx`, `app/circles/page.tsx`, `app/room/[id]/page.tsx`, and `app/profile/[username]/page.tsx`.
- Kept existing Supabase calls and UI behavior unchanged; only rendering mode was updated.

Why: Cloudflare build had no env vars at build time and Next.js was prerendering authenticated Supabase pages, which executed env guards during static export and crashed deploys. Forcing dynamic rendering prevents build-time execution of those page data fetches and removes this deploy blocker permanently.

## 2026-03-11 (follow-up Cloudflare deploy fix: middleware Supabase env type narrowing)
- Updated `middleware.ts` to read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` inside the `middleware()` function and guard before `createServerClient(...)`.
- Retained existing protected-route matching and cookie sync behavior, with no auth-flow signature changes.

Why: After fixing `lib/supabase/server.ts`, the Cloudflare build surfaced the same TypeScript `string | undefined` overload error in `middleware.ts`. This follow-up removes that blocker so the deploy pipeline can continue.

## 2026-03-11 (cloudflare build fix for Supabase server client type narrowing)
- Updated `lib/supabase/server.ts` to read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` inside `getSupabaseServerClient()` instead of at module scope.
- Kept the existing runtime guard and moved it before `createServerClient(...)` so TypeScript narrows both values to `string` at call time.
- Preserved the function signature and cookie handling behavior to avoid breaking server auth/session flows.

Why: Cloudflare Pages build was still failing on `lib/supabase/server.ts` with `string | undefined` arguments passed into `createServerClient`. Function-scoped env reads + guard resolve the TypeScript overload error without changing runtime behavior.

## 2026-03-11 (env baseline + docs sync for recent API/RPC additions)
- Updated `.env.example` so local setup explicitly includes `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, and a manual-fill placeholder for `SUPABASE_SERVICE_ROLE_KEY`.
- Updated `README.md` project structure to include the OAuth callback route, newly added API handlers, `lib/supabase/admin.ts`, and newly added Supabase migration files.
- Updated `README.md` local setup steps to list the exact minimum env vars and to run all required SQL migrations in order before seeding.

Why: Recent circle/session backend features added new API routes and RPC migrations. The docs/env template needed to be synchronized so new contributors can boot the app correctly without missing required keys or SQL setup.

## 2026-03-11 (circle invite security + RLS-safe join lookup hardening)
- Updated `app/api/circles/create/route.ts` to generate invite codes with cryptographic randomness using Node `crypto.randomInt` instead of `Math.random()`.
- Added `supabase/migrations/2026031103_resolve_circle_by_invite_code_rpc.sql` introducing `public.resolve_circle_by_invite_code(text)` as a `SECURITY DEFINER` RPC that allows authenticated users to resolve a circle by invite code before they are members.
- Updated `app/api/circles/join/route.ts` to call the new RPC for invite-code resolution and map RPC auth/not-found errors to structured API responses.

Why: This fixes two production security/reliability gaps from review—invite codes are now generated with cryptographically secure entropy, and first-time joiners can resolve valid invite codes under RLS without exposing service-role credentials.

## 2026-03-11 (circle create/join API handlers)
- Added `app/api/circles/create/route.ts` with authenticated `POST` logic that accepts `{ name }`, generates an uppercase 8-character invite code, creates a `circles` row, and inserts the creator into `circle_members` using server-derived `user.id`.
- Added retry logic for invite-code uniqueness collisions and structured JSON error responses (`{ error: { code, message, details } }`) for auth, validation, and persistence failures.
- Added `app/api/circles/join/route.ts` with authenticated `POST` logic that accepts `{ invite_code }`, resolves the circle by invite code, returns 404 when absent, and inserts membership with graceful duplicate handling.

Why: This enables secure, production-ready circle creation/join flows while preventing client-side identity spoofing and giving frontend code predictable, machine-readable API errors.

## 2026-03-11
- Scaffolded the Next.js App Router project with TypeScript, Tailwind, and ESLint baseline files.
- Added Supabase browser and server client helpers in `lib/supabase/` using `@supabase/ssr` patterns for Cloudflare-compatible SSR auth handling.
- Added core shared types in `lib/types.ts` for `profiles`, `rooms`, `sessions`, `circles`, and `circle_members` tables.
- Added shared utility helpers in `lib/utils.ts` for class merging, timer formatting, and date formatting.
- Added root `middleware.ts` to refresh Supabase auth cookies on each request and enforce auth on `/dashboard`, `/circles`, and `/rooms`.

Why: This establishes the production-safe project foundation required before building pages/features, while preserving the existing Supabase schema and RLS model.

## 2026-03-11 (PR binary-file fix)
- Removed `app/favicon.ico` from the repository to avoid GitHub PR "Binary files are not supported" upload issues.

Why: `favicon.ico` is optional during scaffolding and can be added later manually without affecting auth, Supabase, middleware, or route protection behavior.

## 2026-03-11 (landing page live rooms refresh)
- Replaced the default `app/page.tsx` template with a server-rendered landing page tailored to GrindRoom, including a navbar, hero, primary CTA, social-proof copy, live room preview, how-it-works section, and footer.
- Added a Supabase server query on `rooms` to fetch the top 3 active public rooms ordered by `active_count DESC`.
- Implemented graceful failure/empty-state behavior so the home page shows a stable "no live rooms" message if the query fails or returns no data.
- Kept styling dark-only and aligned UI colors with the Design System v2 token palette already documented in the repo.

Why: This turns the home page into a production-ready acquisition surface that reflects real room activity without introducing brittle behavior when data is unavailable.

## 2026-03-11 (landing page token hardening)
- Updated `app/globals.css` to define permanent dark-mode design tokens at `:root` and removed the light/dark media-toggle defaults.
- Refined `app/page.tsx` to consume those shared CSS tokens (`var(--...)`) instead of hardcoded per-element hex values.
- Preserved the same Supabase server query and graceful empty-state flow, while aligning the page with the repository's token-based styling direction.

Why: New repository docs and conventions emphasize token-driven, dark-only styling. This update keeps the landing page maintainable and consistent as more pages/components are added.

## 2026-03-11 (PR regeneration)
- Added this follow-up entry to regenerate a fresh PR after the previous PR thread showed a GitHub-side glitch.
- No functional code changes were introduced in this step; the latest landing-page implementation remains the active source of truth.

Why: Creating a clean PR thread helps review/merge flow continue without losing the already-validated implementation context.

## 2026-03-11 (root layout metadata and wrapper simplification)
- Updated `app/layout.tsx` to remove the `next/font/google` Geist font imports and configuration.
- Kept only the global stylesheet import (`import "./globals.css"`).
- Set the root metadata title to `GrindRoom — Grind Together, Silently`.
- Set the root metadata description to `Join a room. Declare your task. Grind with real people silently.`.
- Added a dark theme color via exported viewport config (`themeColor: "#08090E"`) so browsers render a matching dark UI chrome.
- Simplified the root layout markup to a minimal `<html><body>{children}</body></html>` wrapper.

Why: The app shell should reflect GrindRoom branding and dark-mode defaults from first paint, while removing unnecessary font wiring and keeping the root layout lean/maintainable.

## 2026-03-11 (rooms/dashboard/circles/profile route and UI scaffolding)
- Added new App Router endpoints and pages for OAuth callback and core product surfaces: `app/auth/callback/route.ts`, `app/rooms/page.tsx`, `app/room/[id]/page.tsx`, `app/dashboard/page.tsx`, `app/circles/page.tsx`, and `app/profile/[username]/page.tsx`.
- Added shared navigation/auth UX components in `components/shared/` (`Navbar`, `AuthModal`, `UsernameModal`, `CompletionModal`).
- Added room-focused UI components (`RoomCard`, `RoomFilter`, `LiveCountBadge`, `RoomClient`, `ActiveGrinderRow`, `SessionStartCard`, `ActiveSessionCard`) with explicit interfaces and friendly empty states.
- Added dashboard-focused UI components (`WeeklyHeatmap`, `CircleLeaderboard`) with loading skeletons and empty states.
- Extended `lib/types.ts` with explicit interfaces for active grinders, room filters, heatmap data, leaderboard entries, and session-start payloads (no `any` usage).
- Kept all new UI dark-token aligned using the requested palette values (`#0F172A`, `#1E293B`, `#334155`, etc.).

Why: This creates the missing product structure needed to ship the authenticated multi-page GrindRoom experience, while enforcing strict typing and resilient loading/empty UI behavior for data-driven areas.

## 2026-03-11 (session completion API with UTC streak updates)
- Added `app/api/session/complete/route.ts` with a secure `POST` handler that validates server-side auth, parses `{ session_id, completed }`, verifies session ownership, and blocks duplicate completion for already-ended sessions.
- Implemented elapsed-time calculation from `started_at` to current server time and persisted session completion fields (`ended_at`, `completed`, `actual_minutes`) in `sessions`.
- Added profile stat updates in `profiles` with UTC day-based streak logic for completed sessions (today/yesterday/reset rules), while always incrementing `total_focus_minutes` and only incrementing `total_sessions` when `completed=true`.
- Returned structured JSON responses with updated profile stats and explicit HTTP error statuses for auth, validation, ownership, not-found, conflict, and persistence failures.

Why: Session completion and streak progression must be enforced server-side (not client-trusted) to keep focus analytics and streaks reliable under RLS and production auth constraints.

## 2026-03-11 (session completion race-condition + atomicity hardening)
- Reworked session completion to use a transactional Postgres RPC (`public.complete_session`) instead of separate route-level writes.
- Added `supabase/migrations/2026031102_complete_session_rpc.sql` with row-level locking and `ended_at IS NULL` guarded update to prevent double-counting from concurrent requests.
- Added idempotent behavior for already-completed sessions so retries return current session/profile aggregates safely without incrementing totals again.
- Updated `app/api/session/complete/route.ts` to call the RPC and map database error codes to stable API responses.

Why: The prior approach could leave `sessions` and `profiles` out of sync on partial failures and concurrent requests. Moving logic into one DB transaction prevents that inconsistency and makes retries safe.

## 2026-03-11 (server-only Supabase admin client + elevated session completion writes)
- Added `lib/supabase/admin.ts` as a dedicated server-only Supabase admin helper built with `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)` semantics and explicit runtime guard rails for missing environment variables.
- Updated `app/api/session/complete/route.ts` to keep user authentication and ownership checks on the request-scoped server client first, then execute completion/streak writes through the admin client for elevated server-side persistence.
- Added `supabase/migrations/2026031104_complete_session_admin_rpc.sql` with a `SECURITY DEFINER` RPC (`complete_session_admin`) that keeps row-locking, idempotency, and atomic streak/session updates while restricting execution to `service_role` only.

Why: This introduces a safe, explicit path for privileged writes without exposing service credentials to the client and preserves strict ownership validation before any elevated database operation runs.

## 2026-03-11 (Cloudflare blank-page deployment fix)
- Added Cloudflare-focused npm scripts in `package.json`:
  - `build:cloudflare` to run `opennextjs-cloudflare build`
  - `preview:cloudflare` to build and run `wrangler pages dev .open-next/assets`
- Updated the Cloudflare deployment section in `README.md` to use OpenNext-compatible settings:
  - Framework preset `None`
  - Build command `npm run build:cloudflare`
  - Output directory `.open-next/assets`
  - Explicit required environment variables
  - Verification step for `.open-next/worker.js` in build logs

Why: The blank page happened because deployment was using Next.js-style build/output settings, which can publish static assets without the OpenNext SSR worker. Cloudflare Pages needs the OpenNext build pipeline so routes render correctly instead of serving an empty/blank app shell.

## 2026-03-11 (blank page hardening + Cloudflare config alignment)
- Updated `app/page.tsx` to handle missing Supabase public env variables gracefully instead of crashing the landing page render path.
  - Added env presence guard before server-side room query.
  - Added a visible in-app warning card that tells exactly which Cloudflare variables are missing.
- Updated `package.json` Cloudflare scripts to match Cloudflare dashboard setup style:
  - `build:cloudflare` now runs `npx @opennextjs/cloudflare@latest build`
  - `preview:cloudflare` now uses the same command before local Pages preview.
- Updated the Cloudflare deployment section in `README.md` to align with the shown dashboard values:
  - Build command `npx @opennextjs/cloudflare@latest build`
  - Build output directory `/` in UI, while clarifying that `wrangler.toml` still controls `.open-next/assets`
  - Added explicit reminder to set env vars for both Production and Preview.

Why: The previous change fixed build pipeline guidance, but deployment can still appear as a blank page when env vars are missing at runtime. This hardening makes the issue visible to users and aligns docs/scripts with the exact Cloudflare UI flow being used.

## 2026-03-11 (Design System v2 palette class migration on landing page)
- Replaced all Tailwind arbitrary CSS variable classes in `app/page.tsx` (e.g., `bg-[var(--...)]`, `text-[var(--...)]`, `border-[var(--...)]`) with explicit Design System v2 palette classes.
- Mapped token usage to hardcoded colors across all states and variants, including hover and opacity modifiers (`/95`, `/40`, `/10`) and border styles (`border-white/10`, `border-white/[0.06]`, `border-white/[0.22]`).

Why: This removes runtime dependency on CSS variable token references in the landing page and aligns every page-level className with the requested Design System v2 hardcoded palette standard.

## 2026-03-11 (page palette audit: confirmed no Tailwind CSS variable color classes in key app pages)
- Audited `app/rooms/page.tsx`, `app/dashboard/page.tsx`, `app/circles/page.tsx`, `app/room/[id]/page.tsx`, and `app/profile/[username]/page.tsx` for `bg-[var(--...)]`, `text-[var(--...)]`, and `border-[var(--...)]` class usage.
- Confirmed these pages already use hardcoded hex-based Tailwind classes for page/card/text/border colors, so no page-level palette class changes were required.

Why: This validates the requested migration guardrail for the specified pages while preserving the currently allowed hardcoded palette and avoiding unnecessary churn.
