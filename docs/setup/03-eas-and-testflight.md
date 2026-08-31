# 03 · EAS builds and TestFlight

**Cost:** free tier is enough. **Time:** 45 minutes, plus build queue.
**Needs:** [02 · Apple Developer Program](02-apple-developer.md) finished.

This is where Tocky first becomes an app someone else can install.

---

## What EAS is, briefly

Expo Application Services builds the app on Apple hardware in the cloud and
handles the signing certificates, which are the genuinely unpleasant part of
iOS. You do not need a Mac for this — though you have one — and you do not
need to understand provisioning profiles, because EAS creates and rotates them.

Tocky's `eas.json` already defines three profiles:

| Profile       | What it produces                          | Use it for                   |
| ------------- | ----------------------------------------- | ---------------------------- |
| `development` | Simulator build with the dev client       | Working on native code       |
| `preview`     | Device build, internal distribution       | Trying a real build yourself |
| `production`  | Store build, build number auto-increments | TestFlight and the App Store |

---

## Step 1 — An Expo account

1. <https://expo.dev/signup>. Free.
2. Sign in from the terminal:

```bash
npx eas-cli@latest login
```

> `eas` is not installed in this project and does not need to be. `npx
eas-cli@latest` fetches it each time, which keeps you on the current version.
> If you would rather have it permanently: `npm install -g eas-cli`.

Confirm:

```bash
npx eas-cli@latest whoami
```

---

## Step 2 — Link the project

From the repository root:

```bash
npx eas-cli@latest init
```

It asks which account to create the project under, then writes a project ID
into the app config. Because Tocky's config is `app.config.ts` rather than
`app.json`, **check what it did**:

```bash
git diff app.config.ts
```

You want an `extra.eas.projectId` added. If EAS wrote an `app.json` instead —
it sometimes does when it cannot edit a TypeScript config — delete that file
and add the block by hand:

```ts
extra: {
  eas: { projectId: 'the-uuid-eas-printed' },
},
```

Then confirm the config still loads and the test suite still passes:

```bash
npx expo config --type public | head -20
npm run verify
```

Commit it. The project ID is not a secret.

---

## Step 3 — Certificates

```bash
npx eas-cli@latest credentials
```

Choose **iOS** → **production** → **Build Credentials** → **Set up a new
Distribution Certificate**, and let EAS generate everything. Say yes when it
offers to sign in to your Apple Developer account; it needs to, in order to
create the certificate and provisioning profile on Apple's side.

You can also just skip this step and let the first build do it — `eas build`
prompts for exactly the same things. Doing it separately means the first build
fails for build reasons rather than credential reasons, which is easier to
read.

> If Apple asks for an app-specific password rather than your Apple ID
> password, create one at <https://appleid.apple.com> → **Sign-In and
> Security** → **App-Specific Passwords**.

---

## Step 4 — A preview build, for yourself

Do not go straight to production. Prove the pipeline first.

```bash
npx eas-cli@latest build --platform ios --profile preview
```

This takes 10–25 minutes, mostly queueing. It prints a URL you can watch.

When it finishes you get an install link and a QR code. Open it on the iPhone,
install, and run through
[01 · Step 6's checklist](01-physical-device.md#step-6--what-to-actually-check)
again — this is a **release** build, so it is the first time you are seeing
Tocky without a development bundle. Things that differ:

- It is meaningfully faster, because the JavaScript is minified and bundled in
- There is no Metro connection and no dev menu
- Deep links behave differently — this is a real difference the E2E suite hit,
  and why `.maestro/08-export-data.yaml` navigates through the UI rather than
  through `tocky://settings`

### Measure cold start here

This is milestone **D3's last open item**, moved to E3 because it needs
exactly this build.

1. Force-quit Tocky from the app switcher.
2. Open **Xcode → Open Developer Tool → Instruments → App Launch**.
3. Choose the iPhone and Tocky, and record a launch.
4. Read **Total time** from the summary.

The target is **under 2 seconds**. Write the number into `PROGRESS.md`
whatever it is. If it is over, the usual causes are font loading and the first
SQLite open — both of which happen in `app/_layout.tsx`.

> A simpler approximation, if Instruments is more than you want: record the
> screen at 60fps, tap the icon, and count frames to first paint. Less exact,
> but it will tell you whether you are near 2 seconds or nowhere near.

---

## Step 5 — A production build

```bash
npx eas-cli@latest build --platform ios --profile production
```

`autoIncrement` is on for this profile, so the build number rises on its own
and you never hit "this build number already exists".

---

## Step 6 — Submit to TestFlight

```bash
npx eas-cli@latest submit --platform ios --latest
```

This uses `ascAppId` and `appleTeamId` from `eas.json` — the values you set in
[02 · Step 5 and 6](02-apple-developer.md). If it complains they are missing,
that is what to check.

Upload takes a few minutes. Then Apple processes the build, which takes
**10 minutes to a few hours** with no way to hurry it. You get an email.

### Export compliance

The first build asks about encryption. Tocky's config already answers:

```ts
config: {
  usesNonExemptEncryption: false;
}
```

That is accurate — Tocky makes no network calls at all and uses no encryption
beyond what iOS does for you. If App Store Connect asks anyway, the answer is
**No**.

---

## Step 7 — Test it, then invite people

In App Store Connect → **TestFlight**:

**Internal testing** — up to 100 people, all of whom must be on your App Store
Connect team. No review. Available as soon as processing finishes. Start here,
with yourself.

**External testing** — up to 10,000 people, invited by email or a public link.
Needs a **Beta App Review**, which is lighter than a full App Store review but
still takes a day or so.

For external testing you must fill in:

- **Beta App Description** — what testers should try
- **Feedback email**
- **What to Test** — per build

Something like:

> Tocky records where your hours go. Try starting a session from the +
> button, ending it, and finding it in History. Then try the daily reminder,
> and exporting your sessions from Settings. Everything stays on your device —
> there is no account and no network.

---

## Step 8 — Turn on the release workflow

`.github/workflows/release.yml` already exists and does all of the above on a
tag. It needs one secret.

1. <https://expo.dev/accounts/[your-account]/settings/access-tokens>
2. **Create token**, name it `tocky-github-actions`
3. Copy it — **it is shown once**
4. In GitHub: **Settings → Secrets and variables → Actions → New repository
   secret**
   - Name: `EXPO_TOKEN`
   - Value: the token

Then a release is:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow runs `npm run verify` first — a tag is not a reason to skip the
gate — then builds production and submits to TestFlight.

> Tocky's repository is **public**. Never put the token anywhere but GitHub
> secrets. It can create builds and submit to the App Store on your behalf.
> If it ever leaks, revoke it on the same expo.dev page.

Test that it works without spending a build: **Actions → Release → Run
workflow**, with profile `preview` and submit off.

---

## Troubleshooting

**"No bundle identifier found"** — `eas init` did not write the project ID.
See Step 2.

**"Provisioning profile doesn't include signing certificate"** —
`npx eas-cli@latest credentials`, remove the profile, let it regenerate.

**Build fails in Fastlane but works locally** — nearly always a native
dependency out of sync. Locally:
`npx expo prebuild --clean && cd ios && pod install`, then commit nothing
(`ios/` is gitignored) and rebuild — the cloud does its own prebuild.

**"Invalid Bundle. The bundle contains disallowed file 'Frameworks'"** —
almost always a stale `ios/` directory. `npx expo prebuild --clean`.

**Processing stuck for hours** — usually Apple, not you. If over 24 hours,
submit a new build with a higher build number.

---

## Next

[04 · App Store listing and submission](04-app-store-listing.md).
