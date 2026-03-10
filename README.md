# 🔥 GrindRoom

> **Study with others. Without the awkward Zoom calls.**
>
> Declare your task. Start your timer. Grind with real people — silently.

GrindRoom is a text-presence, browser-based accountability app for students and professionals. Users join public rooms, declare what they're working on, run a timer, and grind alongside others in real-time — no video, no audio, just silent shared focus.

---

## 🧠 What It Does (Core Loop)

1. User lands on `grindroom.pages.dev` → sees live public rooms with active user counts
2. Clicks a room → signs in with Google (one click)
3. Declares their task: *"Reading Physics NCERT Ch 12"*
4. Picks a timer: 25 / 50 / 90 min or custom
5. Grinds silently while seeing others' tasks + countdowns in real-time
6. Marks result: ✅ Done (streak +1) or ❌ Distracted (honest mode)
7. Dashboard tracks streaks, sessions, and focus hours over time
8. Creates a Circle with friends → private leaderboard by streak → viral loop

---

## 🛠 Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript | SSR, file-based routing, type safety |
| Styling | Tailwind CSS v4 | Utility-first, fast iteration |
| Backend / DB | Supabase (Postgres) | Managed DB, built-in auth, realtime |
| Auth | Supabase Auth (Google OAuth) | One-click login, no password flows |
| Realtime Presence | Supabase Realtime (Presence API) | Who's in the room + their task, live |
| Hosting | Cloudflare Pages | Fast global CDN, free tier, no Vercel lock-in |
| Payments (later) | Razorpay (INR) + Stripe (USD) | Dual market coverage |
| Analytics (later) | PostHog | Self-hostable, privacy-friendly |
| PWA | manifest.json + service worker | Mobile home screen install |

### Hard Constraints — DO NOT DEVIATE
- ❌ No Vercel-specific features (no Vercel Edge Functions, no `next/server` Actions that depend on Vercel infra)
- ❌ No server actions that bypass Supabase client — use Supabase directly
- ❌ No light mode — dark mode only, always
- ❌ No video, no audio, no WebRTC — ever. Text presence only.
- ✅ Must remain Cloudflare Pages compatible at all times
- ✅ All DB access must go through Supabase with RLS enabled

---

## 📁 Project Structure

```
grindroom/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing page (public)
│   ├── rooms/
│   │   └── page.tsx            # Room discovery (auth required)
│   ├── room/
│   │   └── [id]/
│   │       └── page.tsx        # Active grind room (core experience)
│   ├── dashboard/
│   │   └── page.tsx            # Personal stats + heatmap (auth required)
│   ├── circles/
│   │   └── page.tsx            # Friend circles + leaderboard (auth required)
│   └── profile/
│       └── [username]/
│           └── page.tsx        # Public profile page
│
├── components/
│   ├── ui/                     # Shared UI primitives
│   │   ├── RoomCard.tsx        # Room preview with live count badge
│   │   ├── StreakBadge.tsx     # 🔥 + streak number
│   │   ├── LiveCountBadge.tsx  # Animated green dot + count
│   │   └── RoomFilter.tsx      # Tab filter for room categories
│   ├── room/                   # Room-specific components
│   │   ├── ActiveGrinderRow.tsx    # Single user row: avatar + task + timer
│   │   ├── SessionStartCard.tsx    # "What are you working on?" input UI
│   │   └── ActiveTimerCard.tsx     # Countdown + Done/Distracted buttons
│   ├── dashboard/
│   │   ├── WeeklyHeatmap.tsx       # 7-day study grid (GitHub-style)
│   │   └── CircleLeaderboard.tsx   # Ranked members table
│   └── shared/
│       └── CompletionModal.tsx     # Post-session popup
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client (singleton)
│   │   └── server.ts           # Server-side Supabase client (SSR)
│   ├── types.ts                # TypeScript interfaces matching DB schema exactly
│   └── utils.ts                # Streak calc, time formatting, class helpers
│
├── supabase/
│   ├── migrations/             # SQL migration files (run in order)
│   │   └── 001_initial_schema.sql
│   └── seed.sql                # 8 default public rooms
│
├── public/
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
│
├── middleware.ts               # Auth guard for protected routes
├── .env.local                  # Local secrets (NEVER commit)
├── .env.example                # Template for env vars (safe to commit)
├── ARCHITECTURE.md             # System design decisions
├── SECURITY.md                 # Security rules and RLS reference
└── CODEX.md                    # AI coding behavioral guidelines
```

---

## 🗄 Database Schema (Supabase / Postgres)

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, references `auth.users` |
| username | text | unique, not null |
| full_name | text | |
| avatar_url | text | |
| streak_count | integer | default 0 |
| longest_streak | integer | default 0 |
| last_session_date | date | used for streak calc |
| total_sessions | integer | default 0 |
| total_focus_minutes | integer | default 0 |
| created_at | timestamptz | default now() |

### `rooms`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | not null |
| description | text | |
| emoji | text | single emoji |
| category | text | study / coding / upsc / freelance / creative / general |
| is_public | boolean | default true |
| created_by | uuid | references profiles(id) |
| active_count | integer | updated via presence sync |
| created_at | timestamptz | |

### `sessions`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | references profiles(id) |
| room_id | uuid | references rooms(id) |
| task_declared | text | max 120 chars |
| duration_minutes | integer | 25 / 50 / 90 / custom |
| started_at | timestamptz | |
| ended_at | timestamptz | |
| completed | boolean | true = done, false = distracted |
| actual_minutes | integer | real time spent |

### `circles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| invite_code | text | unique, 8-char random |
| created_by | uuid | references profiles(id) |
| created_at | timestamptz | |

### `circle_members`
| Column | Type | Notes |
|---|---|---|
| circle_id | uuid | references circles(id) |
| user_id | uuid | references profiles(id) |
| joined_at | timestamptz | |
| — | — | PK: (circle_id, user_id) |

---

## 🔐 Auth Flow

1. User clicks "Join a Room Free" on landing page
2. Supabase Google OAuth redirect → Google login → callback
3. **First login only:** username setup modal (one time, blocking)
4. Session stored via `@supabase/ssr` cookie-based auth
5. Protected routes: `/dashboard`, `/circles`, `/rooms` — redirect to `/` if not authenticated
6. Semi-public: `/room/[id]` — viewable without auth, but cannot start session

---

## ⏱ Streak Logic

Runs server-side on session complete:

```
IF completed = true:
  IF last_session_date = today     → no change (already counted)
  IF last_session_date = yesterday → streak_count += 1, last_session_date = today
  IF last_session_date < yesterday → streak_count = 1 (reset), last_session_date = today
  IF streak_count > longest_streak → longest_streak = streak_count
  ALWAYS: total_sessions += 1, total_focus_minutes += actual_minutes

IF completed = false:
  ONLY: total_focus_minutes += actual_minutes
  streak and last_session_date unchanged
```

---

## 🎨 Design System v2 — StudyRoom
Dark mode only. Architectural, not atmospheric.
TokenValueUsage--bg-base#08090EPage background — near-void black--bg-surface#0E1117Cards, panels, modals--bg-raised#13181FElevated elements, dropdowns--bg-hover#181E27Hover state backgrounds--border-subtlergba(255,255,255,0.06)Dividers, quiet separators--border-defaultrgba(255,255,255,0.10)Card borders, inputs--border-focusrgba(255,255,255,0.22)Active/focused element borders--primary#E8A847CTAs, links, active states — warm amber--primary-mutedrgba(232,168,71,0.10)Active row backgrounds, badges--primary-hover#F0B85AButton hover, link hover--success#22C55EStreaks, live indicator, online--success-mutedrgba(34,197,94,0.10)Success badge backgrounds--warning#F97316Caution states--danger#EF4444Distracted state, destructive--text-high#EEE8D5Headings — warm white, not cold--text-mid#7A8BA8Labels, metadata, timestamps--text-low#3A4A60Placeholders, disabled states

Typography — unchanged, still excellent

Display / UI: Syne (Google Fonts)
Body: DM Sans
Timers & code: JetBrains Mono

Shape & Depth — unchanged

Cards: border-radius: 10px
Shadows: 0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)
Active rows: border-left: 2px solid #22C55E + background: var(--primary-muted)

Motion — unchanged

Transitions: 150ms ease
Entrance: opacity + translateY(4px) only
Hover lift: none

Principles — unchanged + one addition

No gradients on primary surfaces
Spacing unit: 4px base
Icon set: Lucide only
Amber is used sparingly — buttons, active states, and key highlights only. Never as a fill on large surfaces.
Tone: precise and focused

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 20+ (LTS)
- A Supabase project (free tier works)
- Google OAuth credentials (via Google Cloud Console)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/GrindRoom.git
cd GrindRoom

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and service role key

# 4. Run DB schema in Supabase SQL Editor
# → Paste contents of supabase/migrations/001_initial_schema.sql

# 5. Seed default rooms
# → Paste contents of supabase/seed.sql in Supabase SQL Editor

# 6. Run locally
npm run dev
# → App runs at http://localhost:3000
```

---

## 🌐 Deployment (Cloudflare Pages)

1. Push code to GitHub
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com) → New Project → Connect GitHub repo
3. Build settings:
   - Framework: Next.js
   - Build command: `npm run build`
   - Output directory: `.next`
4. Add all environment variables in Cloudflare Pages → Settings → Environment Variables
5. Deploy — auto-assigned `.pages.dev` domain

---

## 🧪 Pre-Launch Test Checklist

- [ ] Google login works in incognito window
- [ ] Username setup modal appears on first login
- [ ] Can join a room and see other users in real-time
- [ ] Timer counts down correctly and persists on page refresh
- [ ] ✅ Done updates streak correctly
- [ ] ❌ Distracted does NOT update streak
- [ ] Two browser tabs in same room see each other's presence
- [ ] Mobile layout is clean and usable
- [ ] PWA installs correctly from mobile browser

---

## 🚫 What Is NOT Being Built in MVP

Do not implement these. They come post-launch based on real user feedback:

- Payments / premium features (Razorpay / Stripe)
- Push notifications
- Native mobile app (PWA is sufficient until 10K+ DAU)
- Admin dashboard
- Sponsored rooms
- Direct messaging between users
- AI-powered study suggestions
- Leaderboards beyond friend circles

---
