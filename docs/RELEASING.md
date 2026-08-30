# Releasing Tocky

Everything here is blocked on credentials the repository does not hold. The
configuration is in place and checked; what remains is an account and two
secrets.

## What a human has to supply

| Needed                        | Where it goes                                         | Blocks                   |
| ----------------------------- | ----------------------------------------------------- | ------------------------ |
| Apple Developer Program (£79) | An Apple ID enrolled as an organisation or individual | Any signed build at all  |
| App Store Connect app record  | `eas.json` → `submit.production.ios.ascAppId`         | Submitting to TestFlight |
| Apple Team ID                 | `eas.json` → `submit.production.ios.appleTeamId`      | Submitting to TestFlight |
| `EXPO_TOKEN`                  | GitHub → Settings → Secrets → Actions                 | The `Release` workflow   |

`EXPO_TOKEN` comes from **expo.dev → Account settings → Access tokens**. It is
a robot token, so it belongs to the account rather than to a person.

## First release, in order

1. Enrol in the Apple Developer Program, and wait for it to be approved.
2. `npx eas login`, then `npx eas build:configure` to attach the project to an
   EAS account. This writes an `extra.eas.projectId` into the app config.
3. Create the app in App Store Connect and put its ID and your Team ID into
   `eas.json`. Both placeholders say `REPLACE_WITH_` until you do.
4. Add `EXPO_TOKEN` to the repository secrets.
5. `npx eas build --profile preview --platform ios` and install it on a device.
   This is the first time the app runs anywhere other than a simulator.
6. Tag the commit `v0.1.0`. The `Release` workflow builds production and
   submits to TestFlight.

## The build profiles

| Profile       | What it is                                                       |
| ------------- | ---------------------------------------------------------------- |
| `development` | A simulator build with the dev client, for working on native     |
| `preview`     | A device build, internally distributed, signed for ad hoc use    |
| `production`  | What goes to TestFlight and the App Store, build auto-increments |

## Before tagging a release

- [ ] `npm run verify` clean — typecheck, lint, format, unit tests
- [ ] `maestro test .maestro/` — all flows pass against a release build
- [ ] `npm run bundle:check` — the bundle is inside its budget
- [ ] `version` in `app.config.ts` matches the tag
- [ ] `PROGRESS.md` says what changed and what is still open
- [ ] The app has been run on a **physical device**, not only the simulator —
      Liquid Glass, haptics, notification delivery and Dynamic Type all behave
      differently there
- [ ] Cold start measured on a release build. This is the D3 item that could
      not be answered from a debug build served by Metro.

## Still missing for the App Store

These need a human and are not written down anywhere else:

- **Screenshots** at every required size, from a release build
- **App Store description, keywords, support URL, marketing URL**
- **Privacy nutrition label.** Tocky collects nothing and makes no network
  call, so this is "Data Not Collected" — but it still has to be declared
- **Age rating** questionnaire
- An **App Store icon** at 1024×1024 with no alpha channel

The iOS privacy manifest is already declared in `app.config.ts`, and a test
holds it to naming every required-reason API the app touches.
