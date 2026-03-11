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
