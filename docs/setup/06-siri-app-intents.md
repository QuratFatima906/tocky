# 06 · Siri and App Intents — milestone E4

**Cost:** free. **Time:** days, not hours. **Needs:**
[02 · Apple Developer](02-apple-developer.md) and a **physical iPhone** —
Siri cannot be properly tested on a simulator.

This is the largest remaining piece of product, and the only one that needs
real Swift. Read the whole page before starting; the shape of the problem
matters more than any individual step.

---

## What it should do

From `BUILD-PLAN.md`:

> Intents: start · stop · switch · log time · query time · query summary

In practice:

- _"Hey Siri, start a work session in Tocky"_
- _"Hey Siri, stop tracking"_
- _"Hey Siri, how long have I worked today?"_

---

## The hard part, first

Tocky's data lives in **SQLite, inside the app's own container**. An App
Intents extension is a **separate process** and cannot see it.

This is the whole problem. Everything else is mechanics.

### Three ways out

**A. App Group container — recommended.**
Move the database into a shared App Group so both the app and the extension
can open it. Correct, and the standard approach.

Cost: a schema-location migration for anyone who already has data. Existing
users' databases must be _moved_, not recreated, and that migration has to be
right the first time — Tocky's whole promise is that it never loses a session.

**B. Intents that only ever open the app.**
`OpensIntent` / returning `.result(opensIntent:)` hands control to the app,
which does the work with its own database access. Far simpler, and honest:
"Hey Siri, start a work session" opens Tocky with the timer running.

Loses: answering _"how long have I worked today?"_ without unlocking the
phone, which is arguably the best thing about the feature.

**C. Mirror a small summary into the App Group.**
Keep SQLite where it is; whenever the app writes, also write a tiny JSON
snapshot — today's total, the running session — into a shared file. Intents
read that for queries, and use (B) for actions.

Cost: a second source of truth, which this project has explicitly refused
twice already (B3's cancelled `TimerController`, and D1's rule that duration
is always derived and never stored). It would need a very clear boundary.

**Start with B.** It ships, it is honest, and it is a fraction of the work. Do
A only once the feature has proven it earns the migration risk.

---

## Step 1 — App Group, if you take route A

1. <https://developer.apple.com/account/resources/identifiers/list/applicationGroup>
2. **+** → **App Groups** → identifier `group.com.tocky.app`
3. Add it to the `com.tocky.app` App ID's capabilities
4. In `app.config.ts`:

```ts
ios: {
  entitlements: {
    'com.apple.security.application-groups': ['group.com.tocky.app'],
  },
},
```

Then move the database. `expo-sqlite` opens by name in the app's Documents
directory; you need it in the group container instead. **Write the migration
before the move**, and test it against a database with real sessions in it.
Losing someone's history here would be the worst bug this project could ship.

---

## Step 2 — The extension target

App Intents extensions are native, and Expo's config plugins do not generate
them. You need either a custom config plugin or a checked-in `ios/` directory
— and `ios/` is currently gitignored, which is deliberate.

The Expo-idiomatic route:

```bash
npx create-expo-module@latest --local tocky-intents
```

which creates `modules/tocky-intents/` with an iOS Swift target that survives
`expo prebuild`. Add the App Intents code there.

> This is the point where Tocky stops being a pure Expo app. It is a real
> commitment, not a weekend. Be sure the feature is wanted before taking it.

---

## Step 3 — Define the intents

Swift, roughly:

```swift
import AppIntents

struct StartSessionIntent: AppIntent {
  static var title: LocalizedStringResource = "Start tracking"
  static var openAppWhenRun: Bool = true          // route B

  @Parameter(title: "Category")
  var category: CategoryEntity

  func perform() async throws -> some IntentResult {
    // Route B: hand to the app via a deep link the app already understands.
    return .result()
  }
}
```

Tocky already has a URL scheme — `tocky://` — and routes for `timer`,
`tasks`, `session/[id]`, `settings` and `help`. Route B can lean entirely on
that, which is why it is so much cheaper.

> One caution from the E2E work: **deep links behave differently in Release
> builds than in debug.** `.maestro/08-export-data.yaml` had to stop using
> `tocky://settings` for exactly this reason. Test intents against a release
> build, not a dev build.

### `AppEntity` for categories

For _"start a **work** session"_ Siri needs to know what a category is:

```swift
struct CategoryEntity: AppEntity {
  static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Category")
  static var defaultQuery = CategoryQuery()

  let id: String
  let name: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)")
  }
}
```

`CategoryQuery` needs to list the user's categories — which is the data-access
problem from the top of this page. Under route B, ship the six defaults as a
static list first and read real ones only once route A exists.

---

## Step 4 — App Shortcuts

So people discover it without knowing the phrasing:

```swift
struct TockyShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: StartSessionIntent(),
      phrases: [
        "Start tracking in \(.applicationName)",
        "Start a session in \(.applicationName)",
      ],
      shortTitle: "Start tracking",
      systemImageName: "clock"
    )
  }
}
```

Every phrase **must** contain `\(.applicationName)`. Apple requires it, and
shortcuts silently fail to register without it.

---

## Step 5 — Test on hardware

Simulator Siri is unreliable for this. On a real device:

1. Build and install — see [01](01-physical-device.md) or
   [03](03-eas-and-testflight.md)
2. **Settings → Tocky → Siri & Search** — the shortcuts should be listed
3. Try each phrase out loud
4. Try from the **Shortcuts** app, which shows clearer errors than Siri does
5. Try with the **phone locked** — this is where route B's limits show, since
   opening the app requires unlocking

---

## Step 6 — Copy, held to the locked decisions

Spoken responses are copy, and the same rule applies: **observational, never
judgemental.**

| Good                               | Never                               |
| ---------------------------------- | ----------------------------------- |
| "Three hours forty on work today." | "You're behind on work today."      |
| "Tracking work."                   | "Great job! Keep the streak going!" |
| "Nothing tracked yet today."       | "You haven't tracked anything yet!" |

The daily reminder's copy has a test asserting it contains no _goal, streak,
target, score, behind_ or _fail_. Spoken responses deserve the same.

---

## Honest assessment

This is the least certain thing on the list. It needs Swift, an extension
target, a data-sharing decision with migration risk, and hardware to test on.
Route B makes it tractable; route A makes it good.

**It is also the most skippable.** Tocky is complete and useful without Siri.
Everything else on this list either ships the app or protects it. This one
adds a feature.

If you want it, say so and I will build route B — most of it is code I can
write and test, with you doing the device verification at the end.
