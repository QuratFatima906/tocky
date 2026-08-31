# 04 · App Store listing and submission

**Cost:** free. **Time:** 2–3 hours, mostly screenshots and copy.
**Waiting:** 1–3 days for review. **Needs:**
[03 · a build on TestFlight](03-eas-and-testflight.md).

Everything here is written by a person. None of it can be generated from the
repository, which is why it is the last thing standing between Tocky and the
App Store.

---

## Step 1 — The App Store icon

Separate from the icon in the app, and stricter.

- **1024 × 1024** pixels, PNG
- **No alpha channel and no transparency.** Apple rejects both.
- **No rounded corners** — Apple rounds it for you. Supply a full square.

The app's icon is `assets/icon.png`. Check what you have:

```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/icon.png
```

If `hasAlpha: yes`, flatten it onto Tocky's paper background:

```bash
sips -s format png --setProperty formatOptions best \
  -z 1024 1024 assets/icon.png --out /tmp/icon-1024.png
```

then open it in Preview and export without alpha, or use any image editor to
composite it over `#FBFAF8` — which is `NATIVE_SURFACES.paper`, Tocky's
background, so the icon sits on the colour the app actually uses.

Upload it in App Store Connect → your app → **App Information**.

---

## Step 2 — Screenshots

**Required:** iPhone 6.9" display (iPhone 16 Pro Max / 17 Pro Max class),
1320 × 2868 portrait. Apple scales that down for smaller devices, so one set
is enough. You may add a 6.5" set if you want tighter control.

Between 3 and 10. Aim for 5 or 6.

### Take them from the simulator

The 17 Pro is already booted and Tocky is installed:

```bash
xcrun simctl list devices | grep "17 Pro Max"
```

If there is no Pro Max, add one in Xcode → **Window → Devices and
Simulators → Simulators → +**.

Then, per screen:

```bash
xcrun simctl io booted screenshot ~/Desktop/tocky-01-home.png
```

Check the size — Apple rejects anything off by a pixel:

```bash
sips -g pixelWidth -g pixelHeight ~/Desktop/tocky-01-home.png
```

### Get real data in first

Empty screens make a bad listing. Before shooting, use the app for a few
minutes: create sessions across several categories, on several days, so Home,
History and Insights all have something in them.

A quick way, using the flows that already exist:

```bash
export PATH="$HOME/.maestro/bin:$PATH"
maestro test .maestro/02-start-and-end.yaml
```

Then start and end a few more by hand, across different categories.

### What to shoot, in order

1. **Home** with a few hours tracked — the first impression
2. **Timer** mid-session, ring part-swept
3. **Insights** with a full week in the chart
4. **History** with several days grouped
5. **Tasks** with a couple tracked and one done
6. **Settings** in dark mode — shows dark mode exists without spending a slot

### Tidy the status bar

The simulator clock says whatever it says. Make it neat:

```bash
xcrun simctl status_bar booted override \
  --time "9:41" --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularBars 4
```

9:41 is the time in every Apple keynote. Clear it after with:

```bash
xcrun simctl status_bar booted clear
```

---

## Step 3 — The listing copy

### Name (30 characters)

`Tocky` — or a variant if taken. See
[02 · Step 6](02-apple-developer.md#step-6--create-the-app-store-connect-record).

### Subtitle (30 characters)

Must not imply a score. Tocky is observational — that is a locked decision,
and the copy has to hold to it.

Good: `Where your hours actually go` (28)
Also fine: `Quiet time tracking` (19)

Avoid anything with _productivity_, _goals_, _more done_, _focus score_.

### Promotional text (170 characters, changeable without review)

> Tocky records where your hours go, and nothing else. No accounts, no
> scoreboards, no guilt — just an honest picture of your day, kept entirely on
> your phone.

### Description (4,000 characters)

```
Where did your day go?

Tocky quietly watches the clock so you don't have to. Tap a category, and it
tracks where your hours actually land.

No scoreboards. No streaks. No targets to miss. Tocky has opinions about
accuracy and none at all about how you spend your time.

ONE TAP TO START
Pick a category and the clock runs. Switch what you're doing without losing a
second — the old session ends the moment the new one starts, so no time goes
untracked.

HONEST TIME
Every duration is worked out from when a session started and ended, minus every
pause. Nothing is counted up, so nothing drifts. Sessions that cross midnight
are split at midnight for your daily totals, while the session itself stays
whole.

SEE WHERE THE HOURS LAND
A week at a time, by category, in plain numbers. Tocky will tell you that you
tracked six hours less than last week. It will not tell you how to feel
about it.

YOUR DAY, ON YOUR PHONE
Everything stays on this device. Tocky makes no network calls at all — there is
nothing to sign up for and nothing to leak. Export everything to CSV or JSON
whenever you like.

BUILT TO BE USED BY EVERYONE
Full VoiceOver support, Dynamic Type to the largest sizes, Reduce Motion
respected, and every tap target sized for a real thumb.

ALSO
• A daily reminder, at a time you pick
• A weekly look back, if you want one
• Tasks, with time tracked against them
• Light and dark, following your phone or set by hand
```

### Keywords (100 characters, comma-separated, no spaces after commas)

```
time,tracker,timer,hours,log,productivity,work,focus,timesheet,billable,tracking,day
```

> Do not repeat the app name — it is already indexed. Do not use competitor
> names; Apple rejects that.

### Support URL — **required**

Apple will not accept a listing without one. Options, cheapest first:

1. A GitHub Pages page on this repository
2. The repository's README
3. A one-page site anywhere

It must be reachable and must mention how to get help. Tocky's in-app **Help &
support** screen already says to email `hello@tocky.app` — either make that
address work, or change it in `src/features/settings/HelpScreen.tsx` to one
you read.

> This is a real loose end. `hello@tocky.app` is written into the app and into
> this listing. Decide what it should be before submitting.

### Marketing URL — optional. Leave blank rather than invent one.

---

## Step 4 — Privacy

This is the part most apps get wrong and Tocky gets trivially right.

App Store Connect → **App Privacy** → **Get Started**.

**"Do you collect data from this app?"** → **No**

That is not a simplification. Tocky has no network client — there is a lint
rule that fails the build if anyone adds `fetch`, `XMLHttpRequest`,
`WebSocket` or `EventSource` to `src/` or `app/`. Nothing leaves the device.

The label will read **Data Not Collected**, which is the strongest privacy
label the App Store has.

### Privacy policy URL — required even so

Apple requires one even when nothing is collected. It can be a single page:

```
Tocky Privacy Policy

Tocky does not collect, transmit or store any personal data.

Everything you record — sessions, categories, tasks and preferences — is kept
in a database on your device and nowhere else. The app makes no network
requests of any kind.

Tocky does not use analytics, advertising, or third-party trackers.

If you delete Tocky, everything it recorded is deleted with it. You can export
your data to CSV or JSON at any time from Settings.

Contact: [your email]
Last updated: [date]
```

Host it wherever the support URL lives.

> If you later add Sentry ([05](05-sentry.md)) or Supabase
> ([07](07-supabase.md)), **this stops being true** and both the policy and the
> privacy label must be updated before that build ships. Sentry collects crash
> diagnostics; Supabase collects everything you sync.

---

## Step 5 — Age rating

**Age Rating → Edit.** Answer **None** to everything — no violence, no
profanity, no gambling, no unrestricted web access, no user-generated content
that is shared.

Tocky rates **4+**.

---

## Step 6 — The rest of the form

- **Category:** Primary **Productivity**. Secondary **Utilities**.
- **Copyright:** `2026 [your name]`
- **Sign-in required:** **No** — and it is genuinely no, which reviewers like
- **Contact information:** yours, for the review team only, never public
- **Notes for the reviewer:**

  > Tocky is entirely offline. There is no account, no sign-in and no network
  > connection of any kind, so there are no credentials to provide.
  >
  > To review the core loop: tap + on the tab bar, pick a category, and the
  > timer starts. End it and the session appears on Home, in History and in
  > Insights.
  >
  > The "Daily reminder" in Settings schedules a local notification. The app
  > does not use push notifications and contacts no server.

  That last paragraph matters. Reviewers see a notification permission prompt
  and look for a push backend; telling them there is none saves a rejection.

---

## Step 7 — Submit

1. **App Store** tab → your version → **Build** → select the TestFlight build
2. Fill anything still marked with a yellow warning triangle
3. **Add for Review** → **Submit**

Choose **Manually release this version** rather than automatic. You want to
decide when it goes live, not find out it went live at 3am.

### Review takes 1–3 days

Common rejections and what they mean for Tocky specifically:

| Rejection                        | Cause                                                        |
| -------------------------------- | ------------------------------------------------------------ |
| Guideline 2.1 — needs more info  | Usually the notification prompt. The reviewer note covers it |
| Guideline 4.2 — minimum function | Unlikely; Tocky does a real thing well                       |
| Screenshots do not match the app | Never mock up screenshots. Shoot the real build              |
| Privacy label mismatch           | Only if you add Sentry or Supabase and forget to update it   |

If rejected, Apple says why in **Resolution Center**. Reply there — it is a
conversation, and answering it well is usually faster than resubmitting.

---

## Step 8 — After approval

Press **Release**.

Then, in this repository:

- [ ] `PROGRESS.md` — record the release date and version
- [ ] `git tag v0.1.0 && git push origin v0.1.0` if you did not release via
      the workflow
- [ ] Bump `version` in `app.config.ts` for the next cycle

---

## Next

Nothing is blocking. [05 · Sentry](05-sentry.md) is the natural next thing —
once real people have it, you want to know when it breaks for them.
