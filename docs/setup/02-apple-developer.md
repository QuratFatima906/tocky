# 02 · Apple Developer Program

**Cost:** $99 USD per year, charged in your local currency. **Time:** 20
minutes to apply. **Waiting:** 24 hours to 2 weeks for approval.

**Start this before anything else on the list.** It is the only task here with
a queue, and TestFlight, the App Store, App Intents and every signed build all
wait behind it.

---

## What it unblocks

| Without it                        | With it                       |
| --------------------------------- | ----------------------------- |
| 7-day builds on your own device   | 1-year provisioning           |
| No TestFlight                     | Up to 10,000 external testers |
| No App Store                      | Public release                |
| Push entitlement cannot be signed | It can                        |
| No App Intents / Siri             | Both                          |

---

## Step 1 — Decide individual or organisation

This is the one decision that is painful to reverse.

### Individual (recommended for now)

- Approved in **24–48 hours**, usually
- Needs only a government photo ID
- The App Store shows **your legal name** as the seller
- Cannot add team members

### Organisation

- Takes **1–2 weeks**, sometimes longer
- Needs a **D-U-N-S number** — free from Dun & Bradstreet, but takes up to 5
  business days on its own, so start it first if you go this route
- Needs a legal entity: registered company, and a website on its domain
- The App Store shows the **company name**
- Can add team members with separate roles

**Choose Individual unless Tocky is being published by a registered company.**
Moving from Individual to Organisation later means transferring the app, which
is possible but tedious.

---

## Step 2 — Prepare the Apple ID

Use an Apple ID you will still control in five years. Do not use a work
address you might lose.

1. Go to <https://appleid.apple.com> and sign in.
2. Turn on **two-factor authentication** if it is not already on. Apple will
   not let you enrol without it, and you cannot turn it off later.
3. Make sure the name on the account matches your ID document exactly.

---

## Step 3 — Enrol

1. Go to <https://developer.apple.com/programs/enroll/>.
2. Sign in with that Apple ID.
3. Choose **Individual** or **Organisation**.
4. Fill in your legal name and address exactly as they appear on your ID.
5. Pay. Apple accepts most international cards; the charge is annual and
   auto-renews unless you cancel.

Apple may ask you to verify identity through the **Apple Developer** app on an
iPhone or iPad. If it does, that path is usually faster than the web.

---

## Step 4 — While you wait

Do [01 · Run Tocky on a real iPhone](01-physical-device.md), which needs
nothing from Apple. Or [05 · Sentry](05-sentry.md), which is independent of all
of this.

---

## Step 5 — Once approved

You get an email. Then collect two things Tocky's config needs.

### Your Team ID

1. Sign in at <https://developer.apple.com/account>.
2. Scroll to **Membership details**.
3. Copy the **Team ID** — 10 characters, letters and digits, like `A1B2C3D4E5`.

Put it in `eas.json`:

```json
"appleTeamId": "A1B2C3D4E5"
```

replacing `REPLACE_WITH_APPLE_TEAM_ID`.

### Register the bundle identifier

Tocky's identifier is **`com.tocky.app`** — set in `app.config.ts`. It has to
be unique across the entire App Store.

1. <https://developer.apple.com/account/resources/identifiers/list>
2. **+** → **App IDs** → **App**.
3. **Description:** `Tocky`
4. **Bundle ID:** Explicit → `com.tocky.app`
5. **Capabilities:** leave everything off.

   > Tocky needs none of them. It only schedules _local_ notifications, which
   > require no capability. Do **not** tick Push Notifications — see
   > [01 · Step 1](01-physical-device.md) for why that entitlement is better
   > removed than enabled.

6. **Continue → Register**.

If `com.tocky.app` is taken, pick something else — `com.qurat.tocky` — and
change `ios.bundleIdentifier` and `android.package` in `app.config.ts` to
match. Commit that change; it is real.

---

## Step 6 — Create the App Store Connect record

This is separate from the developer account, and is where the app itself
lives.

1. <https://appstoreconnect.apple.com> → **My Apps** → **+** → **New App**.
2. **Platforms:** iOS
3. **Name:** `Tocky`

   > This must be unique across the App Store. If it is taken you will need a
   > variant — "Tocky Time", "Tocky — Time Tracker". The name here is what
   > appears under the icon.

4. **Primary language:** English (U.K.) or (U.S.)
5. **Bundle ID:** pick `com.tocky.app` from the list — it appears because you
   registered it in Step 5
6. **SKU:** `tocky-ios-001`. Internal only; nobody sees it. It just has to be
   unique to your account.
7. **User Access:** Full Access
8. **Create**.

### Get the App Store Connect App ID

Once created, open the app → **App Information** → **General Information**.
There is an **Apple ID** field: a 10-digit number like `6478123456`.

> Confusingly, Apple calls this the app's "Apple ID". It is not your account's
> Apple ID. It is the number EAS wants.

Put it in `eas.json`:

```json
"ascAppId": "6478123456"
```

replacing `REPLACE_WITH_APP_STORE_CONNECT_APP_ID`.

---

## Step 7 — Commit the identifiers

```bash
git checkout -b chore/apple-identifiers
git add eas.json app.config.ts
git commit -m "Point EAS at the App Store Connect app and Apple team"
git push -u origin chore/apple-identifiers
gh pr create --fill
```

Neither value is a secret. They identify a public app and a public team, and
both appear in any built binary. They belong in the repository.

`EXPO_TOKEN`, which comes next, is **not** like that — it goes in GitHub
secrets and nowhere else.

---

## Verifying you are done

- [ ] Enrolment says **Active** at <https://developer.apple.com/account>
- [ ] `com.tocky.app` is in your Identifiers list
- [ ] Tocky exists in App Store Connect
- [ ] `eas.json` has no `REPLACE_WITH_` left in it:

```bash
grep REPLACE_WITH eas.json && echo "still placeholders" || echo "both set"
```

---

## Next

[03 · EAS builds and TestFlight](03-eas-and-testflight.md).
