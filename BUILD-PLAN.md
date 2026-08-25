# Tocky — Build Plan

Work is divided into small chunks. **One PR per chunk.** Each chunk must leave the
repo green: typecheck, lint, and tests all pass.

Sources of truth:

- **Visual:** `design-source/app-v2.html` (from Claude Design `Tocky App v2.dc.html`)
- **Tokens:** `design-source/brand-system.html`
- **Behavior:** `Tocky-Flows.md` (mirrored into `docs/`)
- **Product:** `tocky-plan(1).md`

Progress is tracked in `PROGRESS.md`.

---

## Ground rules

1. **Screens compose, never define.** A screen file may contain layout and wiring
   only. Every color, font, space, radius, shadow, and reusable visual pattern
   comes from `src/design-system`. No screen declares its own helper functions,
   formatters, or one-off styles.
2. **No duplication.** Before writing anything, check whether the design system,
   a domain service, or an existing hook already covers it.
3. **Duration is always derived** from `startedAt`/`endedAt`/`pauses[]`. Never
   store or trust a running counter.
4. **Business logic lives outside components** — in `src/domain` (pure) and
   `src/services` (side-effectful).
5. **No obvious comments.** Naming carries the meaning.

---

## Milestone A — Foundation

### A1 · Project scaffold & tooling

- [ ] Expo + TypeScript (strict) + Expo Router project
- [ ] Path aliases (`@/…`), absolute imports
- [ ] ESLint (expo config + import ordering) and Prettier
- [ ] Jest (`jest-expo`) + React Native Testing Library
- [ ] Folder architecture: `app/`, `src/design-system`, `src/domain`, `src/data`,
      `src/services`, `src/features`, `src/hooks`
- [ ] `.gitignore`, `.env.example`, `app.json` iOS config (bundle id, orientation,
      `UIBackgroundModes`, dark-mode support)
- [ ] GitHub Actions: typecheck + lint + unit tests on every PR
- [ ] `README.md` with setup and human-action checklist

### A2 · Design tokens

- [ ] `tokens/color.ts` — brand pink ramp, neutrals, 6 category hues + tints,
      semantic (success/warning/error/info), light **and** dark surface sets
- [ ] `tokens/typography.ts` — Fredoka (display/numerals) + Figtree (text/UI),
      full type scale, tabular-figure variants
- [ ] `tokens/spacing.ts` — 4pt grid: 4·8·12·16·24·32·48·64
- [ ] `tokens/radius.ts` — 8·12·16·20·28·pill
- [ ] `tokens/elevation.ts` — e1 hairline, e2 card, e3 sheet, e-pink glow
- [ ] `tokens/motion.ts` — durations, easings, reduced-motion fallbacks
- [ ] `ThemeProvider` + `useTheme()` resolving light/dark/system
- [ ] Font loading with splash-screen hold
- [ ] Snapshot test asserting every token is defined in both schemes

### A3a · Icon and mascot artwork

- [ ] `TockyIcon` — all 16 icons ported 1:1 to `react-native-svg`
- [ ] `TockyOwl` — 5 expressions with the derived shade logic
- [ ] Cutout colour is a prop, so glyphs read correctly on dark tiles

### A3b · Core primitives

- [ ] `Text` — variant-driven, Dynamic Type aware, never a raw `<Text>` in a screen
- [ ] `Screen` — safe areas, background or gradient, status-bar style
- [ ] `Surface` / `Card`
- [ ] `Pressable` base with the shared press animation and Reduce Motion handling
- [ ] `Button` (primary/secondary/destructive/ghost · sm/md/lg · loading/disabled/pressed)
- [ ] `IconButton` with the 44pt minimum enforced
- [ ] Unit tests and accessibility assertions for each

### A3c · Composite primitives — **cancelled**

Cut deliberately. Building fifteen components before any screen existed was
foundation for its own sake. Composite components are now built **when a screen
first needs them**, inside that screen's chunk, and promoted into
`src/design-system/components` the moment a second screen uses one.

Deferred until a screen demands them: `ProgressRing`, `Toast`, `Sheet`,
`ConfirmDialog`, `Skeleton`, `ErrorState`, `OfflineBanner`, `SectionHeader`.

---

## Milestone B — Data & domain

### B1 · Local persistence — **done**

- [x] `expo-sqlite` setup with versioned migrations keyed on `pragma user_version`
- [x] Tables: `categories`, `sessions`, `pauses`
- [x] Indexes on `sessions(startedAt)`, `sessions(categoryId)`, `pauses(sessionId)`
- [x] Seed the 6 default categories on first run, as a migration so it can never run twice
- [x] Integration tests against a real in-memory database (`node:sqlite`)
- [x] One contract suite both stores must satisfy, so the SQLite store is a drop-in
      for the in-memory one every screen test uses

**Cut, with the reason:** `tasks` and `prefs` tables wait for C8 and C10, and
`sync_queue` for F — a table no code reads is a schema to migrate for nothing.
Repository interfaces were cut too: C2 already chose one `SessionStore` contract
over split repositories, and B1 implements that same contract in SQL. Client-
generated UUIDs land in C3, with the first code that creates a session.

### B2 · Domain: duration & aggregation (pure, no React)

- [ ] `duration.ts` — `(endedAt − startedAt) − Σ pauses`, open-pause handling
- [ ] `format.ts` — `4h 18m`, `01:42:18`, `12h 04m`, relative day labels
- [ ] `bucketing.ts` — split sessions at **local midnight** for day/week/month buckets
- [ ] `aggregate.ts` — totals by category, by task, by day; week-over-week delta;
      streak, session count, average block, longest session, context switches
- [ ] `insights.ts` — "Today in one sentence", never judgmental
- [ ] Exhaustive unit tests: DST transitions, timezone travel, cross-midnight,
      backwards clock jumps, zero-length, multi-day sessions

### B3 · Timer engine

- [ ] `TimerController` implementing `IDLE → RUNNING ⇄ PAUSED → ENDED`
- [ ] Start / Pause / Resume / End / Switch, all idempotent and debounced
- [ ] Single-active-session invariant enforced at the service layer
- [ ] Persist active session immediately; restore on cold start
- [ ] Wall-clock recomputation on foreground; no JS-interval truth
- [ ] Zustand store exposing only what the UI renders
- [ ] `useElapsed()` — 1 Hz tick isolated so only the numerals re-render
- [ ] Unit tests for every transition, plus kill/restore and rapid-tap cases

---

## Milestone C — Screens

Each screen chunk delivers: layout matching the design, all states from
`Tocky-Flows.md` §3, wiring to services, unit tests, and accessibility labels.

### C1 · Navigation shell — **done**

- [x] Expo Router layout: Home · History · `+` · Insights · Tasks
- [x] Raised centre `+` opening the New-session modal
- [x] Persistent "Now tracking" mini-bar host above the tab bar, hoisted out of
      Home so it survives tab switches with the clock running
- [x] Modal vs pushed-screen presentation rules (`new-session` is a modal;
      `timer` and `session/[id]` are pushed; neither shows the tab bar)
- [x] Deep-link routes verified against the `tocky://` scheme — `tocky://history`,
      `tocky://new-session` and friends resolve and set tab state correctly,
      which is what E4's Siri intents will target

**Bottom clearance** is published by the tabs layout on a context and consumed
by `Screen`, so no screen has to know what chrome floats below it. Both parts
are measured, not assumed, so Dynamic Type cannot hide the last row.

**Placeholders:** History, Insights, Tasks, New session, Timer and Session
detail render a shared `ComingSoonScreen`. They exist so every tab and every
tappable target on Home leads somewhere real; C3–C7 replace them.

### C2 · Home — **done**

Delivers the first real Tocky screen. Includes the domain it needs, since a
screen with no data is not a screen.

**Domain (pure, no React)**

- [x] `types.ts` — Category, Session, Pause, TimeRange, CategoryTotal, DayBreakdown
- [x] `duration.ts` — `(endedAt − startedAt) − Σ pauses`, open-pause handling,
      range clipping for day buckets
- [x] `calendar.ts` — local day boundaries, DST-safe day offsets
- [x] `format.ts` — `4h 18m`, `01:42:18`, `+22m vs yesterday`, clock times,
      spoken durations for VoiceOver, greeting
- [x] `aggregate.ts` — totals by category, share of day, yesterday comparison
- [x] Exhaustive unit tests: cross-midnight, DST (23h/25h days), backwards clock
      jumps, zero-length, running sessions. Tests run pinned to
      `America/New_York` so local-vs-UTC bugs cannot hide.

**Data**

- [x] `SessionStore` contract — one store rather than split Session/Category
      repositories, since Home always reads both together
- [x] In-memory implementation with dev seed data, swapped for SQLite in B1
      behind the same `subscribe`/`getSnapshot` surface

**Screen** (visual reference: Home in `design-source/app-v2.html`)

- [x] Greeting: date + `Morning, {name}` + profile entry
- [x] "Tracked today" card: total, vs-yesterday delta, segmented category bar, legend
- [x] Breakdown list: category tile · progress bar · duration
- [x] Recent sessions list
- [x] "Now tracking" mini-bar: live elapsed, inline pause, tap to open Timer
- [x] States: active session · no active session · empty day · loading

**Components built here** (promoted to the design system on second use)

- [x] `CategoryTile` and `ProgressBar` promoted immediately — used three times
      each on Home alone
- [x] `SegmentedBar`, `SessionRow`, `NowTrackingBar` stay in the Home feature
      until a second screen needs them

**Deferred to their own chunks:** the tab bar and the `+` entry point (C1),
"See all" → History (C5), tapping the mini-bar through to Timer (C4).

### C3 · New session (modal) — **done, bar the slice**

- [x] Category grid with selected ring + check
- [x] Optional label field
- [x] Pinned "Start {Category} session" button, disabled until a category is chosen
- [x] Dismiss cancels, tracking nothing
- [x] Switch-confirm when a session is already active
- [x] `startSession` on the store contract: ends whatever runs at the same instant
      the new session starts, so a switch leaves no untracked gap and no overlap
- [x] Client-generated UUIDs (`expo-crypto`), mocked in `jest.setup.ts` because its
      native module silently returns `undefined` under Jest
- [ ] **End-to-end slice: start → Timer → end → saved → Home updates** — needs the
      Timer, so it closes with C4

Starting a session dismisses the modal back to Home, where the "Now tracking" bar
picks it up. It will route to the Timer once C4 exists.

### C4 · Timer — **done**

- [x] Header (collapse · title · ⋯ menu), category pill with label
- [x] Ring + owl + elapsed numerals
- [x] Control cluster: End · Primary (Pause/Start) · Switch
- [x] Running vs paused visuals: ring colour/dim, owl expression, state label
- [x] "Add a note" inline entry
- [x] End: confirm-discard under 60s, otherwise save + success toast
- [x] Switch: category picker, single confirm, zero time gap
- [x] Collapse keeps the session running
- [x] **End-to-end slice: start → Timer → end → saved → Home updates** — closes C3

**No goal.** The design source draws `Goal · 3h 00m` under the numerals, which
contradicts the locked decision that Tocky has no goals, targets or scores. The
locked decision wins. With nothing to fill against, the ring became a clock
face: one full sweep per hour tracked. Duration you can feel, nothing to fall
short of.

**Switch reuses the New session modal** rather than growing a second category
picker. That screen already asks before replacing a running session and already
starts the new one at the instant the old one ends, which is exactly what the
switch needs.

**Store:** `endActiveSession`, `discardActiveSession` and `noteActiveSession`
join the contract, held to the same suite by both implementations. Ending or
switching away from a paused session closes its open pause, so no session is
ever both ended and paused.

**Design system gained** `TextField` (promoted from C3's label field on second
use), `ToastProvider`/`useToast`, and the `collapse` and `more` glyphs.

### C5 · History — **done**

- [x] Day groups (Today · Yesterday · dated) with daily totals
- [x] Session rows: start time · category tile · title · duration
- [x] Search/filter by category, label, and date
- [x] Virtualised by day
- [x] States: empty · nothing-matched · nothing-on-these-days · loading skeleton

`groupSessionsByDay` splits every session at local midnight, so a session that
ran past midnight appears under both days for exactly the time it spent in each
while the record itself stays whole. Asserted against a 25-hour fall-back day.

**One search field instead of three filters.** It matches label, category name,
day heading and note, so "health" filters by category and "yesterday" filters by
date without a date picker — which would have needed a native module, and
`pod install` is still broken.

**Virtualised, not paginated.** A `FlatList` of days already renders only what is
on screen, and a day holds a handful of sessions. Lazy-loading pages of days
would be machinery for a list that does not need it yet.

### C6 · Session detail & editing — **done**

- [x] Owl hero, category pill, title, duration, date and range
- [x] Meta rows: Started · Ended · Pauses (count + total)
- [x] Note card
- [x] Resume → new session with the same category/label, asking first if one runs
- [x] Delete with confirm; blocked while the session is active
- [x] Edit: category, label, start/end, note
- [x] Validation: end ≤ start blocked inline; overlap disallowed; no future starts

**No time picker.** Editing start and end uses ±5 / ±15 minute nudges instead.
A picker needs `@react-native-community/datetimepicker`, and `pod install` is
still broken; typing a time would mean parsing locale-formatted strings, which
is a bug farm. Nudges also fit the real job — correcting a session you forgot
to stop. Swap for a picker once pods are fixed.

**Linked task row deferred to C8.** There is no tasks table yet, so the row
could only ever print a raw uuid.

`findSessionTimeProblem` is the domain rule: a session may not end before it
starts, may not start in the future, and may not overlap another — otherwise
the same minute is counted twice and every total above it is quietly wrong.
Touching ends is allowed: one session may end exactly where the next begins.

`discardActiveSession` became `deleteSession(id)`, which the Timer now uses too.

### C7 · Insights

- [ ] Week switcher with disabled forward chevron on the current week
- [ ] Total with week-over-week delta
- [ ] Daily stacked bar chart, category-colored, tallest day tagged
- [ ] Quick stats: streak · sessions · average block
- [ ] By-category ranking
- [ ] Owl insight callout
- [ ] States: not-enough-data (<2 tracked days) · loading skeleton

### C8 · Tasks

- [ ] Header count ("3 of 7 done today"), add button
- [ ] Category filter chips
- [ ] Active-task card showing live tracked time
- [ ] Open tasks: checkbox · title · estimate · category chip
- [ ] Completed section with tracked time
- [ ] Tap task → start a linked session
- [ ] "End the session too?" when completing a task with a running linked session
- [ ] States: empty · loading skeleton

### C9 · Onboarding

- [ ] Three-pane pager with dot indicator and skip
- [ ] Pane 1 Meet Tocky · 2 One tap · 3 Insights + privacy
- [ ] "Get started" → Home; "I already have an account" → sign-in
- [ ] Shown once; persisted completion flag

### C10 · Settings

- [ ] Profile card + edit
- [ ] Tocky Plus banner, hidden when already Plus
- [ ] Preferences: daily reminder (+ time picker), idle detection, weekly report
- [ ] General: manage categories, export data, help & support
- [ ] Sign out with confirm; version string
- [ ] Manage categories: add / edit / reorder / archive (delete blocked when sessions exist)
- [ ] Export: CSV + JSON via the share sheet

---

## Milestone D — Robustness

### D1 · Edge & fail cases (`Tocky-Flows.md` §6)

- [ ] Short session (<60s) discard confirm
- [ ] Suspiciously long session keep-or-edit prompt
- [ ] Cross-midnight attribution (split at local midnight)
- [ ] DST, timezone travel, backwards clock jump detection
- [ ] App killed while running → restore on relaunch
- [ ] Rapid double-tap Start debounce
- [ ] Idle detection with **keep** as the default action
- [ ] Task deleted while linked → keep sessions, null the link
- [ ] Write failure → retry, error toast, never lose in-memory session
- [ ] Offline indicator
- [ ] Notifications denied while reminder is ON

### D2 · Accessibility

- [ ] VoiceOver labels, roles, and hints on every interactive element
- [ ] Live timer announced politely, not per second
- [ ] Dynamic Type to the largest sizes; Timer and Insights verified
- [ ] Hit targets ≥44pt audited
- [ ] Contrast audit, light and dark
- [ ] Reduce Motion swaps transitions for fades
- [ ] Chart and ring semantic labels
- [ ] Automated a11y assertions in the test suite

### D3 · Performance

- [ ] Only the elapsed numerals re-render on tick
- [ ] Memoized selectors; aggregation cached and invalidated on write
- [ ] Cold start under 2s
- [ ] No network call in the start/stop critical path
- [ ] List virtualization for History
- [ ] Bundle and render profiling pass

---

## Milestone E — Release

### E1 · Observability

- [ ] Sentry (JS + native), scrubbing notes and free text
- [ ] Structured logger
- [ ] Analytics abstraction and the event taxonomy from the product plan
- [ ] No-op cleanly when keys are absent

### E2 · End-to-end tests

- [ ] Maestro flows: first run · start→end · pause/resume · switch · edit ·
      delete · offline · kill-and-restore · task-linked session
- [ ] CI job running E2E on an iOS simulator

### E3 · Build & deploy

- [ ] EAS build profiles: development · preview · production
- [ ] App icon, adaptive icon, splash
- [ ] GitHub Actions: EAS build on `main`, submit to TestFlight on tag
- [ ] App Store metadata, privacy manifest, screenshots
- [ ] Release checklist

### E4 · Siri / App Intents _(needs Xcode + Apple Developer account)_

- [ ] Native module bridging the shared data layer
- [ ] Intents: start · stop · switch · log time · query time · query summary
- [ ] `AppEntity` for categories/tasks with disambiguation
- [ ] App Shortcuts and spoken responses
- [ ] Physical-device verification

---

## Milestone F — Post-MVP (P1)

- [ ] Supabase project, schema, Row Level Security
- [ ] Sign in with Apple, Google sign-in
- [ ] Sync queue, retry with backoff, last-writer-wins, tombstones
- [ ] Home Screen widget
- [ ] Live Activity / Lock Screen
- [ ] Android support
