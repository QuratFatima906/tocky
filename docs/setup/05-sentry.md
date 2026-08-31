# 05 · Sentry — milestone E1

**Cost:** free tier covers this easily. **Time:** about an hour. **Needs:**
nothing. Do this whenever.

This is milestone **E1 Observability**. It is the one remaining task with code
to write, and I deliberately did not write it — see
[What I did not build](#what-i-did-not-build-and-why) at the end for the
reasoning, which you may disagree with.

---

## What it gives you

Right now, if Tocky crashes on someone's phone, you find out when they email
`hello@tocky.app`. Most people just delete the app.

Sentry gives you the stack trace, the device, the iOS version, and what the
person was doing — without them doing anything.

---

## Step 1 — Account and project

1. <https://sentry.io/signup/> — free tier is 5,000 errors a month, which is
   thousands more than a small app produces
2. **Create Project** → platform **React Native** → name it `tocky`
3. Copy the **DSN** it shows you. It looks like:

```
https://abc123def456@o1234567.ingest.sentry.io/7654321
```

> The DSN is **not** a secret in the way an API key is. It only permits
> _sending_ events, and it ships inside every copy of the app, where anyone
> can read it. It is fine in the repository. The **auth token** in Step 5 is a
> real secret and is not.

---

## Step 2 — Install

```bash
npx expo install @sentry/react-native
```

`npx expo install` rather than `npm install` — it picks the version matching
Expo SDK 57 rather than the newest, which is how the rest of this project's
native dependencies were added.

Add the config plugin to `app.config.ts`, alongside the others:

```ts
plugins: [
  'expo-router',
  'expo-font',
  'expo-sqlite',
  'expo-localization',
  'expo-notifications',
  '@react-native-community/datetimepicker',
  '@sentry/react-native/expo',   // ← add
  [ 'expo-splash-screen', { /* ... */ } ],
],
```

Then rebuild the native project — this is a native module, so Metro alone will
not do:

```bash
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
npx expo run:ios
```

> `pod install` is working as of 2026-08-30. If it complains about
> `ExpoModulesWorklets` and `ExpoModulesCore` disagreeing, the fix is to update
> both in one command — see `tocky-stack-gotchas` or run:
> `pod update ExpoModulesWorklets ExpoModulesCore --no-repo-update`

---

## Step 3 — Initialise it

In `app/_layout.tsx`, before the component definitions:

```ts
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  // No DSN, no Sentry. Development runs and anyone building from a fork get a
  // no-op rather than events landing in someone else's project.
  enabled: SENTRY_DSN !== undefined && !__DEV__,
  // Tocky records what people do with their days. None of it is Sentry's.
  sendDefaultPii: false,
  tracesSampleRate: 0.2,
});
```

and wrap the default export:

```ts
export default Sentry.wrap(RootLayout);
```

Put the DSN in `.env`:

```bash
echo "EXPO_PUBLIC_SENTRY_DSN=https://your-dsn-here" >> .env
```

Check `.env` is gitignored — and note that `EXPO_PUBLIC_` variables are
**inlined into the bundle**, so this is public by design. That is fine for a
DSN and would not be for anything else.

---

## Step 4 — Scrub free text, before you ship it

**This is the part that matters most, and the part it would be easy to skip.**

Tocky's whole value is that nothing leaves the device. The moment Sentry is
added, that stops being categorically true — and session labels, notes and
task titles are exactly the kind of free text people put private things in.

`Tocky-Flows.md` and the E1 plan both call for scrubbing notes and free text.
Add a `beforeSend`:

```ts
Sentry.init({
  // ...as above
  beforeSend(event) {
    // A crash in Tocky is worth knowing about. What someone wrote in a session
    // note is not, and it is exactly what people put private things in.
    if (event.request?.data !== undefined) delete event.request.data;

    for (const value of event.exception?.values ?? []) {
      if (value.value !== undefined) {
        value.value = value.value.replace(/'[^']{12,}'/g, "'[redacted]'");
      }
    }

    event.breadcrumbs = event.breadcrumbs?.map((crumb) => ({
      ...crumb,
      message: crumb.message?.slice(0, 100),
      data: undefined,
    }));

    return event;
  },
});
```

Then **prove it**, rather than trusting it. A test in the style the rest of
this project uses:

```ts
it('never sends what someone wrote in a note', () => {
  const scrubbed = beforeSend(eventContaining('Divorce paperwork'));

  expect(JSON.stringify(scrubbed)).not.toContain('Divorce paperwork');
});
```

Also update the privacy policy and the App Store privacy label. Once Sentry
ships, **"Data Not Collected" is no longer accurate** — crash diagnostics are
collected data, and the label has to say so. See
[04 · Step 4](04-app-store-listing.md#step-4--privacy).

---

## Step 5 — Source maps

Without these, every stack trace is minified nonsense like `a.b.c is not a
function`.

1. Sentry → **Settings → Auth Tokens → Create New Token**, with scopes
   `project:releases` and `org:read`
2. Locally, in `.env`:

```
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=tocky
```

3. For EAS builds, it must be a **secret**, not a plain variable:

```bash
npx eas-cli@latest secret:create --scope project --name SENTRY_AUTH_TOKEN --value sntrys_...
```

> Unlike the DSN, this token can write to your Sentry account. It goes in EAS
> secrets and GitHub secrets, never in the repository.

---

## Step 6 — Verify it works

Add a temporary crash somewhere reachable — a button on Settings — and run a
**release** build on a device:

```ts
<Button label="Crash" onPress={() => { throw new Error('Sentry smoke test'); }} />
```

Tap it. The error should appear in Sentry within a minute, with a readable
stack trace pointing at real file names and line numbers.

**Then delete the button.** Do not ship it.

If the trace is unreadable, source maps did not upload — check the build log
for the Sentry upload step.

---

## Step 7 — What is worth reporting

Tocky already handles its own failures well. Three places where an
`captureException` would tell you something the toast cannot:

| Where                                   | Why                                                                |
| --------------------------------------- | ------------------------------------------------------------------ |
| `src/data/sqlite/sqliteSessionStore.ts` | A write that failed twice — the user saw a toast, you saw nothing  |
| `src/services/shareExport.ts`           | The `catch` that returns `'failed'` currently swallows the reason  |
| `src/services/dailyReminder.ts`         | Its `catch` blocks are silent by design; Sentry gives them a voice |

All three already catch and handle correctly. They just discard the cause.

---

## What I did not build, and why

The E1 plan also lists a **structured logger** and an **analytics abstraction
with an event taxonomy**. I did not build either, and it was a judgement call
rather than an oversight.

With no Sentry project and no analytics provider, both would be abstractions
with exactly zero implementations behind them — scaffolding for a consumer
that does not exist. That is the same reasoning that cut the offline indicator
in D1 (an indicator for a condition that cannot occur) and stopped D3 reporting
a cold-start number from a debug build.

If you want them anyway — and there is a reasonable argument that the event
taxonomy is a _design_ artefact worth writing down before there is anywhere to
send events — say so and I will build them.

---

## Next

Nothing depends on this. [06 · Siri](06-siri-app-intents.md) is the largest
remaining piece of actual product.
