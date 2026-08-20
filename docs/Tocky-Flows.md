# Tocky — Flow & Behavior Specification

A playful, calm iOS-first time tracker. This document describes every screen, the
flows that connect them, the state machines behind tracking, and the edge/fail
cases an implementation must handle. Visual reference: `Tocky App v2.dc.html`
(Home · Timer · Insights · History · Tasks · New session · Session detail ·
Onboarding 1–3 · Settings). Brand reference: `Tocky Brand System.dc.html`.

---

## 1. Product model

**Core idea:** the user tracks time against **categories** (and optionally a
free-text label + a linked task). Tocky runs one active timer at a time and
surfaces where the day/week went without productivity shaming.

### 1.1 Entities

| Entity       | Key fields                                                                | Notes                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Category** | id, name, color (hex), icon, isArchived                                   | 6 defaults: Work `#8C7DE8`, Learning `#2FBFA0`, Personal `#F2B21E`, Health `#45C67E`, Creative `#FF8A5C`, Social `#B57BFF`. User can add/edit/archive. |
| **Session**  | id, categoryId, label, startedAt, endedAt, pauses[], linkedTaskId?, note? | A tracked block of time. `duration = (endedAt − startedAt) − Σ pauses`.                                                                                |
| **Pause**    | startedAt, endedAt                                                        | A session can have many.                                                                                                                               |
| **Task**     | id, title, categoryId, estimateMins?, status (open/done), completedAt?    | Optional; a session may link to one.                                                                                                                   |
| **User**     | id, name, email, plan (free/plus), prefs                                  | Prefs below.                                                                                                                                           |
| **Prefs**    | dailyReminder(bool+time), idleDetection(bool), weeklyReport(bool)         | Mirrors Settings screen.                                                                                                                               |

### 1.2 Global invariants

- **At most one active session** at any time (running OR paused). Starting a new
  one must resolve the current one first (see 4.4 Switch).
- Durations are computed, never stored as a mutable total (recompute from
  start/end/pauses so edits stay consistent).
- All timestamps stored in UTC; displayed in device local time.
- **Local-first:** data lives on device. Sync/cloud is a Plus feature and must
  degrade gracefully when absent or offline.

---

## 2. Navigation map

```
Onboarding 1 → 2 → 3 ──(Get started)──▶ Home
                       └(I have an account)▶ Sign-in ▶ Home

Tab bar (persistent on Home, History, Insights, Tasks):
  Home · History · [ + ] · Insights · Tasks
        the center [ + ] opens ▶ New session (modal sheet)

Home ──tap "Now tracking" bar──▶ Timer
Home ──tap category / quick start──▶ Timer (starts session)
New session ──Start──▶ Timer
Timer ──End──▶ Session saved ▶ back to origin (Home) + toast
Any session row (Home Recent, History) ──tap──▶ Session detail
Session detail ──Resume──▶ Timer (new session, same category/label)
Settings reached from profile entry (Home header avatar or Settings tab/route).
```

Modality:

- **New session** is a bottom sheet / full-height modal with a close (✕). Dismiss
  = cancel, nothing tracked.
- **Session detail** is a pushed screen with a back (‹) and edit (✎).

---

## 3. Screen-by-screen spec

### 3.1 Home

**Purpose:** neat daily snapshot + fast re-entry to an active session.
Elements: greeting (date + name), today total (`4h 18m`), category segmented
bar, breakdown list (category · progress · time), Recent sessions (tap → detail),
**Now tracking** mini-bar (only when a session is active; tap → Timer; pause
button inline), tab bar.
States:

- **Active session:** mini-bar visible with live time + category.
- **No active session:** hide mini-bar; tab bar `+` is the primary start path.
- **Empty day (nothing tracked):** total shows `0m`; breakdown replaced by an
  empty state (sleepy owl + "Nothing tracked yet — tap + to start").
  Actions: tap breakdown/recent row → detail; tap mini-bar → Timer; pause → pauses
  active session in place.

### 3.2 Timer

**Purpose:** the focus surface; Start / Pause / End must be large and thumb-reachable.
Elements: header (collapse ‹, title, ⋯ menu), category pill (category · label),
progress ring with owl + elapsed time + goal, **control cluster**: End (left,
red outline), **Primary** (center, largest — Pause when running / Start when
paused), Switch (right), "Add a note" pill.
Primary button state (see 5. state machine):

- running → shows **Pause** icon+label; ring animates in category/pink; owl `curious`.
- paused → shows **Start** icon+label; ring dims (grey); owl `sleepy`; a "Paused"
  label replaces "Elapsed".
  Actions:
- **End:** confirm if session < 1 min ("Discard this short session?"); else save
  → return to origin with a success toast + happy owl.
- **Switch:** opens category picker; ends current session and starts a new one
  (see 4.4).
- **Add a note:** inline text entry saved to the session.
- **Collapse (‹):** returns to Home; session keeps running (mini-bar shows it).

### 3.3 Insights

**Purpose:** weekly patterns, gently. Week switcher (‹ This week ›), total with
WoW delta, daily stacked bar chart (tallest day tagged, category-colored),
quick stats (streak, sessions, avg block), by-category ranking, owl insight
callout.
States: **not enough data** (< 2 tracked days) → show partial chart + "Track a
few more days to unlock trends." Future weeks → disabled forward chevron.

### 3.4 History

**Purpose:** browse past sessions. Grouped by day (Today, Yesterday, dated),
each group shows a daily total; rows = start time, category tile, title, duration.
Search icon → filter by category/label/date. Tap row → Session detail.
States: **empty** (new user) → sleepy owl + "Your tracked sessions will show up
here." Long lists paginate/lazy-load by day.

### 3.5 Tasks

**Purpose:** lightweight to-dos tied to categories, startable into a session.
Elements: header count ("3 of 7 done today"), add (+), filter chips
(All/Work/…), **active task** card (highlighted, shows live tracking time when
its session runs), open tasks (checkbox, title, estimate, category chip),
Completed section (struck-through, tracked time).
Actions: checkbox → toggle done; tap task → start a session linked to it (or open
detail); + → new task; chip → filter.
States: **empty** → "No tasks yet — add one or just start tracking." Checking a
task with a running linked session prompts "End the session too?".

### 3.6 New session (modal)

**Purpose:** pick a category + optional label, then Start.
Elements: close (✕), title, category grid (selected = pink ring + check), label
field ("What are you working on?"), pinned **Start {Category} session** button.
Validation: category required (button disabled until one is chosen); label
optional. Dismiss = cancel.
Edge: if a session is already active, Start here triggers the Switch flow (4.4)
with a confirm.

### 3.7 Session detail

**Purpose:** review/edit one block. Owl hero, category pill, title, duration,
date + range; meta rows (Started, Ended, Pauses count+total, Linked task); Note
card; actions **Resume** (start new session, same category/label) and **Delete**.
Edit (✎): change category, label, start/end, note. Delete → confirm ("Delete
this session? This can't be undone.").
Edge: editing end < start, or overlapping another session → validation error.

### 3.8 Onboarding 1–3

Three-pane pager (dots track position), each with skip.

1. **Meet Tocky** — value prop. Next.
2. **One tap** — category concept. Next.
3. **Insights + privacy** — "Get started" (→ create account / Home) and
   "I already have an account" (→ sign-in). Skip on any pane jumps to Home.

### 3.9 Settings

Profile card (name, email, plan) + edit; Tocky Plus upgrade banner (hidden if
already Plus); Preferences (Daily reminder → time picker; Idle detection toggle;
Weekly report toggle); General (Manage categories, Export data, Help & support);
Sign out (confirm); version.
Export: Free = limited range; Plus = full. Manage categories → add/edit/reorder/
archive (cannot delete a category with sessions — archive instead).

---

## 4. Primary flows (happy paths)

### 4.1 First run

Onboarding 1→2→3 → Get started → (optional account) → Home (empty state).

### 4.2 Start tracking (from +)

Tab `+` → New session → choose category → optional label → **Start** →
Timer (running) → collapse or keep watching → **End** → session saved → Home
mini-bar disappears, Recent updates, success toast.

### 4.3 Quick resume

Home Recent row → Session detail → **Resume** → Timer running with same
category/label as a **new** session (original block unchanged).

### 4.4 Switch category mid-session

Timer **Switch** (or starting a new session while one is active) →
current session **ends at now** and is saved → new session **starts at now** with
the chosen category. Present as a single confirm ("Switch to {Category}? Your
{Current} session will be saved."). No time gap between the two.

### 4.5 Pause / resume

Timer **Pause** → primary becomes Start, ring dims, a Pause record opens →
**Start** → Pause record closes; elapsed excludes paused time.

### 4.6 Complete a task

Tasks → tap task → session starts (linked) → work → End → task may prompt
"Mark task done?" → Completed section updates with tracked time.

---

## 5. Timer state machine

States: `IDLE → RUNNING ⇄ PAUSED → (ENDED)`

| From           | Event                           | To      | Effects                                                  |
| -------------- | ------------------------------- | ------- | -------------------------------------------------------- |
| IDLE           | Start (category chosen)         | RUNNING | create Session(startedAt=now)                            |
| RUNNING        | Pause                           | PAUSED  | open Pause(startedAt=now)                                |
| PAUSED         | Start/Resume                    | RUNNING | close Pause(endedAt=now)                                 |
| RUNNING/PAUSED | End                             | IDLE    | set endedAt=now, close open pause, persist               |
| RUNNING/PAUSED | Switch(newCat)                  | RUNNING | End current, Start new (see 4.4)                         |
| RUNNING        | App backgrounded                | RUNNING | keep counting from startedAt (wall clock, not a JS tick) |
| PAUSED         | Idle auto-detected              | PAUSED  | (idle only acts while RUNNING)                           |
| RUNNING        | Idle threshold hit (if enabled) | PAUSED* | prompt "Still working? Kept X or discard idle time"      |

*Compute elapsed from timestamps so a killed/reopened app restores correctly.
Never rely on an in-memory counter as source of truth.

---

## 6. Edge cases & fail states

### 6.1 Tracking

- **Zero/short session** (End < ~60s): confirm discard vs save.
- **Cross-midnight session:** attribute duration to each calendar day it spans
  (History/Insights split at local midnight) or, if simpler, to the start day —
  pick one and be consistent; document it.
- **Clock change / DST / timezone travel:** durations from UTC deltas stay
  correct; day-bucketing uses local time at the moment shown.
- **Device sleep / app killed while running:** on relaunch, restore the active
  session from persisted startedAt; show it still running.
- **Two rapid Start taps:** debounce; only one session may open.
- **Long session (many hours):** owl `surprised`; format `12h 04m`; never overflow.
- **Idle detected but user was working:** the idle prompt must let them **keep**
  the time (default) — don't silently trim.

### 6.2 Data / editing

- **Edit makes end ≤ start** → block with inline error.
- **Edited session overlaps another** → warn; allow only if product decides
  overlaps are legal (default: disallow, since one timer at a time).
- **Delete active session** → not allowed from detail; must End first.
- **Archive category with sessions** → allowed; delete → blocked (archive only).
- **Task deleted while linked to sessions** → keep sessions, null the link.

### 6.3 Account / sync / network

- **Offline:** everything works locally; a subtle "offline" indicator; queue
  sync for Plus.
- **Sync conflict:** last-writer-wins per field, or surface a conflict on
  overlapping edits — document choice.
- **Sign-in fails / expired token:** keep local data; non-blocking retry banner.
- **Sign out with unsynced data (Plus):** warn before clearing device copy.

### 6.4 Permissions & system

- **Notifications denied** but Daily reminder ON → show that reminders won't fire;
  link to system settings; don't crash the toggle.
- **Idle detection** requires the app foreground/permitted APIs — degrade to
  manual pause if unavailable.
- **Low storage / write failure:** never lose the running session; retry persist,
  surface an error toast, keep in-memory state.

### 6.5 Empty & loading states (per surface)

| Surface  | Empty                                    | Loading               |
| -------- | ---------------------------------------- | --------------------- |
| Home     | sleepy owl, "Nothing tracked yet"        | skeleton total + rows |
| History  | "Sessions will show up here"             | skeleton day groups   |
| Insights | "Track a few more days to unlock trends" | skeleton chart        |
| Tasks    | "No tasks yet"                           | skeleton rows         |

---

## 7. Interaction & motion notes

- Primary actions animate on press (scale/opacity); the active timer uses the
  pink "glow" elevation.
- Timer numerals use **tabular figures** so digits don't jitter.
- Owl expression maps to context: `curious` running, `sleepy` idle/empty,
  `happy` on save, `surprised` on very long sessions, `wink` for insights.
- Respect **reduced motion**: swap animated transitions for fades.

## 8. Accessibility

- Hit targets ≥ 44px (control cluster already sized for this).
- Never encode category by color alone — always color **+ icon + label**.
- Live timer announced politely to screen readers (not every second).
- Full dynamic-type support; test the Timer and Insights at largest sizes.

---

## 9. Build notes for Claude Code

- Treat `Tocky App v2.dc.html` as the visual source of truth for layout, spacing,
  color, and component structure; this doc is the behavior source of truth.
- Suggested architecture: a single `TimerController` owning the active-session
  state machine (§5); screens subscribe to it. Persist active session + all
  entities locally; recompute all totals from raw timestamps.
- Start with §4.2 (start→end) end-to-end, then Pause/Switch, then History/
  Insights aggregation, then Tasks, then account/sync.

---

## Tocky's resolved choices

Where this document offers a choice, Tocky has decided:

- **Cross-midnight sessions:** the session record stays whole; day, week, and
  month buckets split it at **local midnight**. Chosen over start-day
  attribution because accurate per-day totals are the product's core value.
- **Overlapping sessions:** disallowed. One timer at a time is a global
  invariant, and edits are validated against it.
- **Sync conflicts:** last-writer-wins per field, with completed sessions
  treated as immutable wherever possible.
