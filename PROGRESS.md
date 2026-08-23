# Tocky — Progress

Chunks map 1:1 to PRs. Task detail lives in `BUILD-PLAN.md`.

Legend: ☐ not started · ◐ in progress · ☑ merged

| #   | Chunk                             | Status | PR  | Notes                                    |
| --- | --------------------------------- | ------ | --- | ---------------------------------------- |
| A1  | Project scaffold & tooling        | ☐      | —   |                                          |
| A2  | Design tokens                     | ☐      | —   |                                          |
| A3a | Icon and mascot artwork           | ◐      | —   |                                          |
| A3b | Core primitives                   | ☐      | —   |                                          |
| A3c | Composite primitives              | ☐      | —   |                                          |
| B1  | Local persistence                 | ☐      | —   |                                          |
| B2  | Domain: duration & aggregation    | ☐      | —   |                                          |
| B3  | Timer engine                      | ☐      | —   |                                          |
| C1  | Navigation shell                  | ☐      | —   |                                          |
| C2  | Home screen (next)                | ☐      | —   |                                          |
| C3  | New session modal                 | ☐      | —   |                                          |
| C4  | Timer screen                      | ☐      | —   |                                          |
| C5  | History screen                    | ☐      | —   |                                          |
| C6  | Session detail & editing          | ☐      | —   |                                          |
| C7  | Insights screen                   | ☐      | —   |                                          |
| C8  | Tasks screen                      | ☐      | —   |                                          |
| C9  | Onboarding                        | ☐      | —   |                                          |
| C10 | Settings & category management    | ☐      | —   |                                          |
| D1  | Edge & fail cases                 | ☐      | —   |                                          |
| D2  | Accessibility                     | ☐      | —   |                                          |
| D3  | Performance                       | ☐      | —   |                                          |
| E1  | Observability                     | ☐      | —   |                                          |
| E2  | End-to-end tests                  | ☐      | —   |                                          |
| E3  | Build & deploy                    | ☐      | —   |                                          |
| E4  | Siri / App Intents                | ☐      | —   | blocked: Xcode + Apple Developer account |
| F   | Post-MVP (sync, widgets, Android) | ☐      | —   |                                          |

---

## Blocked on a human

| What                    | Why                                                                                        | Status |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------ |
| Install Xcode           | Only Command Line Tools present; needed for the iOS simulator, dev builds, and App Intents | ☐      |
| Apple Developer Program | TestFlight, App Store, Sign in with Apple                                                  | ☐      |
| Expo (EAS) account      | Cloud builds and CI/CD                                                                     | ☐      |
| Sentry DSN              | Crash reporting (E1)                                                                       | ☐      |
| Supabase project        | Cloud sync (Milestone F)                                                                   | ☐      |

Instructions for each are in `README.md`.

---

## Log

| Date       | Chunk | What landed                                                                                                                                                                                                                                                                                |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-20 | —     | Plan and progress files created; design + behavior specs imported                                                                                                                                                                                                                          |
| 2026-08-20 | A1    | Expo + Expo Router scaffold, strict TypeScript, ESLint/Prettier, Jest, CI. Review drove out an iOS privacy manifest, a coverage-threshold CI failure, a duplicated Reanimated Babel plugin, and an unused background mode that risked App Store rejection.                                 |
| 2026-08-20 | A3a   | TockyIcon (16 glyphs) and TockyOwl (5 expressions) ported to react-native-svg. Added a dev-only gallery route and web preview so the design can be reviewed without Xcode.                                                                                                                 |
| 2026-08-20 | A2    | Token layer and theme provider. Review found every semantic colour and category chip failed WCAG AA as text, so colours are now _derived_ to be readable rather than hand-picked. Line heights became ratios so Dynamic Type scales them. Fixed a font-load hang and a reduce-motion race. |
