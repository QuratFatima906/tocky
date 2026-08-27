# Tocky — Progress

Chunks map 1:1 to PRs. Task detail lives in `BUILD-PLAN.md`.

Legend: ☐ not started · ◐ in progress · ☑ merged · ✕ cancelled

## Milestone A — Foundation · complete

| #   | Chunk                      | Status | PR                                                   |
| --- | -------------------------- | ------ | ---------------------------------------------------- |
| A1  | Project scaffold & tooling | ☑      | [#1](https://github.com/QuratFatima906/tocky/pull/1) |
| A2  | Design tokens & theme      | ☑      | [#2](https://github.com/QuratFatima906/tocky/pull/2) |
| A3a | Icon & mascot artwork      | ☑      | [#3](https://github.com/QuratFatima906/tocky/pull/3) |
| A3b | Core primitives            | ☑      | [#4](https://github.com/QuratFatima906/tocky/pull/4) |
| A3c | Composite primitives       | ✕      | cancelled — built per screen instead                 |

## Milestone B — Data & domain

| #   | Chunk                          | Status | Notes          |
| --- | ------------------------------ | ------ | -------------- |
| B1  | Local persistence (SQLite)     | ☑      |                |
| B2  | Domain: duration & aggregation | ☑      | landed with C2 |
| B3  | Timer engine                   | ✕      | see note below |

**B3 cancelled.** A separate `TimerController` state machine was never needed.
`IDLE → RUNNING ⇄ PAUSED → ENDED` is expressed by the session record itself —
`endedAt` and an open pause — and the transitions live on the store contract
(`startSession`, `pause`, `resume`, `endActiveSession`), held to one shared
suite by both implementations. A controller on top would have been a second
source of truth for state the data already carries.

## Milestone C — Screens

| #    | Chunk                            | Status |
| ---- | -------------------------------- | ------ |
| C1   | Navigation shell                 | ☑      |
| C2   | Home screen                      | ☑      |
| C3   | New session modal                | ☑      |
| C4   | Timer screen                     | ☑      |
| C5   | History screen                   | ☑      |
| C6   | Session detail & editing         | ☑      |
| C7   | Insights screen                  | ☑      |
| C8   | Tasks screen                     | ☑      |
| C9   | Onboarding                       | ☑      |
| C10a | Settings shell & profile         | ☑      |
| C10b | Manage categories                | ☑      |
| C10c | **Export & reminders — blocked** | ☐      |

## Milestones D–F

| #   | Chunk                      | Status | Notes                                |
| --- | -------------------------- | ------ | ------------------------------------ |
| D1  | Edge & fail cases          | ☐      |                                      |
| D2  | Accessibility              | ☐      |                                      |
| D3  | Performance                | ☐      |                                      |
| E1  | Observability              | ☐      | needs Sentry DSN                     |
| E2  | End-to-end tests (Maestro) | ☐      | unblocked — simulator works          |
| E3  | Build & deploy             | ☐      | needs Apple Developer + `EXPO_TOKEN` |
| E4  | Siri / App Intents         | ☐      | needs a physical iPhone              |
| F   | Post-MVP (sync, widgets)   | ☐      |                                      |

---

## Current state

- `main` is green: **531 tests**, typecheck / lint / format clean.
- App builds and runs on **iPhone 17 Pro, iOS 26.5** (`npm run ios`).
- `main` is branch-protected: PR required, `Verify` check required,
  `enforce_admins: true`. Direct pushes are rejected.
- Every screen in Milestone C except settings is built and verified on the
  simulator against the real SQLite database.
- The core loop closes end to end: pick a category → timer → end → the session
  lands on Home, History and Insights, and survives a relaunch.
- Sessions, categories, tasks and preferences persist in SQLite at schema
  version 5.
- Jest runs pinned to `America/New_York` so local-time and DST bugs
  cannot hide behind a UTC test machine.

## Environment

| Tool              | Status                                    |
| ----------------- | ----------------------------------------- |
| Xcode             | ☑ 26.6 (17F113)                           |
| iOS runtime       | ☑ 26.5, iPhone 17 Pro + 7 more simulators |
| Disk              | ☑ ~96 GB free                             |
| Apple Developer   | ☐ needed for E3                           |
| Expo `EXPO_TOKEN` | ☐ needed for E3                           |
| Sentry DSN        | ☐ needed for E1                           |
| Supabase          | ☐ needed for Milestone F                  |

---

## Decisions that changed course

| Date       | Decision                                                                                                                                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-20 | Pink CTA keeps the design's white-on-pink despite failing AA. Owner's call, light mode only; dark mode already passes at 6.73:1.                                                                                                                               |
| 2026-08-23 | **A3c cancelled.** Composite components are built when a screen first needs them, then promoted on second use.                                                                                                                                                 |
| 2026-08-23 | **Component gallery deleted.** The design system lives in code, not as a screen in the app. Components are reviewed on the screens that use them.                                                                                                              |
| 2026-08-25 | **The locked decisions beat the design source three times.** The timer's `Goal · 3h 00m`, the Insights streak tile, and the green up-arrow week delta all imply a score. Dropped, replaced, and reworded as plain observation.                                 |
| 2026-08-25 | **No time or date pickers anywhere.** `@react-native-community/datetimepicker` is a native module and `pod install` is still broken, so editing times uses ±5/±15 nudges and date filtering is done by searching the day heading. Revisit once pods are fixed. |
| 2026-08-25 | **B3 cancelled.** The timer state machine is the session record plus the store contract; a `TimerController` would be a second source of truth.                                                                                                                |

---

## Log

| Date       | Chunk | What landed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-20 | —     | Plan and progress files; design + behavior specs imported                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-08-20 | A1    | Expo + Expo Router, strict TypeScript, ESLint/Prettier, Jest, CI. Review drove out an iOS privacy manifest, a coverage-threshold CI failure, a duplicated Reanimated Babel plugin, and an unused background mode risking App Store rejection.                                                                                                                                                                                                                                                |
| 2026-08-20 | A2    | Token layer and theme provider. Review found every semantic colour and category chip failed WCAG AA as text, so colours are now _derived_ readable rather than hand-picked. Line heights became ratios so Dynamic Type scales them. Fixed a font-load hang and a reduce-motion race.                                                                                                                                                                                                         |
| 2026-08-20 | A3a   | 16 icons and 5 owl expressions ported to react-native-svg. Review found cutouts painted white on dark backgrounds; they are now SVG masks, so icons need no knowledge of what sits behind them.                                                                                                                                                                                                                                                                                              |
| 2026-08-23 | A3b   | Text, Screen, Surface/Card, PressableScale, Button, IconButton. First native build on the simulator. Found test files shipping as routes, and Reanimated 4's removed jest mock.                                                                                                                                                                                                                                                                                                              |
| 2026-08-23 | —     | Component gallery removed after owner feedback.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-08-24 | C1    | Navigation shell. Tab bar with real Liquid Glass via `expo-glass-effect`, already vendored by expo-router so no new native dependency. The mini-bar moved out of Home into a persistent host. Building it surfaced a self-cancelling context bug: a report callback that depended on the state it wrote reset every measurement to zero.                                                                                                                                                     |
| 2026-08-24 | C2    | First real screen. Home with domain, in-memory store and dev seed. Found a pause-rounding bug that lost a second per pause, and that comparing today against yesterday's _whole_ day reads as judgement — it now compares against the same point yesterday.                                                                                                                                                                                                                                  |
| 2026-08-25 | C1    | Review fixes: `BottomChrome` moved into the design system, tabs given button traits and readable contrast, the mini-bar's clock gated on focus. `useNow` gained a null interval meaning "stopped", with a catch-up so the clock never shows the time it stopped at.                                                                                                                                                                                                                          |
| 2026-08-25 | B1    | SQLite behind the existing `SessionStore` contract, seeded by migration so it can never run twice. expo-sqlite cannot load under Jest at all, so a four-method port sits between store and driver — expo-sqlite in the app, Node's built-in `node:sqlite` in tests. The dev seed was deleted with the in-memory data it fed.                                                                                                                                                                 |
| 2026-08-25 | C3    | New session modal, and `startSession`, which ends whatever runs at the same instant the new session starts. Two bugs only the simulator could find: a category grid that subtracted pixels from a percentage and laid out four across, and **every disabled button in the app rendering at full strength** because `PressableScale`'s animated style overwrote the caller's opacity.                                                                                                         |
| 2026-08-25 | C4    | Timer, and the end-to-end slice C3 left open. The design's `Goal · 3h 00m` contradicts the locked "no goals" decision, so the ring became a clock face: one sweep per hour. Switch reuses the New session modal rather than growing a second picker. Found a `ToastProvider` timer that was never cleared.                                                                                                                                                                                   |
| 2026-08-25 | C5    | History. `groupSessionsByDay` splits sessions at local midnight, asserted against a 25-hour day. One search field matches label, category, day heading and note, so "yesterday" filters by date without a date picker. A `SectionList` cannot wrap a section's items in one card; a `FlatList` over days can.                                                                                                                                                                                |
| 2026-08-25 | C6    | Session detail and editing — the first screen that changes recorded data. `findSessionTimeProblem` refuses an end before its start, a start in the future, and any overlap, since two sessions sharing a minute make every total above them wrong. Editing times uses nudges, not a picker, because `pod install` is still broken.                                                                                                                                                           |
| 2026-08-25 | C7    | Insights. Two more collisions with the locked decisions: the streak tile is gone, and the green up-arrow delta became "6h 00m less than last week" in plain grey. Weeks start Monday and a week containing a clock change still covers seven local days.                                                                                                                                                                                                                                     |
| 2026-08-25 | C9    | Onboarding. Three panes gated by `Stack.Protected` on a flag persisted in a new SQLite `settings` table. The pager was opening on the second pane while the dots said the first — invisible to tests, because a `ScrollView` does not scroll under jest. Added the sign-in door the design and flows both call for; leaving by any door retires the panes.                                                                                                                                   |
| 2026-08-25 | C8    | Tasks, and the first state shared between two records. Completing a tracked task asks what to do with the session; starting one over a running session asks too, through the same confirmation three screens now share. Closed C6's linked-task row. A horizontal `ScrollView` in a column stretches to fill it.                                                                                                                                                                             |
| 2026-08-26 | C10a  | Settings shell and profile. The name persists and Home finally greets by it. Appearance — Light / Dark / System — was not in the plan: the dark theme was built in A2 and reachable from nothing, so the app carried a complete dark mode no user could turn on. Turning it on exposed a tab bar that stayed light, because `GlassView` follows the system unless told the app has its own toggle. Reminders and export are blocked on `pod install`, so they sit on the screen marked Soon. |
