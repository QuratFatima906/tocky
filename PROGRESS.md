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

| #   | Chunk                          | Status | Notes                                             |
| --- | ------------------------------ | ------ | ------------------------------------------------- |
| B1  | Local persistence (SQLite)     | ☐      |                                                   |
| B2  | Domain: duration & aggregation | ◐      | `types` / `duration` / `format` written, untested |
| B3  | Timer engine                   | ☐      |                                                   |

## Milestone C — Screens

| #   | Chunk                    | Status |
| --- | ------------------------ | ------ |
| C1  | Navigation shell         | ☐      |
| C2  | **Home screen — next**   | ☐      |
| C3  | New session modal        | ☐      |
| C4  | Timer screen             | ☐      |
| C5  | History screen           | ☐      |
| C6  | Session detail & editing | ☐      |
| C7  | Insights screen          | ☐      |
| C8  | Tasks screen             | ☐      |
| C9  | Onboarding               | ☐      |
| C10 | Settings & categories    | ☐      |

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

- `main` is green: **112 tests**, typecheck / lint / format clean.
- App builds and runs on **iPhone 17 Pro, iOS 26.5** (`npm run ios`).
- `main` is branch-protected: PR required, `Verify` check required,
  `enforce_admins: true`. Direct pushes are rejected.
- `src/domain/` (`types.ts`, `duration.ts`, `format.ts`) is written but
  **untracked and untested** — it lands with the Home chunk.

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

| Date       | Decision                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-20 | Pink CTA keeps the design's white-on-pink despite failing AA. Owner's call, light mode only; dark mode already passes at 6.73:1.                  |
| 2026-08-23 | **A3c cancelled.** Composite components are built when a screen first needs them, then promoted on second use.                                    |
| 2026-08-23 | **Component gallery deleted.** The design system lives in code, not as a screen in the app. Components are reviewed on the screens that use them. |

---

## Log

| Date       | Chunk | What landed                                                                                                                                                                                                                                                                          |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-20 | —     | Plan and progress files; design + behavior specs imported                                                                                                                                                                                                                            |
| 2026-08-20 | A1    | Expo + Expo Router, strict TypeScript, ESLint/Prettier, Jest, CI. Review drove out an iOS privacy manifest, a coverage-threshold CI failure, a duplicated Reanimated Babel plugin, and an unused background mode risking App Store rejection.                                        |
| 2026-08-20 | A2    | Token layer and theme provider. Review found every semantic colour and category chip failed WCAG AA as text, so colours are now _derived_ readable rather than hand-picked. Line heights became ratios so Dynamic Type scales them. Fixed a font-load hang and a reduce-motion race. |
| 2026-08-20 | A3a   | 16 icons and 5 owl expressions ported to react-native-svg. Review found cutouts painted white on dark backgrounds; they are now SVG masks, so icons need no knowledge of what sits behind them.                                                                                      |
| 2026-08-23 | A3b   | Text, Screen, Surface/Card, PressableScale, Button, IconButton. First native build on the simulator. Found test files shipping as routes, and Reanimated 4's removed jest mock.                                                                                                      |
| 2026-08-23 | —     | Component gallery removed after owner feedback.                                                                                                                                                                                                                                      |
