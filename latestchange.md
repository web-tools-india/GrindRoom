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

## 2026-03-11 (global stylesheet refresh)
- Replaced `app/globals.css` completely with the StudyRoom v2 global stylesheet structure.
- Added Google Font imports for `Syne`, `DM Sans`, and `JetBrains Mono` at the top of the stylesheet.
- Added/standardized root design tokens for background, border, semantic status colors, text hierarchy, and shape/depth values.
- Removed the default `@theme inline` and `prefers-color-scheme` blocks and replaced base element typography styles for body, headings, `.font-display`, and `.font-mono`.

Why: This aligns the app-wide styling layer with the project’s documented StudyRoom v2 visual system and enforces consistent typography/tokens from a single source of truth.
