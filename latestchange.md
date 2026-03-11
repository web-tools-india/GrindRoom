# Latest Changes

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
