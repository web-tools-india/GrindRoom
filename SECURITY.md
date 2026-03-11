# 🔒 GrindRoom — Security Guidelines

> This document defines the security model for GrindRoom. Every AI agent, contributor, and developer must read this before writing any backend logic, database queries, or authentication code.

---

## 🧱 Core Security Philosophy

GrindRoom uses **Supabase Row Level Security (RLS) as the primary security layer**. This means:

- The database itself enforces who can read/write what
- Even if frontend code has a bug, the DB will reject unauthorized access
- Never rely on frontend checks alone for data protection
- The `service_role` key bypasses RLS — it must NEVER be exposed to the browser

---

## 🔑 Environment Variables — Rules

| Variable | Scope | Rule |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (client + server) | Safe to expose — it's just a URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (client + server) | Safe to expose — RLS is the guard |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only — NEVER public** | Bypasses all RLS — treat like a root password |

### Absolute Rules
- ❌ NEVER prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`
- ❌ NEVER import the service role key in any file under `app/` (client components) or `components/`
- ❌ NEVER hardcode any key in source code — always use environment variables
- ❌ NEVER commit `.env.local` to Git — it is in `.gitignore`
- ✅ Service role key is ONLY used in server-side files: `lib/supabase/server.ts` and API route handlers
- ✅ Use `.env.example` (no real values) as the committed template

---

## 🛡 Row Level Security (RLS) Policies

RLS is **enabled on all tables**. Below are the exact policies each table must have.

### `profiles` table

```sql
-- Anyone can read basic public profile info (username, avatar, streak)
CREATE POLICY "Public profiles are viewable by all"
ON profiles FOR SELECT
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Profile is auto-created on signup via trigger — no manual INSERT policy needed for users
```

### `rooms` table

```sql
-- All authenticated users can read public rooms
CREATE POLICY "Public rooms are viewable by authenticated users"
ON rooms FOR SELECT
TO authenticated
USING (is_public = true);

-- Only the creator can update or delete their room
CREATE POLICY "Room creators can update their rooms"
ON rooms FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Room creators can delete their rooms"
ON rooms FOR DELETE
USING (auth.uid() = created_by);

-- Any authenticated user can create a room
CREATE POLICY "Authenticated users can create rooms"
ON rooms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);
```

### `sessions` table

```sql
-- Users can read their own sessions
CREATE POLICY "Users can view own sessions"
ON sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can read sessions of people in their circles (for leaderboard)
CREATE POLICY "Circle members can view each other's sessions"
ON sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM circle_members cm1
    JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
    WHERE cm1.user_id = auth.uid()
    AND cm2.user_id = sessions.user_id
  )
);

-- Users can only insert their own sessions
CREATE POLICY "Users can create own sessions"
ON sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own sessions (e.g., marking done/distracted)
CREATE POLICY "Users can update own sessions"
ON sessions FOR UPDATE
USING (auth.uid() = user_id);
```

### `circles` table

```sql
-- Circle members can view circles they belong to
CREATE POLICY "Members can view their circles"
ON circles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = circles.id
    AND user_id = auth.uid()
  )
);

-- Authenticated users can create circles
CREATE POLICY "Authenticated users can create circles"
ON circles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Only creator can update/delete circle
CREATE POLICY "Creator can manage circle"
ON circles FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete circle"
ON circles FOR DELETE
USING (auth.uid() = created_by);
```

### `circle_members` table

```sql
-- Members can view other members of circles they're in
CREATE POLICY "View members of own circles"
ON circle_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM circle_members cm
    WHERE cm.circle_id = circle_members.circle_id
    AND cm.user_id = auth.uid()
  )
);

-- Users can join a circle (insert themselves)
CREATE POLICY "Users can join circles"
ON circle_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can leave a circle (delete themselves only)
CREATE POLICY "Users can leave circles"
ON circle_members FOR DELETE
USING (auth.uid() = user_id);
```

---

## 🔐 Authentication Rules

- Auth provider: **Google OAuth only** (via Supabase Auth)
- Session management: **`@supabase/ssr`** cookie-based (NOT localStorage)
- Middleware (`middleware.ts`) enforces auth on protected routes server-side
- Never trust `user` object from client — always verify via `supabase.auth.getUser()` on the server

### Protected Routes
These routes require an authenticated session. Redirect to `/` if not authenticated:
- `/dashboard`
- `/circles`
- `/rooms`

### Semi-Public Routes
Viewable without auth, but certain actions require auth:
- `/room/[id]` — can view the room and see grinders, but cannot start a session

### Fully Public Routes
- `/` (landing page)
- `/profile/[username]`

---

## 🌐 Realtime Presence Security

Supabase Realtime presence is used for room occupancy. Key rules:

- Presence channel name format: `grindroom:room:[room_id]`
- Users only track their own presence — never write to another user's presence slot
- Presence payload contains: `{ user_id, username, avatar_url, task, timer_end_at, timer_duration }`
- **Do not include sensitive data in presence payload** — it is visible to all users in the channel
- On page unload or session end: always call `channel.untrack()` to clean up presence

---

## 🧪 Input Validation Rules

| Field | Max Length | Rules |
|---|---|---|
| `task_declared` | 120 characters | Required, no HTML, strip on input |
| `username` | 30 characters | Alphanumeric + underscores only, no spaces |
| `room name` | 60 characters | Required |
| `circle name` | 50 characters | Required |
| `invite_code` | 8 characters | Auto-generated server-side, not user-supplied |

- Sanitize all user-generated text before displaying it (prevent XSS)
- Use Supabase's parameterized queries — never build raw SQL strings with user input
- `invite_code` must be generated server-side using cryptographically random characters

---

## 🚫 What the AI Must Never Do

These are hard rules. No exceptions, no "but it would be simpler" reasoning:

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client**
2. **Never disable RLS on any table** — even temporarily for debugging
3. **Never use `supabase.from('profiles').select('*')` without a WHERE clause on the server** — always scope queries
4. **Never store JWT tokens in localStorage** — use cookie-based auth from `@supabase/ssr`
5. **Never allow a user to pass their own `user_id` in a POST body and trust it** — always derive `user_id` from `auth.uid()` in the RLS policy or server-side session
6. **Never log full user objects or session tokens** — strip sensitive fields before any console.log

---

## 🔄 Profile Auto-Creation (Trigger)

On user signup, a Postgres trigger automatically creates a `profiles` row. This is the safe way — no client-side INSERT needed:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

---

## 📋 Security Checklist Before Any Deploy

- [ ] `.env.local` is in `.gitignore` and NOT committed
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not prefixed with `NEXT_PUBLIC_`
- [ ] RLS is enabled on all 5 tables in Supabase dashboard
- [ ] All RLS policies are applied (run the SQL above)
- [ ] Google OAuth redirect URL in Supabase matches your deployment URL
- [ ] No hardcoded API keys anywhere in source code
- [ ] Presence payload does not contain email addresses or private data
- [ ] Username input validation is enforced (alphanumeric only)
