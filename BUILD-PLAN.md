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

### C7 · Insights — **done**

- [x] Week switcher with disabled forward chevron on the current week
- [x] Total with week-over-week delta
- [x] Daily stacked bar chart, category-coloured, tallest day tagged
- [x] Quick stats: sessions · average block · longest session
- [x] By-category ranking with share
- [x] Owl insight callout
- [x] States: not-enough-data (<2 tracked days) · loading skeleton

**No streak.** The plan and the design both had a "Streak · 12 days" tile, and
the locked decisions name streaks explicitly. Longest session took its place:
descriptive, with no chain to protect.

**No verdicts anywhere.** The design's delta is a green up-arrow and "18% vs
last week", which reads as a score. It says "6h 00m less than last week" now,
in the same grey as everything else. The callout says "Monday had the most
tracked" rather than the design's "your deepest day … mornings are when you
focus best".

Weeks start Monday. `summariseWeek` builds the seven days, both totals, the
ranking, the longest day and the session stats in one pass, and a week that
spans a clock change still covers seven local days.

### C8 · Tasks — **done**

- [x] Header count ("1 of 5 done"), add button
- [x] Category filter chips, shown only when more than one category is in use
- [x] A task being tracked shows its live time and is ringed in the accent colour
- [x] Open tasks: checkbox · title · estimate or tracked time · category chip
- [x] Completed section with tracked time
- [x] Tap task → start a linked session, asking first if one is already running
- [x] "End the session too?" when completing a task with a running linked session
- [x] States: empty · nothing-in-this-category · loading skeleton
- [x] C6's **Linked task** meta row, now that there is a task to name

**"done today" became "done".** Tasks are not day-scoped -- they carry a
`createdAt`, not a day -- so counting "today" would have meant inventing a rule
about when a task belongs to a day. The count follows the filter instead.

**No separate active-task card.** The design floats the tracked task above the
list; the row it already has says "Tracking now · 12m" and wears an accent ring,
which is the same information without a second component that can disagree.

`tasks` joins the store snapshot, `estimateSeconds` is chosen from chips rather
than typed, and sessions started from a task carry its `linkedTaskId`.

### C9 · Onboarding — **done**

- [x] Three-pane pager with dot indicator and skip
- [x] Pane 1 Meet Tocky · 2 One tap · 3 Insights + privacy
- [x] "Get started" → Home; "I already have an account" → sign-in
- [x] Shown once; persisted completion flag, stored in a new SQLite
      `settings` table so it survives reinstalls of the JS bundle

Leaving onboarding by any door — Get started, Skip, or the sign-in link —
marks it complete, so the panes never reappear. `Stack.Protected` gates the
whole tab tree on the flag rather than redirecting after mount, which avoids a
flash of Home before onboarding.

Sign-in is a placeholder: accounts and sync are P1, and the locked "no account
wall" decision means nothing behind it is required to use Tocky.

### C10a · Settings shell & profile — **done**

- [x] Profile card + edit, persisted, and Home finally greets by name
- [x] Appearance: Light / Dark / System, persisted across relaunches
- [x] General: manage categories row with a live count
- [x] Version string
- [x] Rows for work that cannot ship yet are marked **Soon** rather than
      pretending to navigate

**Appearance was not in the plan, and is the most useful row on the screen.**
The dark theme was built in A2 and wired through every token, but nothing in
the UI ever called `setPreference` -- the app had a complete dark mode no user
could reach. It costs no native module, so it went in.

**The tab bar was light in dark mode.** `GlassView` followed the system
appearance while the app followed its own preference. It takes a `colorScheme`
prop for exactly this case. Invisible until Appearance made dark reachable.

**No Tocky Plus banner.** "Hidden when already Plus" implies an entitlement
system that does not exist. A monetisation call, not an implementation one.

**No sign out.** The locked decisions say no account wall; there is nothing to
sign out of.

**Daily reminder, weekly report and export are blocked, not cut.** They need
`expo-notifications`, a date picker and `expo-sharing` / `expo-file-system`,
and `pod install` is still broken, so none can be installed. They are on the
screen, marked Soon, so the shape of Settings is right when they land.

### C10b · Manage categories — **done**

- [x] Category CRUD on the store contract, both implementations
- [x] Add / edit / reorder / archive / restore
- [x] Delete offered only when nothing points at the category; archive instead

**Reorder is buttons, not drag.** No drag-and-drop list is installed, and
`pod install` is broken, so move up / move down carry the order — the same
call C6 made when a time picker was unavailable. `sortOrder` is a fifth
migration; categories were ordered by insertion until they could be moved.

**Delete and archive are never both offered.** A category with a session or a
task against it shows archive only, so there is no path to a confirm dialog
that would have to refuse. The store refuses regardless — the screen decides
what to show, the contract decides what is allowed.

**Archiving keeps history.** An archived category keeps every session it ever
held and leaves the picker. Restoring puts it back.

### C10c · Export & reminders — unblocked, `pod install` fixed in E2

- [ ] Preferences: daily reminder (+ time picker), idle detection, weekly report
- [x] Export: CSV + JSON via the share sheet — C10c-a
- [ ] Help & support

#### C10c-a · Export

- [x] `sessionsToCsv` / `sessionsToJson` in the domain, pure and derived —
      durations computed the way every screen computes them, never stored
- [x] CSV quoting that survives a note with a comma, a quote or a line break
- [x] The share sheet is handed a file, since a CSV is only useful if a
      spreadsheet will open it
- [x] Dismissing the sheet says nothing; a failure never reads as a success
- [x] `SettingsRow` announces its value, so the row reads as "Export data, 12"
      rather than dropping the count VoiceOver most needs

---

## Milestone D — Robustness

### D1 · Edge & fail cases (`Tocky-Flows.md` §6) — **done**

Split into three PRs. Four items were already built, one was cut, two stay
blocked with C10c.

- [x] Short session (<60s) discard confirm — already built in C4
- [x] Cross-midnight attribution (split at local midnight) — already built in C5
- [x] App killed while running → restore on relaunch — already true of SQLite
- [x] Rapid double-tap Start debounce — D1a
- [x] Write failure → retry, error toast, never lose in-memory session — D1a
- [x] Suspiciously long session keep-or-edit prompt — D1b
- [x] DST, timezone travel, backwards clock jump detection — D1b
- [x] Task deleted while linked → keep sessions, null the link — D1c
- [x] Owl `surprised` on a very long session (§6.1) — D1b, not in the original list
- [ ] ~~Offline indicator~~ — **cut**
- [ ] Idle detection with **keep** as the default action — **cannot be built**
- [ ] Notifications denied while reminder is ON — **unreachable**, moves to C10c

**The offline indicator is cut.** There is no `fetch`, no network client and no
remote of any kind in the app. An indicator for a condition that cannot affect
anything is what the locked decisions argue against, and the owner agreed.

**Idle detection cannot be built.** React Native exposes no user-idle API.
`Tocky-Flows.md` §6.4 already licenses degrading to manual pause, which is what
the app does. What survives of the idea — asking about a session that has run
away with itself — is the D1b prompt. The preference toggle stays in C10c.

**Notifications denied is unreachable** until `expo-notifications` can be
installed, so it moves to C10c with the rest of reminders.

#### D1a · Writes that cannot lose a session, starts that cannot double

- [x] `startSession` discards a session a second tap ended before it recorded
      anything — measured on the wall clock, so a session deliberately paused
      and switched away from is still kept
- [x] Every SQLite write retried once, then reported, leaving the snapshot
      untouched so a running session is never lost
- [x] `WriteLanded` on the five writes a screen acts on the outcome of, so no
      screen claims success over a write that never landed

#### D1b · When the clock lies

- [x] `findRunningSessionProblem`, sibling to `findSessionTimeProblem`
- [x] Prompt on open and on foreground, keep as the default, asked once per
      session and written down so a force-quit does not ask again
- [x] Backwards clock jump made visible instead of clamping to `00:00`
- [x] Owl `surprised` past the same threshold

#### D1c · Delete a task, keep its sessions

- [x] `deleteTask` on the contract, both implementations
- [x] Sessions kept, `linkedTaskId` nulled, in one transaction
- [x] Confirm naming how many sessions survive, and a running one separately

### D2 · Accessibility

- [x] VoiceOver labels, roles, and hints on every interactive element — D2a
- [x] Live timer announced politely, not per second — D2a
- [x] Dynamic Type to the largest sizes; Timer and Insights verified — D2b
- [x] Hit targets ≥44pt audited — D2a
- [x] Contrast audit, light and dark — D2b
- [x] Reduce Motion swaps transitions for fades — D2b
- [x] Chart and ring semantic labels — already built in C4 and C7
- [x] Automated a11y assertions in the test suite — D2a

#### D2a · VoiceOver and the live timer

- [x] Every rendered tree in the suite audited for label, trait and target size,
      from a global teardown rather than a test per screen
- [x] The audit held to catching each gap it claims to, since it has twice been
      silently right about nothing
- [x] Task checkbox given a 44pt target around its 26pt circle
- [x] Elapsed time announced on the minute while tracking, and not while paused

#### D2b · Dynamic Type, contrast and Reduce Motion

- [x] `Button` given a minimum height and padding, so a label that grows is not
      clipped by the box it sits in — and rests at the designed height until it
      does
- [x] Contrast audit derived from the colour roles rather than a list, with the
      one exempted role naming the decision that exempted it
- [x] `textDecorative` deleted — a role no screen used
- [x] Reduce Motion drops the press scale rather than snapping it, and trades
      the stack's slide for a cross-fade

### D3 · Performance

- [x] Only the elapsed numerals re-render on tick — the clock moved into
      `TimerRing`, and a test counts the controls' renders so the next change
      cannot lift it back up unnoticed
- [x] Memoized selectors; aggregation cached and invalidated on write — already
      true: every aggregation is a `useMemo` keyed on the store snapshot, which
      is what a write replaces
- [ ] **Cold start under 2s — needs a release build.** The only build on the
      machine is debug, served by Metro, so a number measured from it says
      nothing about the shipped app. Moves to E3 with EAS.
- [x] No network call in the start/stop critical path — enforced by lint rather
      than remembered, so it fails when the call is typed
- [x] List virtualization for History — already a `FlatList` over days, built
      in C5
- [x] Bundle profiling pass — the iOS bundle has a budget CI enforces, at
      3958 KB against 4600 KB, rather than a number read once in a PR

---

## Milestone E — Release

### E1 · Observability

- [ ] Sentry (JS + native), scrubbing notes and free text
- [ ] Structured logger
- [ ] Analytics abstraction and the event taxonomy from the product plan
- [ ] No-op cleanly when keys are absent

### E2 · End-to-end tests

- [x] Maestro flows: first run · start→end · pause/resume · switch · edit ·
      delete · kill-and-restore · task-linked session
- [x] CI job running E2E on an iOS simulator
- [ ] ~~Offline flow~~ — **cut**, for the same reason the offline indicator was
      cut in D1: there is no network call to take away, and lint now enforces it

Each flow buys its own isolation from a `fresh-start` subflow. They share one
simulator, so a session left running by the flow before turns the next tap on
Start into a confirm dialog rather than a timer.

**Three defects the unit suite could not see.** Every one of them needed a real
device: a keyboard that occupies space, a navigation stack with depth, and a
native alert layered over the React tree.

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
