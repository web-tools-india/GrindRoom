# 🏗 GrindRoom — Architecture & Design Decisions

> This document explains the system architecture of GrindRoom — what each piece does, why it was chosen, how it connects to everything else, and what constraints an AI agent or developer must respect when making changes.

---

## 🗺 High-Level System Overview

```
Browser (Next.js client)
        │
        ├─── Static/SSR pages ───► Cloudflare Pages (CDN)
        │
        ├─── Auth (Google OAuth) ──► Supabase Auth
        │
        ├─── DB queries ──────────► Supabase Postgres (RLS enforced)
        │
        ├─── Realtime presence ───► Supabase Realtime (WebSocket)
        │
        └─── File-based routing ──► Next.js App Router
```

There is **no separate Express/Node backend**. Supabase is the entire backend. All business logic either lives in:
- Next.js server components / route handlers (for streak calc, session completion)
- Supabase Postgres functions/triggers (for profile auto-creation)
- Client components with direct Supabase SDK calls (for presence, live updates)

---

## 🧩 Component Architecture

### Two Supabase Clients — Never Mix Them

```
lib/supabase/client.ts   → Browser client (singleton)
                           Used in: client components, hooks
                           Key used: NEXT_PUBLIC_SUPABASE_ANON_KEY
                           Respects: RLS + auth session from cookie

lib/supabase/server.ts   → Server client (per-request)
                           Used in: server components, route handlers, middleware
                           Key used: SUPABASE_SERVICE_ROLE_KEY (or anon key with session)
                           Pattern: createServerClient() from @supabase/ssr
```

**Rule:** Never import `client.ts` in a server component. Never import `server.ts` in a client component (it would expose the service role key at build time).

---

## 📡 Realtime Presence — How It Works

Supabase Realtime Presence is the engine for showing who's in a room. Here's the exact flow:

```
1. User enters /room/[id]
2. Client calls: supabase.channel('grindroom:room:[room_id]')
3. Client calls: channel.track({ user_id, username, avatar_url, task, timer_end_at })
4. Supabase broadcasts this presence state to ALL subscribers of that channel
5. Every other user in the room receives a presenceSync event
6. Left panel re-renders with updated list of grinders
7. On unmount (leave room / close tab): channel.untrack() is called
```

### Presence vs Broadcast — Why Presence

- **Presence** = state-based. Supabase tracks who is currently connected. When someone leaves (even if they close the tab without clicking Leave), their presence auto-clears after ~10s
- **Broadcast** = event-based. Good for one-off events, NOT for "who is currently here"
- GrindRoom uses **Presence** because we need the room list to self-heal when users disconnect

### Active Count Sync

`rooms.active_count` is updated when:
- A user's presence syncs — count the keys in `presenceState` and upsert to DB
- This happens client-side via an effect on `presenceSync` event
- Use debouncing (500ms) to avoid hammering the DB with count updates

---

## ⏱ Timer Architecture

The session timer is **client-side** (not server-side). Here's why and how:

- Timer runs in the browser using `setInterval`
- `timer_end_at` (a UTC timestamp) is stored in presence payload so other users see correct countdown
- On page refresh: read `timer_end_at` from the active session in DB and resume countdown
- Timer expiry triggers a UI prompt: "Session done! Mark as ✅ or ❌"
- Timer does NOT auto-complete a session — user must actively click Done or Distracted

### Why Client-Side Timer?
- Server-side timers would require persistent connections or polling — expensive at scale
- The source of truth is `sessions.started_at` + `sessions.duration_minutes` in Supabase
- Timer is reconstructed from DB on every page load — no timer state is lost on refresh

---

## 🔄 Streak Calculation — Server-Side Only

Streak logic runs in a **Next.js route handler** (`app/api/session/complete/route.ts`) using the service role client. Never run streak logic client-side.

```
POST /api/session/complete
Body: { session_id, completed: boolean }
Auth: Derived from server-side session (never trust client-supplied user_id)

Logic:
1. Verify session belongs to authenticated user
2. Update sessions table: set completed, ended_at, actual_minutes
3. If completed = true:
   a. Fetch profiles.last_session_date
   b. Apply streak rules (see README.md)
   c. Update profiles: streak_count, longest_streak, last_session_date, total_sessions, total_focus_minutes
4. If completed = false:
   a. Only update total_focus_minutes
5. Return updated profile stats to client
```

---

## 🗄 Data Flow by Feature

### Landing Page (`/`)
```
Server component → supabase server client
→ SELECT COUNT(*) active sessions (last 5 min)
→ SELECT 3 rooms ORDER BY active_count DESC
→ Renders static HTML with live numbers
```

### Room List (`/rooms`)
```
Server component → supabase server client (with auth)
→ SELECT * FROM rooms WHERE is_public = true
→ Client component subscribes to presence for each visible room
→ active_count badge updates in real-time
```

### Active Room (`/room/[id]`)
```
Server component → fetch room details + verify room exists
Client mounts → connect to Realtime presence channel
→ Track own presence (task, timer)
→ Listen to presenceSync → re-render left panel
→ On "Start Grinding" → INSERT into sessions table
→ On "Done/Distracted" → POST /api/session/complete
```

### Dashboard (`/dashboard`)
```
Server component (auth required)
→ SELECT profile stats (streak, total sessions, total hours)
→ SELECT sessions WHERE user_id = auth.uid() ORDER BY started_at DESC
→ Aggregate sessions by date for heatmap
→ All rendered server-side, no client-side fetching needed
```

### Circles (`/circles`)
```
Server component (auth required)
→ SELECT circles + circle_members WHERE user_id = auth.uid()
→ For leaderboard: SELECT profiles JOIN circle_members ORDER BY streak_count DESC
→ "Create Circle" → generate 8-char invite code server-side → INSERT circles
→ "Join Circle" → SELECT circles WHERE invite_code = ? → INSERT circle_members
```

---

## 🏛 Next.js App Router Patterns

### Server vs Client Component Decision Rules

| Use Server Component when... | Use Client Component when... |
|---|---|
| Fetching initial data from Supabase | Using `useState`, `useEffect` |
| The page doesn't need interactivity | Subscribing to Realtime channels |
| SEO matters (landing page, profile pages) | Running timers |
| Protecting routes (redirect if not authed) | Handling user input (forms, buttons) |

### Middleware (`middleware.ts`)
- Runs before every request
- Checks Supabase session from cookie
- Redirects unauthenticated users away from `/dashboard`, `/circles`, `/rooms`
- Passes user session to server components via request headers

```typescript
// Pattern to follow in middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Refresh auth token on every request (keeps session alive)
// Redirect to / if accessing protected route without session
```

---

## 🌐 Cloudflare Pages Compatibility Rules

This is a strict constraint. GrindRoom **must** stay Cloudflare-compatible.

| ✅ Allowed | ❌ Not Allowed |
|---|---|
| Next.js static generation | Vercel Edge Functions |
| Next.js server components | `next/headers` used in non-standard ways |
| API route handlers | Vercel-specific `runtime = 'edge'` config |
| `@supabase/ssr` for cookies | Vercel KV, Vercel Blob, Vercel AI SDK |
| Standard `fetch()` | ISR with `revalidate` (may not work on CF Pages) |

### Build Configuration
- Use `@cloudflare/next-on-pages` adapter OR ensure standard Next.js output is CF-compatible
- Test builds locally with `npm run build` before pushing — catch CF incompatibilities early

---

## 📦 Key Dependencies and Their Roles

| Package | Role | Notes |
|---|---|---|
| `@supabase/supabase-js` | Core Supabase SDK | All DB + auth + realtime calls |
| `@supabase/ssr` | Cookie-based auth for Next.js | Required for SSR session handling |
| `lucide-react` | Icon library | Keep icon usage consistent |
| `clsx` | Conditional className utility | Use everywhere for dynamic classes |
| `tailwind-merge` | Merge Tailwind classes safely | Prevents class conflicts in components |

---

## 🔮 Future Architecture Considerations (Post-MVP)

These are NOT being built now but the architecture must not block them:

- **Razorpay/Stripe payments**: Will require a separate webhook handler. Keep session completion logic isolated so a "premium" flag can gate features later.
- **Push notifications**: Service worker is added for PWA. The architecture of sessions/streaks is already push-friendly.
- **Native app**: All data access is via Supabase REST/Realtime. A React Native app can use the same DB with the same RLS policies.
- **PostHog analytics**: Drop-in client-side script. No architectural changes needed.
- **Coaching institute B2B**: Will need a `organizations` table and an `org_rooms` many-to-many. Design the `rooms` table with `created_by` already — org ownership is just a different creator type.

---

## 🐛 Common Failure Points & How to Debug

| Symptom | Likely Cause | Fix |
|---|---|---|
| User sees empty room, no other grinders | Realtime channel not connecting | Check Supabase → Realtime → Inspector. Verify channel name format. |
| Streak not updating after session | Route handler not being called / RLS blocking update | Check Supabase → Logs → API. Check server console for errors. |
| Google login redirect loop | OAuth callback URL mismatch | Check Supabase Auth → URL Configuration. Must match exact deployed URL. |
| "Invalid JWT" errors | Service role key accidentally used client-side | Audit all imports of `server.ts` — must be server components only. |
| Timer resets on page refresh | `timer_end_at` not persisted to DB | Ensure presence payload includes `timer_end_at` as a UTC ISO string. |
| Presence not clearing on tab close | `channel.untrack()` not called on unmount | Add cleanup in `useEffect` return function. |
