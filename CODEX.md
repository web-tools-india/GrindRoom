# 🤖 GrindRoom — AI Coding Guidelines (CODEX)

> This file governs how any AI agent (Cursor, Claude Code, Codex, Copilot, etc.) must behave when working on the GrindRoom codebase. Read this before writing a single line of code. These rules exist because LLMs make predictable, repeatable mistakes — this document exists to prevent them.

---

## 🔴 Non-Negotiable Rules (Hard Stops)

These are absolute. No reasoning, no exceptions, no "but it would be cleaner if":

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.** If you're adding it to a client component or prefixing it with `NEXT_PUBLIC_`, you are wrong. Stop.

2. **Never disable Row Level Security (RLS)** on any Supabase table — not even temporarily, not even for a "quick test." See `SECURITY.md` for the correct RLS policies.

3. **Never use Vercel-specific features.** No Vercel Edge Functions, no Vercel KV, no ISR with `revalidate` unless confirmed CF-compatible. GrindRoom deploys to Cloudflare Pages.

4. **Never build features on the "What NOT to build in MVP" list** from `README.md`. If the user asks for payments, push notifications, or a native app — say so and stop.

5. **Never add a light mode toggle.** The app is dark mode only. `#0F172A` is the background. Always.

6. **Never add video or audio features.** No WebRTC, no camera, no microphone. Text presence only. Full stop.

7. **Never trust client-supplied `user_id`** in server logic. Always derive identity from `auth.uid()` or the server-side Supabase session.

---

## 🧠 Think Before You Code

Before implementing anything:

- **State your assumptions explicitly.** If you're unsure about something, say so. Don't silently pick an interpretation.
- **If multiple approaches exist, surface them.** Don't just pick one without explaining the tradeoff.
- **If a simpler approach exists, say so.** Push back on complexity.
- **If something in the request is ambiguous, stop and ask.** One clarifying question is better than 200 lines of wrong code.

---

## ✂️ Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked
- No abstractions "for future use" unless the future use is defined in this sprint
- No configurability that wasn't requested
- No error handling for scenarios that genuinely cannot happen
- If you wrote 200 lines and it could be 50, rewrite it

Ask: *"Would a senior engineer say this is overcomplicated?"* If yes, simplify.

---

## 🔬 Surgical Changes

**Touch only what you must.**

When editing existing code:
- Don't "improve" adjacent code that wasn't part of the request
- Don't refactor things that work
- Match existing code style, even if you'd do it differently
- If you notice unrelated dead code, mention it — don't delete it unilaterally

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused
- Don't remove pre-existing dead code unless explicitly asked

Every changed line must trace directly to the user's request.

---

## 🎯 Goal-Driven Execution

For any non-trivial task, state a brief plan before coding:

```
1. [Step] → verify: [how to confirm it worked]
2. [Step] → verify: [how to confirm it worked]
3. [Step] → verify: [how to confirm it worked]
```

Transform vague goals into verifiable ones:
- ❌ "Make the timer work"
- ✅ "Timer counts down from selected duration. On page refresh, resumes from correct remaining time using `timer_end_at` from presence payload."

---

## 📁 File & Folder Rules

### Where Things Live — Non-Negotiable

```
app/                     → Pages only. No business logic here.
components/ui/           → Shared, reusable UI components (no data fetching)
components/room/         → Room-specific components
components/dashboard/    → Dashboard-specific components
lib/supabase/client.ts   → Browser Supabase client (ONLY for client components)
lib/supabase/server.ts   → Server Supabase client (ONLY for server components / route handlers)
lib/types.ts             → ALL TypeScript interfaces — no inline type definitions
lib/utils.ts             → Pure utility functions (no side effects, no Supabase calls)
app/api/                 → Server-only route handlers (streak logic, session completion)
supabase/migrations/     → SQL schema files
supabase/seed.sql        → Default room seed data
```

### Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `ActiveGrinderRow.tsx` |
| Hooks | camelCase with `use` prefix | `useRoomPresence.ts` |
| Utility functions | camelCase | `formatTimer.ts` |
| API routes | kebab-case folder | `app/api/session/complete/route.ts` |
| Supabase tables | snake_case | `circle_members` |
| TypeScript interfaces | PascalCase with `I` or plain | `Profile`, `Session`, `Room` |
| Environment variables | UPPER_SNAKE_CASE | `NEXT_PUBLIC_SUPABASE_URL` |

---

## 🧩 Component Rules

### Server vs Client Component

```typescript
// Server component (default in App Router) — USE when:
// - Fetching initial data from Supabase
// - No useState, no useEffect, no event handlers
// - Auth-gated pages (redirect server-side)
export default async function DashboardPage() { ... }

// Client component — USE when:
// - Running timers (setInterval)
// - Subscribing to Supabase Realtime
// - useState / useEffect
// - User interactions (onClick, onChange)
'use client'
export default function ActiveTimerCard() { ... }
```

### Props

- Every component must have explicit TypeScript props interface
- No `any` types — ever
- Use interfaces from `lib/types.ts`, not inline definitions

```typescript
// ✅ Correct
interface ActiveGrinderRowProps {
  userId: string
  username: string
  avatarUrl: string | null
  task: string
  timerEndAt: string  // ISO UTC string
}

// ❌ Wrong
function ActiveGrinderRow({ userId, username, task }: any) { ... }
```

---

## 🎨 UI / Styling Rules

- **Tailwind only** — no inline styles, no CSS modules, no styled-components
- **Dark mode only** — never add light mode classes
- Use `clsx` + `tailwind-merge` for conditional classes:
  ```typescript
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  const cn = (...inputs) => twMerge(clsx(inputs))
  ```
- **No flashy animations** — subtle `transition-all duration-200` max
- Active grinder rows must have `border-l-2 border-emerald-500` on active state
- Timers use `font-mono` class for digit display
- Streak numbers always paired with 🔥 emoji
- All cards: `rounded-xl bg-[#1E293B] border border-[#334155]`

### Color Constants — Always Use These Exact Values

```typescript
// In tailwind.config.ts or as CSS variables:
background: '#0F172A'
surface:    '#1E293B'
border:     '#334155'
primary:    '#6366F1'
success:    '#10B981'
warning:    '#F59E0B'
danger:     '#EF4444'
textPrimary:   '#F8FAFC'
textSecondary: '#94A3B8'
```

---

## 🗄 Supabase Query Rules

### Always Scope Queries

```typescript
// ✅ Correct — scoped to current user
const { data } = await supabase
  .from('sessions')
  .select('*')
  .eq('user_id', user.id)
  .order('started_at', { ascending: false })

// ❌ Wrong — fetching all sessions (RLS will block this, but don't even try)
const { data } = await supabase.from('sessions').select('*')
```

### Error Handling Pattern

```typescript
const { data, error } = await supabase.from('rooms').select('*')
if (error) {
  console.error('Failed to fetch rooms:', error.message)
  // Handle gracefully — show empty state, not a crash
  return []
}
```

### Loading States

- Use **skeleton loaders**, not spinners
- Every data-fetching component must have a loading skeleton that matches its layout
- Never show a blank white (or blank dark) screen while loading

### Empty States

- Every list/grid must have a friendly empty state
- Examples:
  - No rooms: "No rooms yet. Be the first to create one."
  - No sessions: "Your grind history will show up here after your first session."
  - No circle members: "Share your invite code to bring your crew in."

---

## ⏱ Timer Implementation Rules

```typescript
// ✅ Correct timer pattern
// Store timer_end_at as UTC ISO string in:
// 1. Supabase sessions table (persists across refreshes)
// 2. Realtime presence payload (so others see correct countdown)

// On mount, reconstruct from DB:
const remaining = new Date(session.timer_end_at).getTime() - Date.now()

// Run setInterval only on client, clean up on unmount:
useEffect(() => {
  const interval = setInterval(() => {
    setRemainingMs(prev => Math.max(0, prev - 1000))
  }, 1000)
  return () => clearInterval(interval) // ← ALWAYS clean up
}, [])
```

---

## 🔄 Realtime Presence Pattern

```typescript
// ✅ Correct presence pattern
useEffect(() => {
  const channel = supabase.channel(`grindroom:room:${roomId}`)

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      // Update left panel with all present users
      setGrinders(Object.values(state).flat())
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          task: currentTask,
          timer_end_at: timerEndAt,
        })
      }
    })

  return () => {
    channel.untrack()       // ← ALWAYS untrack on unmount
    supabase.removeChannel(channel)
  }
}, [roomId])
```

---

## 🚫 Patterns That Are Banned

```typescript
// ❌ Never use any
const data: any = await fetchSomething()

// ❌ Never use localStorage for auth tokens
localStorage.setItem('supabase_token', token)

// ❌ Never build SQL strings manually
supabase.rpc(`SELECT * FROM rooms WHERE id = '${roomId}'`)

// ❌ Never leave TODO comments in committed code
// TODO: implement this later

// ❌ Never add console.log with sensitive data
console.log('User session:', session)  // session contains tokens

// ❌ Never call service role client from a client component
import { supabaseAdmin } from '@/lib/supabase/server'  // in a 'use client' file = WRONG
```

---

## 📋 Pre-Commit Checklist

Before committing any code change:

- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No `any` types introduced
- [ ] No new `console.log` statements with user data
- [ ] No Vercel-specific imports or features
- [ ] No light mode classes
- [ ] Realtime subscriptions have cleanup functions in `useEffect` return
- [ ] All loading states have skeleton loaders
- [ ] All empty states have friendly messages
- [ ] New Supabase queries are scoped to the correct user
- [ ] New env vars are added to `.env.example` (without values)
