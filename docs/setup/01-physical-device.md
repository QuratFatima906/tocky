# 01 · Run Tocky on a real iPhone

**Cost:** free. **Time:** about 30 minutes. **Needs:** an iPhone, a USB cable,
and any Apple ID.

Tocky has never run on real hardware. Every screenshot in `PROGRESS.md` is a
simulator. This is the single highest-value thing on the list, because a
simulator cannot show you:

- **Liquid Glass** on the tab bar — the simulator approximates it
- **Haptics** — `expo-haptics` does nothing on a simulator
- **Whether the daily reminder actually arrives** at 20:00
- **Dynamic Type** at the sizes people really use
- **VoiceOver** as a person uses it, rather than as a test asserts it
- **Real performance** — a simulator uses your Mac's CPU, which is far faster
  than an iPhone

You do **not** need the Apple Developer Program for this.

---

## Step 1 — Free signing, and the entitlement in the way

A free Apple ID can sign apps onto your own device. There is one obstacle
specific to Tocky.

When `expo-notifications` was added, its config plugin wrote a **push
notification entitlement** into `ios/Tocky/Tocky.entitlements`:

```xml
<key>aps-environment</key>
<string>development</string>
```

That entitlement requires a **paid** account to sign. Tocky does not need it —
it only ever schedules _local_ notifications, which need no entitlement at
all. Nothing in the app requests a push token or talks to Apple's push
servers.

**You have two options.**

### Option A — remove the entitlement (recommended)

This is the correct end state regardless: shipping a push entitlement you
never use invites an App Store review question you have no answer to.

Ask me to do it, or do it yourself in `app.config.ts` by telling the plugin
not to add it. Then:

```bash
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
```

Confirm it is gone:

```bash
cat ios/Tocky/Tocky.entitlements
```

You want a file with no `aps-environment` key.

> Verify the daily reminder still fires after this. It should — local
> notifications have never needed the entitlement — but confirm it rather than
> assume it, in Step 5 below.

### Option B — do Step 02 first

If you are enrolling in the Apple Developer Program anyway, enrol first and
come back. A paid account signs the entitlement without complaint.

---

## Step 2 — Connect the iPhone and trust the Mac

1. Plug the iPhone into the Mac with a cable. Wi-Fi debugging works later, but
   the first pairing needs the cable.
2. On the iPhone, a **Trust This Computer?** prompt appears. Tap **Trust** and
   enter the passcode.
3. On the iPhone: **Settings → Privacy & Security → Developer Mode → on**.
   The phone restarts. This toggle only appears once a development device has
   been connected, so if you cannot find it, plug in and try again.

---

## Step 3 — Sign in to Xcode with your Apple ID

1. Open Xcode.
2. **Xcode → Settings → Accounts** (older versions: Preferences).
3. Click **+**, choose **Apple ID**, and sign in.
4. Your account appears with a team called something like
   **"Your Name (Personal Team)"**. That is the free team.

---

## Step 4 — Point the project at your team

```bash
open ios/Tocky.xcworkspace
```

> Open `Tocky.xcworkspace`, never `Tocky.xcodeproj`. CocoaPods says this every
> time it runs, and the project will not build from the `.xcodeproj`.

In Xcode:

1. Select the **Tocky** project in the left sidebar, then the **Tocky** target.
2. Go to **Signing & Capabilities**.
3. Tick **Automatically manage signing**.
4. Set **Team** to your Personal Team.
5. If it complains the bundle identifier is unavailable, change it to
   something unique to you — `com.yourname.tocky`. A free team cannot claim
   `com.tocky.app` if anyone else already has.

   > If you change it here, remember it. It is **not** the identifier the App
   > Store build uses, and you should not commit the change.

---

## Step 5 — Build and run

With the iPhone selected as the destination in Xcode's toolbar, either press
**⌘R**, or from the terminal:

```bash
npx expo run:ios --device
```

That lists connected devices; pick your iPhone.

The first launch will refuse to open, with **"Untrusted Developer"**. On the
iPhone:

**Settings → General → VPN & Device Management → your Apple ID → Trust**

Then open Tocky from the home screen.

> **A free provisioning profile expires after 7 days.** The app stops opening
> and you rebuild from Xcode. This is normal and is one of the things the paid
> account fixes.

---

## Step 6 — What to actually check

Work through this deliberately. You are looking for things the simulator lied
about.

### Look

- [ ] The tab bar's **Liquid Glass** — does it blur what scrolls under it?
- [ ] **Dark mode** — Settings → Appearance → Dark. Then set the _phone_ to
      dark and set Tocky to System, and confirm it follows.
- [ ] The **owl** at each expression — the timer's owl changes past 8 hours
- [ ] Every screen at the **largest Dynamic Type**: Settings → Accessibility →
      Display & Text Size → Larger Text, dragged to maximum. Nothing should be
      clipped. The Timer and Insights screens are the ones to look hardest at.

### Feel

- [ ] **Haptics** when starting and ending a session — these do nothing on a
      simulator, so this is the first time they have ever run
- [ ] Does the press animation feel right at 60fps on real hardware?

### Hear

- [ ] Turn on **VoiceOver**: Settings → Accessibility → VoiceOver. Or set the
      Accessibility Shortcut to VoiceOver so a triple-click of the side button
      toggles it — you will want that.
- [ ] Swipe through the Timer. The elapsed time should be announced **once a
      minute**, not every second.
- [ ] Swipe through Home, History, Insights, Tasks. Every control should
      announce a name and say what it is.

### Wait

- [ ] Set the **daily reminder** to two minutes from now, lock the phone, and
      wait. It must arrive. This is the one thing that cannot be tested any
      other way, and it is why the entitlement question in Step 1 matters.
- [ ] Start a session, force-quit Tocky (swipe up from the app switcher),
      reopen it. The session must still be running.

### Reduce Motion

- [ ] Settings → Accessibility → Motion → Reduce Motion → on.
- [ ] Press a button: it should **dim without shrinking**.
- [ ] Navigate between screens: transitions should **cross-fade, not slide**.

---

## Step 7 — Write down what you find

Anything that looks wrong on hardware and right on the simulator is worth a
line in `PROGRESS.md` under _Decisions that changed course_, or an issue.
Three separate chunks in this project were fixed because a screenshot showed
something the tests could not.

---

## When you are done

You will know whether Tocky is actually good, which no amount of green CI can
tell you. If everything passes, the next thing that matters is
[02 · Apple Developer Program](02-apple-developer.md).
