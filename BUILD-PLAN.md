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

### B1 · Local persistence

- [ ] `expo-sqlite` setup with versioned migrations
- [ ] Tables: `categories`, `sessions`, `pauses`, `tasks`, `prefs`, `sync_queue`
- [ ] Indexes on `sessions(startedAt)`, `sessions(categoryId)`
- [ ] Client-generated UUIDs
- [ ] Repository layer (`CategoryRepository`, `SessionRepository`, `TaskRepository`,
      `PrefsRepository`) behind interfaces
- [ ] Seed the 6 default categories on first run
- [ ] Integration tests against an in-memory database

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

### C1 · Navigation shell

- [ ] Expo Router layout: Home · History · `+` · Insights · Tasks
- [ ] Raised centre `+` opening the New-session modal
- [ ] Persistent "Now tracking" mini-bar host above the tab bar
- [ ] Modal vs pushed-screen presentation rules
- [ ] Deep-link routes for Siri and widgets

### C2 · Home

- [ ] Greeting (date + name) and profile/owl entry to Settings
- [ ] "Tracked today" card: total, vs-yesterday delta, segmented category bar, legend
- [ ] Breakdown list: category tile · progress · time
- [ ] Recent sessions list → Session detail
- [ ] "Now tracking" mini-bar: live time, inline pause, tap → Timer
- [ ] States: active · no active session · empty day · loading skeleton

### C3 · New session (modal)

- [ ] Category grid with selected ring + check
- [ ] Optional label field
- [ ] Pinned "Start {Category} session" button, disabled until a category is chosen
- [ ] Dismiss cancels, tracking nothing
- [ ] Switch-confirm when a session is already active
- [ ] **End-to-end slice: start → Timer → end → saved → Home updates**

### C4 · Timer

- [ ] Header (collapse · title · ⋯ menu), category pill with label
- [ ] Progress ring + owl + elapsed numerals + goal
- [ ] Control cluster: End · Primary (Pause/Start) · Switch
- [ ] Running vs paused visuals: ring color/dim, owl expression, state label
- [ ] "Add a note" inline entry
- [ ] End: confirm-discard under 60s, otherwise save + success toast
- [ ] Switch: category picker, single confirm, zero time gap
- [ ] Collapse keeps the session running

### C5 · History

- [ ] Day groups (Today · Yesterday · dated) with daily totals
- [ ] Session rows: start time · category tile · title · duration
- [ ] Search/filter by category, label, and date
- [ ] Lazy-load by day
- [ ] States: empty · loading skeleton

### C6 · Session detail & editing

- [ ] Owl hero, category pill, title, duration, date and range
- [ ] Meta rows: Started · Ended · Pauses (count + total) · Linked task
- [ ] Note card
- [ ] Resume → new session with the same category/label
- [ ] Delete with confirm; blocked while the session is active
- [ ] Edit: category, label, start/end, note
- [ ] Validation: end ≤ start blocked inline; overlap disallowed

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
