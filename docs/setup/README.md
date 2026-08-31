# Setup guides — the things Tocky needs a human for

Everything buildable is built and merged. These are the tasks that need an
account, a payment, a device or a decision that only you can make.

Each guide is self-contained and assumes nothing. Follow one start to finish.

## Order

Some of these unblock others. This is the order that wastes the least time:

| #                              | Task                             | Unblocks                                   | Cost                | Waiting?                      |
| ------------------------------ | -------------------------------- | ------------------------------------------ | ------------------- | ----------------------------- |
| [01](01-physical-device.md)    | Run Tocky on a real iPhone       | Everything you cannot trust a simulator on | Free                | No                            |
| [02](02-apple-developer.md)    | Apple Developer Program          | 03, 04, 06                                 | $99/yr (regional)   | **24h–2 weeks for approval**  |
| [03](03-eas-and-testflight.md) | EAS builds and TestFlight        | Real installs, cold-start measurement      | Free tier available | Build queue, minutes to hours |
| [04](04-app-store-listing.md)  | App Store listing and submission | Being on the App Store                     | Free                | **1–3 days review**           |
| [05](05-sentry.md)             | Sentry — milestone E1            | Knowing when it breaks for someone else    | Free tier           | No                            |
| [06](06-siri-app-intents.md)   | Siri / App Intents — E4          | "Hey Siri, start a work session"           | Free                | No                            |
| [07](07-supabase.md)           | Supabase — milestone F           | Accounts, sync, multi-device               | Free tier           | No                            |

**Start 02 today even if you do nothing else.** Apple's approval is the only
thing here with a queue measured in days, and everything about shipping waits
behind it.

**Do 01 first if you only do one thing.** Tocky has never run on real
hardware — only a simulator — and it is free to change that this afternoon.

## What is already done

You do not need to do any of this:

- The app itself, through Milestone C — every screen, built and verified
- Milestone D — edge cases, accessibility, performance
- E2 — 10 end-to-end flows, running in CI on every pull request
- E3's configuration — `eas.json`, the release workflow, the privacy manifest
- `docs/RELEASING.md` — the checklist for an actual release

## A note on cost

Only one of these costs money: the Apple Developer Program, and only if you
want Tocky on other people's phones. Everything else has a free tier that
comfortably covers a project this size.
