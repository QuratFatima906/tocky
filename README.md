# Tocky

> Tocky tattles on where your day went.

An iOS-first time tracker built with Expo, React Native, and TypeScript. Pick a
category, start a timer, stop it, and see where the day actually went — without
goals, streaks, or productivity scores.

## Documentation

| Document              | What it is                                                        |
| --------------------- | ----------------------------------------------------------------- |
| `BUILD-PLAN.md`       | Every chunk of work, broken into small tasks. One PR per chunk.   |
| `PROGRESS.md`         | What has landed, and what is blocked on a human.                  |
| `docs/Tocky-Flows.md` | Behavior source of truth: flows, timer state machine, edge cases. |
| `tocky-plan(1).md`    | Product plan: positioning, data model, roadmap, locked decisions. |

The visual source of truth is the Claude Design project `Tocky App v2.dc.html`,
mirrored locally (untracked) under `design-source/`.

## Getting started

```bash
npm install
npm start
```

Running on a simulator or device requires a development build (Expo Go cannot
load the native modules Tocky uses):

```bash
npm run ios
```

## Scripts

| Command             | What it does                             |
| ------------------- | ---------------------------------------- |
| `npm start`         | Expo dev server                          |
| `npm run ios`       | Build and run on the iOS simulator       |
| `npm run typecheck` | TypeScript, strict, no emit              |
| `npm run lint`      | ESLint                                   |
| `npm run format`    | Prettier, write                          |
| `npm test`          | Jest unit and integration tests          |
| `npm run verify`    | Typecheck, lint, and test — what CI runs |

## Architecture

```
app/                    Expo Router routes — layout and wiring only
src/
  design-system/        Tokens and primitives. The only place styling lives.
  domain/               Pure business logic: duration, bucketing, aggregation, insights
  data/                 SQLite schema, migrations, repositories
  services/             Side-effectful services: timer, sessions, tasks, export
  features/             Feature-scoped components composed from the design system
  hooks/                Shared React hooks
```

Rules that keep this small:

- **Screens compose, never define.** No screen declares its own colors, spacing,
  formatters, or helper functions. Everything comes from `src/design-system` and
  `src/domain`.
- **Duration is always derived** from `startedAt`, `endedAt`, and `pauses[]`.
  A ticking counter is never the source of truth.
- **Business logic lives outside components**, so it can be tested without React.
- **Starting and stopping a timer never waits on the network.**

## What needs a human

These steps cannot be automated. Everything else in `BUILD-PLAN.md` proceeds
without them.

### 1. Install Xcode — needed for the simulator, dev builds, and Siri

Only Command Line Tools are present on this machine. Install Xcode from the Mac
App Store, then:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
xcodebuild -runFirstLaunch
```

Verify with `xcodebuild -version`.

### 2. Join the Apple Developer Program — needed for TestFlight and the App Store

Enrol at <https://developer.apple.com/programs/> ($99/year). Afterwards, note
your **Team ID** from <https://developer.apple.com/account> → Membership.

### 3. Create an Expo account — needed for cloud builds and CI/CD

```bash
npx expo register     # or: npx expo login
npx eas init
```

Then add an `EXPO_TOKEN` repository secret in GitHub
(Settings → Secrets and variables → Actions), generated at
<https://expo.dev/accounts/[account]/settings/access-tokens>.

### 4. Create a Sentry project — needed for crash reporting

Create a React Native project at <https://sentry.io>, copy the DSN into
`.env.local` as `EXPO_PUBLIC_SENTRY_DSN`, and add it as a GitHub secret.

### 5. Create a Supabase project — only for cloud sync (Milestone F)

Create a project at <https://supabase.com/dashboard>, then copy the project URL
and anon key into `.env.local`.

Copy `.env.example` to `.env.local` and fill in whichever of these you have.
Tocky runs fully without any of them.
