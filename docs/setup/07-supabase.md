# 07 · Supabase — milestone F

**Cost:** free tier is generous. **Time:** a day for the backend, weeks for
sync done properly. **Needs:** nothing technically. Needs a **decision**
first.

This is post-MVP. Read Step 0 before touching anything.

---

## Step 0 — Decide whether you want this at all

Tocky's single strongest property today is this, from the Help screen and the
App Store listing:

> Everything stays on this device. Tocky makes no network calls at all.

There is a lint rule enforcing it. `fetch`, `XMLHttpRequest`, `WebSocket` and
`EventSource` are all banned in `src/` and `app/`, and CI fails if anyone adds
one.

**Adding sync deletes that property permanently.** Specifically:

- The App Store privacy label stops being **Data Not Collected**
- The privacy policy becomes a real document about a real database
- The lint rule comes out
- Tocky acquires a security surface it currently does not have — your users'
  entire record of how they spend their days, on a server you are responsible
  for
- You are now operating a service, not shipping an app

The locked decisions already say **no account wall** — Tocky must stay fully
usable anonymously, and sync is optional. That constraint is right and makes
this much harder than "add a database", because every table needs to work for
both anonymous local rows and synced ones.

**Do not start this until people are asking for it.** Multi-device sync is the
most common thing users ask for and the most common thing they do not
actually use.

If you still want it, continue.

---

## Step 1 — Project

1. <https://supabase.com/dashboard> → **New project**
2. Name `tocky`, pick the region closest to your users, and save the database
   password somewhere real — it is shown once
3. Wait a couple of minutes for provisioning
4. **Settings → API**, and note:
   - **Project URL**
   - **anon public key** — safe in the client; it grants nothing on its own
     provided RLS is right
   - **service_role key** — **never** in the client. It bypasses every policy.

---

## Step 2 — Schema

Mirror the domain types in `src/domain/types.ts`. **SQL Editor → New query**:

```sql
create table categories (
  id          text primary key,
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  icon        text not null,
  color       text not null,
  is_archived boolean not null default false,
  sort_order  integer not null default 0,
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table sessions (
  id             text primary key,
  user_id        uuid not null references auth.users on delete cascade,
  category_id    text not null,
  label          text,
  started_at     timestamptz not null,
  ended_at       timestamptz,
  linked_task_id text,
  note           text,
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create table pauses (
  id         text primary key,
  session_id text not null references sessions on delete cascade,
  started_at timestamptz not null,
  ended_at   timestamptz
);

create table tasks (
  id               text primary key,
  user_id          uuid not null references auth.users on delete cascade,
  title            text not null,
  category_id      text not null,
  estimate_seconds integer,
  created_at       timestamptz not null,
  completed_at     timestamptz,
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index sessions_user_started on sessions (user_id, started_at desc);
create index tasks_user_completed  on tasks (user_id, completed_at);
```

Three things worth noticing:

- **`id` is `text`, not `uuid`.** Tocky already generates ids client-side with
  `expo-crypto`, offline, before anything is synced. Keep them.
- **`deleted_at` everywhere.** Tombstones, not deletes. Without them a delete
  on one device is invisible to another, and the row comes back.
- **`updated_at` everywhere.** Last-writer-wins needs something to compare.

---

## Step 3 — Row Level Security

**This is the step that matters.** Without it, the anon key reads everyone's
data.

```sql
alter table categories enable row level security;
alter table sessions   enable row level security;
alter table pauses     enable row level security;
alter table tasks      enable row level security;

create policy "own categories" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sessions" on sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own tasks" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Pauses have no user_id; they inherit their session's.
create policy "own pauses" on pauses
  for all using (
    exists (select 1 from sessions s
            where s.id = pauses.session_id and s.user_id = auth.uid())
  );
```

`with check` as well as `using` — `using` governs what you can read, `with
check` governs what you can write. Omitting the second lets someone insert
rows owned by another user.

### Verify it, do not assume it

Supabase's dashboard shows an RLS warning per table; make sure all four are
clear. Then genuinely test it: create two accounts, sign in as one, and try to
read the other's rows. It must return zero.

---

## Step 4 — Auth

**Authentication → Providers.**

- **Sign in with Apple** — _required_. Apple's guideline 4.8: if you offer any
  third-party sign-in, you must offer Apple's too.
- **Google** — optional, and only worth it alongside Apple

Both need configuration on the provider's side; Supabase's docs walk through
each and are kept current, which is why they are not reproduced here.

**Keep anonymous use working.** The locked decision is explicit: no account
wall. Signing in is an upgrade, never a gate. The onboarding flow already has
"I already have an account" as a door, not a wall, and it should stay that
way.

---

## Step 5 — The client

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

You will also have to **remove the no-network lint rule** in
`eslint.config.js` — the block commented _"Tocky records time on the device
and sends it nowhere."_

Delete the comment with it. Leaving a comment that says the opposite of what
the code does is worse than having neither.

---

## Step 6 — Sync, which is the actual work

Everything above is a day. This is the rest.

`BUILD-PLAN.md` names the shape: **sync queue, retry with backoff,
last-writer-wins, tombstones.**

What makes it hard here specifically:

**Sessions are edited while running.** A session with `endedAt: null` is live
and changing. Syncing it mid-flight means the same session exists in two
states on two devices. Decide: does a running session sync at all, or only
once ended?

**Pauses are a child collection.** Tocky writes a session and its pauses in
one transaction — that invariant is load-bearing, and D1a exists because of
it. Sync has to preserve it or a session arrives with half its pauses and
every duration above it is wrong.

**Duration is derived, never stored.** Which is right, and means the server
never holds a total to disagree with. Keep it that way; do not add a
`duration_seconds` column because it seems convenient.

**Overlaps.** `findSessionTimeProblem` refuses two sessions sharing a minute,
because two overlapping sessions make every total above them wrong. Two
devices offline can each create a session for the same minute. **Last-writer-
wins does not solve this** — both writes are valid and the conflict is
semantic. You need a rule, and you need to decide it deliberately rather than
discover it.

**The clock lies.** D1b exists because devices disagree about what time it is.
Last-writer-wins on `updated_at` means a device with a wrong clock wins every
conflict forever. Consider server-side `now()` for `updated_at`, not client
time.

### Suggested order

1. **Read-only sync down** — sign in, pull, merge, never push. Proves the
   schema and RLS with no conflict risk.
2. **Push on ended sessions only.** Running sessions stay local.
3. **The queue** — persist pending writes in SQLite so a failed push survives
   a force-quit, the same way D1a made writes survive a full disk.
4. **Tombstones and deletes.**
5. **Running sessions**, if it still seems worth it.

Ship 1 and 2 and stop for a while. Most of sync's value is in them.

---

## Step 7 — What must change outside the code

Do not let these lag the feature:

- [ ] **App Store privacy label** — no longer _Data Not Collected_. Declare
      identifiers and whatever else you sync.
- [ ] **Privacy policy** — rewrite it. The current one says nothing is
      collected, which will be a lie.
- [ ] **Help screen** — `src/features/settings/HelpScreen.tsx` answers _"Where
      is my data?"_ with _"nothing is uploaded, because Tocky makes no network
      calls at all."_ That answer has a test. Both must change.
- [ ] **Onboarding** — "Your data stays on your device" appears on the third
      pane.
- [ ] **Account deletion** — Apple requires that any app with account creation
      offers in-app account _deletion_. This is a rejection cause, not a
      nice-to-have.

That last one catches people out. Build it at the same time as sign-in, not
after.

---

## Honest assessment

This is the largest item on the list by a wide margin, and the only one that
changes what Tocky _is_ rather than adding to it. It trades the app's clearest
promise for a feature people ask for more often than they use.

Ship the App Store version first. Find out whether anyone actually wants this.
