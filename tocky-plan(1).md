# Tocky — Product & Build Plan

> **Working tagline:** _Tocky tattles on where your day went._
>
> A playful, mobile-first time tracker for people who want to know what they actually did with their day — without turning productivity into a second job.

---

## 0. Product Name

### **Tocky**

**Why:**

- Feels friendly and lightweight.
- Hints at the ticking of time without sounding like enterprise time-tracking software.
- Easy to say: “Hey Siri, start Tocky.”
- Gives the visual system room to be cute: clocks, little creatures, bubbles, streaks, progress rings, etc.

**Brand personality:**

- Playful, warm, slightly cheeky.
- Never guilt-trippy.
- More “your day has receipts 👀” than “YOU FAILED YOUR PRODUCTIVITY GOALS.”
- Visuals should feel delightful even when the user has had a gloriously unproductive Tuesday.

**Possible tagline variants:**

- “Tocky tattles on your day.”
- “Where did the day go? Tocky knows.”
- “Track time. Notice patterns. Do less guessing.”
- “Your day, with receipts.”

> Name is a working product name, not a trademark/domain availability determination.

---

# 1. Product Definition

## Core problem

People frequently underestimate where their time goes.

Tocky should make it ridiculously easy to:

1. Create a task.
2. Start working on it.
3. Stop when finished or switch tasks.
4. Automatically log the elapsed time.
5. See where their time went.
6. Spot patterns across days, weeks and months.
7. Do most of the above without opening the app — especially through Siri.

The app should answer:

> **“What did I actually spend my time on?”**

within a few seconds.

---

# 2. MVP Feature Set

## P0 — absolutely required

### Tasks

- Create a task.
- Edit a task.
- Delete/archive a task.
- Optional category.
- Optional note.
- Optional emoji/icon.
- Recently used tasks should be easy to select.
- Tasks should be reusable rather than recreated every day.

### Timer

- Start timer from a task.
- Stop timer.
- Pause/resume timer.
- Switch directly from one task to another.
- Show currently active task globally in the app.
- Persist timer state if the app is backgrounded/killed.
- Record exact start/end timestamps.
- Calculate duration from timestamps rather than trusting a UI counter.
- Prevent impossible/duplicate active timers.

### Time log

Every completed session should contain:

- `id`
- `taskId`
- `startedAt`
- `endedAt`
- `durationSeconds`
- `createdAt`
- optional note
- source (`manual`, `siri`, etc.)

### Dashboard

Show:

#### Today

- Total tracked time.
- Current active task.
- Top tasks/categories.
- Timeline of today's sessions.
- “Where did my time go?” summary.

#### Week

- Total tracked time.
- Daily totals.
- Top categories/tasks.
- Comparison with previous week.

#### Month

- Total tracked time.
- Daily/weekly trend.
- Top categories.
- Distribution of time.

### Insights

Examples:

- “You spent 3h 42m on coding this week.”
- “Coding took 46% of your tracked time.”
- “Your most focused day was Tuesday.”
- “You tracked 18% more time this week than last week.”
- “You spent most of your time on Project A.”

Important: insights should describe behavior, not judge it.

Bad:

> “You wasted 2 hours.”

Good:

> “2h 08m went to YouTube this week.”

### Basic settings

- Theme: system / light / dark.
- Week starts on Monday/Sunday.
- Time format: 12h / 24h.
- Data export.
- Delete account/data.
- Notification preferences.

---

# 3. P0 Siri / Hands-Free Experience

Siri is a core differentiator, not a decorative checkbox.

Modern Apple integration should use **App Intents**. Apple's current documentation describes App Intents as the framework for making app actions discoverable to Siri, Apple Intelligence, Spotlight and Shortcuts.

Reference:

- https://developer.apple.com/documentation/appintents/appintent
- https://developer.apple.com/documentation/AppIntents/getting-started-with-the-app-intents-framework

## Initial Siri commands

### Start

> “Hey Siri, start coding in Tocky.”

Expected behavior:

- Resolve/create/select “Coding”.
- Start timer.
- Confirm briefly.

### Stop

> “Hey Siri, stop Tocky.”

Expected behavior:

- Stop active timer.
- Save session.

### Switch

> “Hey Siri, switch to meetings in Tocky.”

Expected behavior:

- Stop current session.
- Start meetings.
- Save both transitions correctly.

### Log manually

> “Hey Siri, log 45 minutes of reading in Tocky.”

Expected behavior:

- Create a completed historical session.

### Query

> “Hey Siri, how much time did I spend coding today?”

Expected behavior:

- Return today's total.

### Query summary

> “Hey Siri, where did I spend most of my time today?”

Expected behavior:

- Return top task/category.

## Siri architecture note

Do **not** design the product around “it is a PWA and Siri will magically control it.”

For proper Siri/App Intents integration, Tocky should be a real iOS app.

The preferred architecture is:

**React Native / Expo app** +
**small native iOS App Intents layer** +
**shared app data/service layer**

The native layer should expose only the small set of system actions needed by Siri.

---

# 4. P1 Features

Build these after the MVP is stable.

### Quick actions

- Start last task.
- Resume previous task.
- One-tap task switching.
- “+” quick-add action.

### Widgets

iOS Home Screen widget:

- Current task.
- Current timer.
- Start/stop.
- Today's tracked time.

### Lock Screen / Live Activity

When a timer is running:

- Task name.
- Elapsed time.
- Stop action.
- Optional switch action.

### Smart suggestions

- Recently used tasks.
- Most-used tasks at this time of day.
- “You usually work on X around now.”
- Suggested category.

These must remain suggestions, not creepy automation.

### Better analytics

- Focus sessions.
- Time by category.
- Time by task.
- Average session length.
- Number of context switches.
- Most productive/most tracked hours.
- Longest uninterrupted session.

---

# 5. Things We Explicitly DO NOT Build in MVP

Because apparently every productivity app eventually decides it needs to become Jira.

Do not build:

- Team accounts.
- Collaboration.
- Shared projects.
- Billing/subscriptions.
- Calendar integration.
- Pomodoro mode.
- Complex goals.
- Social features.
- AI coach.
- AI-generated life advice.
- Gamified leaderboards.
- Chat.
- Desktop app.
- Android-specific functionality.
- Complex recurring tasks.

The MVP should be excellent at one thing:

> **Tracking where your time goes.**

---

# 6. Recommended Tech Stack

## Mobile

### React Native + Expo + TypeScript

Why:

- Matches existing React/TypeScript expertise.
- Excellent mobile development velocity.
- Native iOS capabilities without abandoning the JS ecosystem.
- Expo provides a strong development/build ecosystem.
- Can later support Android.
- Easier to share domain/business logic than maintaining separate native apps.

Use Expo development builds rather than restricting the product to Expo Go once native Siri functionality begins.

---

## Navigation

### Expo Router

Use file-based routing.

Suggested structure:

```text
app/
  _layout.tsx
  index.tsx
  timer.tsx
  tasks/
    index.tsx
    [id].tsx
  history.tsx
  insights.tsx
  settings.tsx
```

Keep navigation thin. Screens should compose feature components rather than contain business logic.

---

## State

### Zustand

Use it for transient/client application state:

- active timer
- selected task
- UI state
- filters
- dashboard range

Do not turn Zustand into a database.

---

## Local database

### SQLite

Use local-first storage.

Recommended direction:

- SQLite for durable local app data.
- Repository/service layer between UI and database.
- Sync to backend asynchronously.

Reason:

A timer must continue to work when:

- Wi-Fi disappears.
- The user is underground.
- The app wakes from background.
- The backend is temporarily unavailable.

The stopwatch does not care about your cloud server's feelings.

---

## Backend

### Supabase

Use:

- PostgreSQL
- Auth
- Row Level Security
- optional Edge Functions
- telemetry/event storage where appropriate

Supabase officially documents React Native + Expo integration and recommends RLS for protecting database access.

Reference:
https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native

---

## Sync model

### Local-first

Source of truth for immediate interaction:

**Device SQLite**

Cloud:

**Supabase PostgreSQL**

Basic flow:

```text
User action
    ↓
Local DB transaction
    ↓
UI updates immediately
    ↓
Sync queue
    ↓
Supabase
```

If sync fails:

```text
Local record
    ↓
pending_sync = true
    ↓
retry later
```

Do not make timer operations depend on network connectivity.

---

## Authentication

MVP options:

### Preferred

- Sign in with Apple.
- Google sign-in.
- Optional email/password.

For an iOS-first product, Sign in with Apple should be treated as a first-class path.

Allow a guest/local mode if feasible, then offer account creation for backup/sync.

---

## Charts

Use a lightweight React Native charting solution.

Requirements:

- Smooth animation.
- Accessible labels.
- Touch interaction.
- Minimal bundle impact.

Avoid huge charting libraries for three bar charts and a donut.

---

## Animations

### Reanimated

Use for:

- timer transitions
- card expansion
- chart entrance
- task switching
- micro-interactions

Use animation to communicate state, not to make every button do Cirque du Soleil.

---

## Icons

### Lucide React Native

Simple, consistent and lightweight.

---

## Native iOS

### Swift / App Intents

Expose:

- Start timer.
- Stop timer.
- Switch task.
- Log time.
- Query time.
- Query summary.

Apple's current App Intents documentation explicitly positions this framework for Siri, Apple Intelligence, Spotlight and Shortcuts.

---

# 7. Data Model

## users

Managed primarily through Supabase Auth.

---

## tasks

```text
tasks
-----
id
user_id
name
emoji
category_id
color
archived
created_at
updated_at
last_used_at
```

---

## categories

```text
categories
----------
id
user_id
name
emoji
color
created_at
updated_at
```

Examples:

```text
💻 Work
📚 Learning
🏃 Health
🏠 Personal
🎨 Creative
🧑‍🤝‍🧑 Social
```

---

## time_sessions

```text
time_sessions
-------------
id
user_id
task_id
started_at
ended_at
duration_seconds
source
note
created_at
updated_at
```

`duration_seconds` is useful for querying/reporting, but the canonical timing truth should be `started_at` + `ended_at`.

---

## active_timer

This can be represented locally rather than as a permanent server row.

```text
active_timer
------------
task_id
started_at
paused_at
accumulated_seconds
```

Do not continuously write timer ticks to the database.

A timer should not generate:

```text
UPDATE timer SET seconds = seconds + 1
```

every second.

That would be spectacularly unnecessary.

Store timestamps and derive elapsed time.

---

## sync_queue

```text
sync_queue
----------
id
entity_type
entity_id
operation
payload
attempt_count
last_attempt_at
created_at
```

This can later be replaced with a more sophisticated sync implementation if scale demands it.

---

# 8. Timer Engineering Rules

This deserves its own engineering discipline.

## Never rely on a JS interval for truth

Bad:

```text
seconds++
```

Good:

```text
elapsed = now - startedAt
```

The UI can tick every second while the stored state remains timestamp-based.

## Background behavior

When app resumes:

```text
elapsed = currentTime - startedAt
```

Recalculate.

## App crash

If an active timer exists locally:

- restore it.
- calculate elapsed duration from timestamps.
- allow the user to finish or discard it.

## Device clock changes

Define a policy.

MVP:

- use wall-clock timestamps.
- detect suspicious backwards jumps.
- flag/repair sessions rather than silently creating negative durations.

---

# 9. UI / UX Direction

## Overall feel

Think:

**Calm productivity + cute data visualization + tiny bit of mischief.**

Not:

**Corporate timesheet software wearing pastel clothes.**

---

## Navigation

Recommended bottom tabs:

```text
Home      History      Insights      Tasks
  🏠         🕘           ✨           ✓
```

Settings accessible from profile/gear.

---

# 10. Home Screen

The home screen is the product.

Top:

```text
Good morning, Qurat 👋

You've tracked
4h 32m today
```

Then the active timer:

```text
┌──────────────────────────┐
│ 💻 Building Tocky        │
│                          │
│       01:42:18           │
│                          │
│       [ Stop ]           │
└──────────────────────────┘
```

If nothing is running:

```text
What are you doing?

[ + Start a task ]

Recently used:
💻 Coding   📚 Reading   🧠 Learning
```

Then:

### Today's tiny story

Visual summary:

```text
💻 Coding       2h 40m   ███████████
🧑‍🤝‍🧑 Meetings  1h 10m   █████
📚 Reading      42m      ███
🏠 Personal     20m      ██
```

And one playful insight:

> “Coding ate 59% of your tracked day. Hungry little beast.”

---

# 11. Dashboard Visuals

## Day

A timeline.

```text
08:00 ───────
09:00  💻💻💻
10:00  💻💻
11:00  🧑‍🤝‍🧑
12:00  🍜
13:00  💻💻💻
```

Use blocks rather than a conventional business dashboard.

---

## Week

Seven rounded bars.

Each bar:

- total tracked time
- subtle task/category composition

Tap a day → detailed breakdown.

---

## Month

Use:

- calendar heatmap
- weekly totals
- category distribution
- trend line

Avoid overwhelming users with twelve graphs.

---

# 12. Cute Visualization System

Create a reusable visual language.

Possible components:

### Time bubbles

Larger bubble = more time.

### Tiny creatures

Each category can have an optional mascot/emoji.

### Focus flower

A flower grows petals based on tracked time.

Do not make this a mandatory gamification system.

### Day ring

Circular ring showing tracked time versus a configurable target.

Target should be optional.

### Time garden

Month view where each day grows a little “plant” based on tracked time.

This can become a signature visual.

---

# 13. UX Principles

### 1. Starting a timer must take < 3 seconds.

### 2. Stopping a timer must take one obvious action.

### 3. Never force the user to categorize everything.

### 4. Empty states should be useful.

Instead of:

> No data.

Say:

> Your day hasn't left any receipts yet.
> Start a timer and we'll keep score. 👀

### 5. Never shame the user.

### 6. Always show what is currently running.

### 7. Make historical editing easy.

### 8. Do not make charts decorative.

Every visualization should answer a question.

---

# 14. Accessibility

Required:

- Dynamic Type.
- VoiceOver labels.
- Minimum touch target ~44x44pt.
- Sufficient contrast.
- Do not communicate meaning through color alone.
- Reduce Motion support.
- Semantic labels for charts.
- Accessible timer state.
- Siri actions should have readable spoken responses.

---

# 15. Performance Requirements

## App startup

Target:

- cold start < 2 seconds on a modern device.

## Interaction

Target:

- timer start feels instantaneous.
- no network request in the critical path of starting/stopping a timer.

## Rendering

Avoid:

- unnecessary global state subscriptions.
- rerendering entire dashboard every timer tick.
- recalculating all analytics every second.

Only the active timer display should update frequently.

---

# 16. Analytics

Use product analytics carefully.

Track behavioral events, not unnecessary personal content.

## Core events

```text
app_opened
task_created
task_edited
task_archived
timer_started
timer_paused
timer_resumed
timer_stopped
timer_switched
session_edited
session_deleted
dashboard_viewed
insights_viewed
date_range_changed
siri_timer_started
siri_timer_stopped
siri_task_switched
siri_query_used
```

## Useful properties

```text
source
task_id
category_id
duration_seconds
date_range
```

Avoid logging:

- task notes
- sensitive free-text
- unnecessary personal content

---

# 17. Analytics Questions

Instrumentation should let us answer:

### Activation

- Did the user create a task?
- Did they start their first timer?
- Did they complete their first session?

### Retention

- Are they tracking again tomorrow?
- Are they tracking weekly?

### Engagement

- Average sessions/day.
- Average tracked minutes/day.
- Number of active days/week.
- Siri usage rate.

### UX friction

- Timer started → immediately stopped.
- Timer abandoned.
- Task creation abandoned.
- Sync failures.
- Crash-free sessions.

---

# 18. Observability

## Crash reporting

Use Sentry.

Capture:

- crashes
- JS exceptions
- native exceptions
- failed sync operations
- unexpected timer states

Never attach raw user notes to crash reports.

---

## Logging

Structured logs only.

Example:

```ts
logger.info('timer.started', {
  taskId,
  source,
});
```

Not:

```ts
console.log('OMG TIMER BROKE');
```

Though spiritually, that log message is excellent.

---

# 19. Error Handling

Every layer should have predictable failures.

### UI

Friendly recovery.

### Database

Transaction + rollback.

### Sync

Retry with backoff.

### Auth

Session recovery.

### Siri

Resolve ambiguity.

Example:

> “Start design.”

If there are:

- Design
- Product Design
- Design Review

Siri should ask for clarification rather than randomly launching “Design Review” because Siri woke up chaotic.

---

# 20. Security

## Supabase

Use Row Level Security.

Every user-owned table must enforce:

```text
user_id = authenticated user
```

Never trust client-side user IDs.

## Local storage

Sensitive authentication tokens should use secure storage.

## Privacy

The product should collect the minimum required information.

---

# 21. Offline Strategy

The app should be fully usable offline for core functionality.

Offline:

- create task
- edit task
- start timer
- stop timer
- view recent history
- view cached insights

Online:

- sync changes
- backup data
- authenticate
- refresh analytics

---

# 22. Sync Conflict Policy

MVP:

- Each record has `updated_at`.
- Mutations use idempotent IDs.
- Last-write-wins for editable metadata.
- Completed time sessions should be immutable wherever possible.
- Deletions should use tombstones if needed for synchronization.

Timer sessions should never be duplicated because a retry happened.

Use deterministic client-generated UUIDs.

---

# 23. Architecture

```text
┌─────────────────────────────┐
│        React Native UI      │
├─────────────────────────────┤
│       Feature Services      │
│ timer / tasks / analytics   │
├─────────────────────────────┤
│        Domain Layer         │
│ pure business logic         │
├─────────────────────────────┤
│       Repository Layer      │
├──────────────┬──────────────┤
│ SQLite       │ Supabase     │
│ local truth  │ cloud sync   │
└──────────────┴──────────────┘
             ▲
             │
       Sync Engine
             ▲
             │
      Native iOS Layer
       App Intents
             ▲
             │
       Siri / Shortcuts
```

---

# 24. Suggested Repository Structure

```text
src/
  app/
  components/
  features/
    timer/
      components/
      hooks/
      services/
      types/
    tasks/
      components/
      services/
      types/
    dashboard/
    insights/
    history/
    settings/
  db/
  sync/
  analytics/
  observability/
  lib/
  theme/
  utils/

ios/
  TockyIntents/
```

Keep domain logic independent from React.

---

# 25. Domain Services

Important services:

```text
TimerService
TaskService
SessionService
AnalyticsService
SyncService
SiriService
```

Example:

```ts
TimerService.start(taskId);
TimerService.pause();
TimerService.resume();
TimerService.stop();
TimerService.switch(taskId);
```

The UI should call these services rather than manually mutating database records.

---

# 26. Analytics Computation

Do not store every possible dashboard metric.

Store raw sessions.

Derive:

```text
daily total
weekly total
monthly total
task distribution
category distribution
average session
longest session
context switches
```

Use indexed database queries.

Cache expensive aggregate queries.

---

# 27. Testing Strategy

## Unit tests

Test:

- duration calculation
- pause/resume
- switching
- date boundaries
- daily aggregation
- weekly aggregation
- monthly aggregation
- category aggregation
- conflict resolution
- malformed timer states

Timer math should have extremely strong coverage.

---

## Integration tests

Test:

- task creation → local DB
- timer start → local DB
- timer stop → session
- sync → Supabase
- offline → reconnect → sync
- auth lifecycle

---

## E2E

Critical flows:

1. Create task.
2. Start timer.
3. Background app.
4. Return.
5. Stop timer.
6. Verify history.
7. Verify dashboard.
8. Kill/reopen app.
9. Verify active timer recovery.
10. Offline flow.
11. Siri flow on physical iPhone.

---

# 28. QA Matrix

Test:

- fresh install
- existing user
- logged-out state
- offline mode
- weak network
- app killed while timer running
- phone locked while timer running
- timezone change
- daylight saving transitions
- midnight rollover
- long-running timer
- rapid start/stop
- rapid task switching
- duplicate taps
- accessibility
- dark mode
- reduced motion
- large text

---

# 29. Design Deliverables for Claude Design

Claude Design should produce:

## Brand

- logo direction
- icon
- color system
- typography
- spacing system
- radius system
- shadows/elevation
- illustration/mascot direction

## Screens

### Onboarding

- welcome
- value proposition
- optional account creation
- permissions

### Main app

- Home
- active timer
- task picker
- task creation
- task detail
- history
- session detail/edit
- insights
- settings

### States

For every important screen:

- loading
- empty
- error
- offline
- active
- disabled
- success

### System surfaces

Design concepts for:

- iOS widget
- Live Activity
- Siri response
- Shortcuts action

---

# 30. Design System Requirements

Create reusable components:

```text
Button
IconButton
TaskChip
CategoryChip
TaskRow
TimerCard
TimerDisplay
StatCard
InsightCard
ChartCard
DayBar
CalendarCell
BottomSheet
SegmentedControl
EmptyState
ErrorState
OfflineBanner
Toast
```

Each should have:

- default
- pressed
- disabled
- loading
- accessibility states

---

# 31. Claude Design Prompt

Use this section as the design handoff.

> Design a mobile-first time-tracking app called **Tocky**.
>
> Tocky helps users track where their time actually goes. The primary interaction is extremely simple: select a task, start a timer, stop it when finished, and see the resulting time represented beautifully across day/week/month views.
>
> The visual personality should be playful, warm, modern and slightly cheeky. Avoid corporate productivity software aesthetics. Avoid excessive gamification. The app should feel calming rather than demanding.
>
> The home screen is the most important screen. Starting/stopping a timer must be obvious and nearly instant.
>
> Design the complete mobile experience including onboarding, task creation, timer states, history, dashboard, insights, settings, empty states, loading states, offline states, errors, dark mode, accessibility states, iOS widget concepts, Live Activity and Siri/Shortcuts surfaces.
>
> The analytics should make time understandable at a glance. Prefer playful but meaningful visualizations over generic dashboard charts.
>
> Create a coherent design system with typography, spacing, colors, components, states, icons and motion guidance.
>
> Every screen must have a clear hierarchy and a realistic interaction model.
>
> Do not design features outside the MVP unless explicitly marked as future work.

---

# 32. Claude Code Prompt

Use this section as the implementation handoff.

> Implement **Tocky**, a mobile-first time tracking application using React Native, Expo, TypeScript, Expo Router, Zustand, SQLite and Supabase.
>
> Follow the architecture defined in this plan.
>
> Core requirements:
>
> - local-first timer
> - timestamp-based timer calculations
> - offline support
> - task management
> - time sessions
> - day/week/month analytics
> - Supabase authentication
> - Supabase PostgreSQL + RLS
> - sync queue
> - Sentry observability
> - product analytics
> - accessibility
> - dark mode
> - App Intents/Siri integration
>
> Do not put business logic directly into screen components.
>
> Implement repository interfaces so the domain layer is independent of the storage implementation.
>
> Timer operations must be idempotent.
>
> Do not write timer ticks to the database.
>
> Store timestamps and derive elapsed time.
>
> Generate client-side UUIDs for records.
>
> Add comprehensive unit tests for timer mathematics and aggregation.
>
> Add integration tests for local persistence and sync.
>
> Add E2E tests for critical user flows.
>
> Optimize for perceived performance: starting/stopping a timer must never wait for a network request.
>
> Treat Siri/App Intents as a first-class integration. Expose start, stop, switch, log-time and query-summary capabilities.
>
> Build incrementally in vertical slices. Do not implement the entire app in one giant commit.
>
> After each milestone, ensure the project builds and tests pass.

---

# 33. Implementation Roadmap

## Phase 0 — Foundation

- [ ] Create Expo TypeScript project.
- [ ] Configure Expo Router.
- [ ] Configure linting.
- [ ] Configure formatting.
- [ ] Configure strict TypeScript.
- [ ] Configure testing.
- [ ] Configure environment variables.
- [ ] Configure Sentry.
- [ ] Configure analytics abstraction.
- [ ] Establish project architecture.
- [ ] Establish theme/design tokens.

**Definition of done:** app boots, navigation works, tests run, lint/typecheck pass.

---

## Phase 1 — Local Task System

- [ ] SQLite setup.
- [ ] Task schema.
- [ ] Category schema.
- [ ] Repository interfaces.
- [ ] Task repository.
- [ ] Create task.
- [ ] Edit task.
- [ ] Archive task.
- [ ] Recent tasks.
- [ ] Task picker.
- [ ] Unit tests.

**Definition of done:** task management works entirely offline.

---

## Phase 2 — Timer Engine

- [ ] Active timer model.
- [ ] TimerService.
- [ ] Start.
- [ ] Pause.
- [ ] Resume.
- [ ] Stop.
- [ ] Switch.
- [ ] Timestamp-based duration.
- [ ] App background recovery.
- [ ] App restart recovery.
- [ ] Crash recovery.
- [ ] Midnight handling.
- [ ] Duplicate action protection.
- [ ] Timer unit tests.

**Definition of done:** timer remains correct across backgrounding, restarting and connectivity loss.

---

## Phase 3 — Sessions + History

- [ ] Session schema.
- [ ] Save completed session.
- [ ] History screen.
- [ ] Day grouping.
- [ ] Session detail.
- [ ] Edit session.
- [ ] Delete session.
- [ ] Manual time entry.
- [ ] History tests.

---

## Phase 4 — Dashboard

- [ ] Today's summary.
- [ ] Daily timeline.
- [ ] Weekly summary.
- [ ] Monthly summary.
- [ ] Task distribution.
- [ ] Category distribution.
- [ ] Trend calculations.
- [ ] Previous-period comparison.
- [ ] Cached aggregation.
- [ ] Chart accessibility.

---

## Phase 5 — Insights

- [ ] Most-used task.
- [ ] Most-used category.
- [ ] Longest session.
- [ ] Average session.
- [ ] Context switches.
- [ ] Best tracked day.
- [ ] Period comparison.
- [ ] Insight generation service.
- [ ] Friendly insight copy.

---

## Phase 6 — Backend + Auth

- [ ] Supabase project.
- [ ] Database migrations.
- [ ] RLS policies.
- [ ] Auth.
- [ ] Sign in with Apple.
- [ ] Google sign-in.
- [ ] Session persistence.
- [ ] Account deletion.
- [ ] Data export.

---

## Phase 7 — Sync

- [ ] Sync queue.
- [ ] Mutation IDs.
- [ ] Retry strategy.
- [ ] Backoff.
- [ ] Conflict handling.
- [ ] Tombstones.
- [ ] Connectivity detection.
- [ ] Background sync.
- [ ] Sync observability.
- [ ] Sync integration tests.

---

## Phase 8 — Siri / App Intents

- [ ] Native iOS App Intents target.
- [ ] Start timer intent.
- [ ] Stop timer intent.
- [ ] Switch task intent.
- [ ] Log time intent.
- [ ] Query time intent.
- [ ] Query summary intent.
- [ ] Task entity.
- [ ] App shortcuts.
- [ ] Parameter resolution.
- [ ] Ambiguity handling.
- [ ] Siri spoken responses.
- [ ] Test on physical iPhone.

---

## Phase 9 — Widgets / Live Activity

- [ ] Current timer widget.
- [ ] Today's total widget.
- [ ] Start/stop actions.
- [ ] Live Activity.
- [ ] Lock Screen presentation.
- [ ] Deep links into app.

---

## Phase 10 — Polish

- [ ] Animations.
- [ ] Haptics.
- [ ] Empty states.
- [ ] Error states.
- [ ] Offline states.
- [ ] Dark mode.
- [ ] Accessibility.
- [ ] Reduced motion.
- [ ] Dynamic type.
- [ ] Microcopy.
- [ ] Performance pass.

---

## Phase 11 — Release Readiness

- [ ] Production environment.
- [ ] Production Supabase.
- [ ] RLS audit.
- [ ] Analytics audit.
- [ ] Privacy review.
- [ ] Crash monitoring.
- [ ] Performance testing.
- [ ] E2E regression suite.
- [ ] App Store metadata.
- [ ] App icon.
- [ ] Screenshots.
- [ ] TestFlight.
- [ ] Release checklist.

---

# 34. Product Metrics

The first version should optimize for:

### Activation

Percentage of new users who:

```text
open app
→ create/select task
→ start timer
→ complete first session
```

### Retention

- Day 1
- Day 7
- Day 30

### Core engagement

- tracked days/week
- sessions/week
- minutes tracked/week
- task switching
- dashboard views
- Siri usage

The north-star-ish metric:

> **Tracked active days per user per week**

Because opening a productivity app is not productivity.

Tracking actual behavior is.

---

# 35. Release Strategy

## V0 — Personal prototype

Only:

- tasks
- timer
- history
- today's dashboard

No auth required.

Goal:

> Is this actually pleasant to use every day?

---

## V1 — Private beta

Add:

- week/month insights
- auth
- cloud backup
- sync
- analytics
- crash reporting
- Siri

---

## V2 — Public release

Add:

- widgets
- Live Activity
- polished onboarding
- advanced insights
- export
- strong accessibility

---

# 36. Open Product Decisions

These need user decisions before implementation becomes too opinionated.

## A. iOS only or iOS + Android?

Recommendation:

**iOS first.**

Reason:
Siri is a core requirement, and iOS gives us a much cleaner first-class system integration path through App Intents.

---

## B. Should tasks be free-form or categorized?

Recommendation:

**Both, but categories optional.**

Task:

```text
Build Tocky
```

Category:

```text
💻 Work
```

The user should never be forced through a taxonomy exam before starting a timer.

---

## C. Should a task have projects?

Recommendation:

Not MVP.

A task can optionally have a category.

Projects can come later.

---

## D. Should timers be allowed to run indefinitely?

Recommendation:

Yes.

But show a gentle warning after something like 8–12 hours.

Never silently stop a user's timer.

---

## E. What happens when a user forgets to stop?

Recommendation:

Don't automatically guess.

Instead:

> “This session ran for 11h 43m. Keep it?”

Allow editing.

---

## F. Should there be a daily time goal?

Recommendation:

Optional.

Don't make Tocky another app yelling:

> “YOU HAVE ONLY TRACKED 72% OF YOUR PRODUCTIVITY TARGET.”

---

# 37. Final Product Philosophy

Tocky is not supposed to make people work more.

It should make their existing day visible.

The product loop is:

```text
Do
 ↓
Track
 ↓
See
 ↓
Notice
 ↓
Adjust
 ↓
Do
```

The magic is in the **See → Notice** step.

If the dashboard looks gorgeous but the user cannot answer:

> “Where did my time go this week?”

then we've built a pretty screensaver.

Don't build a pretty screensaver.

Build the tiny app people actually remember to use.

---

# 38. Locked Product Decisions — Interview Round 1

These decisions supersede any earlier recommendation in this document.

## Platform

**Decision: iOS first.**

Android is explicitly out of scope for the first release.

Reason:

- Siri is a core product interaction.
- iOS App Intents provide first-class system integration.
- Faster product validation.
- Smaller initial QA matrix.
- React Native/Expo keeps Android viable later.

---

## Account model

**Decision: Local/anonymous first → optional account.**

The user should be able to install Tocky and start tracking immediately.

No mandatory account wall.

Recommended progression:

```text
Install
  ↓
Use locally
  ↓
Build some history
  ↓
Offer optional cloud backup/sync
  ↓
Sign in with Apple / Google
```

The product should explain the benefit of creating an account rather than interrupting the first-use experience.

Example:

> “Want your Tocky history safe if you lose your phone?”

---

## Task model

**Decision: Tasks + categories.**

No project hierarchy in MVP.

Example:

```text
💻 Work
   ├── Coding
   ├── Meetings
   └── Code Review

📚 Learning
   ├── TypeScript
   └── Reading

🏠 Personal
   ├── Gym
   └── Cooking
```

The user interacts primarily with tasks.

Tocky aggregates time by category automatically.

Categories should be optional when creating a task, but the product should encourage useful categorization.

---

## Forgotten timer behavior

**Decision: Ask before accepting suspiciously long sessions.**

Example:

```text
You started Coding at 9:04 AM.

It's now 7:02 PM.

That's 9h 58m.

Did you really spend that long coding?

[ Keep 9h 58m ]  [ Edit time ]
```

Do not silently cap sessions.

Do not silently discard sessions.

Do not silently modify user data.

Potential future enhancement:

Tocky can detect interruptions or background periods and make smarter suggestions, but this is not MVP behavior.

---

## Goals and targets

**Decision: No targets.**

Tocky does not have:

- daily productivity goals
- weekly hour goals
- “complete your target” notifications
- productivity scores
- streak pressure

The product is observational rather than judgmental.

Core philosophy:

> **Measure first. Optimize only if the user chooses to.**

---

## Visual personality

**Decision: Cute + sophisticated, with occasional properly adorable moments.**

Baseline:

- polished
- calm
- modern
- elegant
- spacious
- tactile
- premium

Occasional personality:

- playful microcopy
- tiny animations
- expressive empty states
- delightful chart transitions
- occasional mascot/character behavior
- playful insights

Avoid making the entire UI childish.

The visual system should feel credible enough that someone can use it every day.

---

# 39. Locked Core Product Insight

The primary dashboard question is:

> **“Where did my time go?”**

The most important summary is **time allocation by category**.

Example:

```text
TODAY

💻 Work             5h 20m    59%
📚 Learning         1h 40m    18%
🏠 Personal         2h 00m    23%

Total tracked       9h 00m
```

The dashboard should make this understandable within seconds.

---

## Primary insight hierarchy

### Level 1 — Category allocation

```text
Work       5h 20m
Learning   1h 40m
Personal   2h 00m
```

### Level 2 — Tasks inside categories

```text
Work
  Coding          3h 10m
  Meetings        1h 30m
  Code Review       40m
```

### Level 3 — Individual sessions

```text
09:04–10:22   Coding
10:35–11:14   Meeting
11:20–12:05   Coding
```

This hierarchy should be consistent across:

- Today
- Week
- Month

---

# 40. Tocky's Dashboard North Star

The dashboard should not primarily answer:

> “How productive were you?”

It should answer:

> **“How did you spend your time?”**

Example:

> **Today you tracked 9h 00m.**

> 💻 Work — 5h 20m  
> 📚 Learning — 1h 40m  
> 🏠 Personal — 2h 00m

Then:

> **Your biggest time eater was Work.**

> Most of that was Building Tocky and meetings.

This should be the central product experience.

---

# 41. “Today in One Sentence”

Add a lightweight insight card to the dashboard.

Examples:

> **Today, you spent most of your tracked time working.**

> **Work took 59% of your tracked day, followed by Personal at 23%.**

Occasionally, when appropriate:

> **Work absolutely demolished your day today. 💀**

The playful copy must remain grounded in the underlying data.

Never invent interpretations.

Never imply that one category is morally or objectively better than another.

---

# 42. Product Philosophy — Locked

Tocky does **not** equate productivity with working more.

A day like:

```text
4h Work
2h Learning
3h Personal
```

is not inherently better or worse than:

```text
9h Work
```

Tocky reports what happened.

The user decides what it means.

The core product loop is:

```text
DO
 ↓
TRACK
 ↓
SEE
 ↓
NOTICE
 ↓
ADJUST (optional)
 ↓
DO
```

The most important transition is:

```text
SEE → NOTICE
```

If a chart looks beautiful but doesn't help the user understand their time, it is decoration.

---

# 43. Updated MVP Priority

## P0

- [ ] iOS-first Expo React Native app.
- [ ] Local/anonymous usage.
- [ ] Optional account later.
- [ ] Tasks.
- [ ] Categories.
- [ ] Start timer.
- [ ] Pause timer.
- [ ] Resume timer.
- [ ] Stop timer.
- [ ] Switch task.
- [ ] Timestamp-based duration.
- [ ] Session history.
- [ ] Manual session editing.
- [ ] Suspicious-duration confirmation.
- [ ] Today category allocation.
- [ ] Week category allocation.
- [ ] Month category allocation.
- [ ] “Where did my time go?” summary.
- [ ] “Today in one sentence” insight.
- [ ] Offline support.
- [ ] Local persistence.
- [ ] Siri start/stop/switch.
- [ ] Siri time-summary query.
- [ ] Dark mode.
- [ ] Accessibility.
- [ ] Analytics.
- [ ] Crash reporting.

## P1

- [ ] Optional cloud account.
- [ ] Supabase sync.
- [ ] Sign in with Apple.
- [ ] Google sign-in.
- [ ] Widgets.
- [ ] Live Activity.
- [ ] Advanced insights.
- [ ] Time allocation trends.
- [ ] Context-switch analytics.
- [ ] Data export.

---

# 44. Updated User Journeys

## Journey A — First use

```text
Install
 ↓
Welcome
 ↓
“Let's see where your time goes.”
 ↓
Create/select first task
 ↓
Start timer
 ↓
Do work
 ↓
Stop
 ↓
“Nice. You tracked 47 minutes.”
 ↓
Home dashboard
```

Do not require:

- account
- category setup
- lengthy onboarding
- productivity goals
- notification permission immediately

---

## Journey B — Returning user

```text
Open Tocky
 ↓
Current day summary
 ↓
Recent tasks
 ↓
One-tap start
```

Target:

**<3 seconds from opening app to running timer.**

---

## Journey C — Siri

```text
“Hey Siri, start coding in Tocky.”
 ↓
Resolve task
 ↓
Start local timer
 ↓
Siri confirmation
```

---

## Journey D — End of day

```text
Open Tocky
 ↓
Today
 ↓
9h tracked
 ↓
Work 5h20
Learning 1h40
Personal 2h
 ↓
“Work took 59% of your tracked day.”
```

This is the moment that should make the app worth returning to.

---

# 45. Updated Information Architecture

```text
Tocky
│
├── Home
│   ├── Current timer
│   ├── Quick start
│   ├── Recent tasks
│   ├── Today's allocation
│   └── Today in one sentence
│
├── History
│   ├── Day
│   ├── Week
│   ├── Month
│   └── Session detail
│
├── Insights
│   ├── Category allocation
│   ├── Task breakdown
│   ├── Trends
│   ├── Longest sessions
│   └── Context switching
│
├── Tasks
│   ├── All tasks
│   ├── Categories
│   ├── Create task
│   └── Edit task
│
└── Settings
    ├── Account
    ├── Appearance
    ├── Notifications
    ├── Data
    └── About
```

---

# 46. Updated Dashboard Design Direction

The dashboard should prioritize:

```text
1. Total tracked time
2. Category allocation
3. Primary insight
4. Task breakdown
5. Detailed timeline
```

Not:

```text
1. 7 different charts
2. Productivity score
3. Streak
4. Goal percentage
5. Confetti
```

We are making a time-awareness tool, not Duolingo for adults who have deadlines.

---

# 47. Updated Claude Design Handoff

> Design an iOS-first mobile time-tracking app called **Tocky**.
>
> Tocky's purpose is to help users understand where their time actually goes.
>
> The primary interaction is:
>
> **Select task → Start → Work → Stop → See time allocation.**
>
> Users can create tasks and optionally assign them to categories such as Work, Learning or Personal.
>
> The most important dashboard output is category-level time allocation.
>
> Example:
>
> **Today — 9h tracked**
>
> 💻 Work — 5h 20m  
> 📚 Learning — 1h 40m  
> 🏠 Personal — 2h
>
> The dashboard should make this understandable in seconds.
>
> Tocky does not have productivity targets, streaks or productivity scores.
>
> It should never imply that working more is inherently better.
>
> The visual style should be cute but sophisticated. The foundation should feel premium, calm and modern, with occasional playful/adorable moments.
>
> Use playful microcopy and expressive visualizations without making the app childish.
>
> The primary screen is Home. Starting a timer should require essentially one interaction.
>
> Design:
>
> - onboarding
> - Home
> - active timer
> - task picker
> - create/edit task
> - category management
> - history
> - day/week/month analytics
> - insights
> - session editing
> - suspicious long-session confirmation
> - settings
> - offline state
> - empty states
> - error states
> - dark mode
> - accessibility states
> - Siri/App Intents interaction
> - iOS widget
> - Live Activity
>
> Create a reusable design system and ensure all states are represented.
>
> The product should feel like a delightful personal instrument for observing time, not a corporate productivity dashboard.

---

# 48. Updated Claude Code Handoff

> Implement **Tocky**, an iOS-first mobile time tracking application using React Native, Expo and TypeScript.
>
> Core product principle:
>
> **Tocky observes time; it does not judge productivity.**
>
> The core user journey is:
>
> **Task → Start → Stop → Category aggregation → Insight.**
>
> Requirements:
>
> - Expo
> - React Native
> - TypeScript
> - Expo Router
> - Zustand
> - SQLite
> - Supabase
> - Sentry
> - App Intents / Swift
> - Reanimated
>
> Account behavior:
>
> - App must work locally without an account.
> - Account creation is optional.
> - Cloud backup/sync is enabled after authentication.
>
> Data model:
>
> - categories
> - tasks
> - time sessions
> - local active timer
> - sync queue
>
> Categories are first-class entities.
>
> A task can optionally belong to a category.
>
> Dashboard aggregation must prioritize categories:
>
> ```text
> Work
> Learning
> Personal
> ```
>
> The system must derive category totals from raw time sessions.
>
> Do not store a ticking counter as the source of truth.
>
> Store:
>
> ```text
> startedAt
> endedAt
> ```
>
> and derive duration.
>
> Starting/stopping a timer must not require network connectivity.
>
> Implement suspicious-duration detection and allow the user to confirm or edit an unusually long session.
>
> Do not silently cap or delete sessions.
>
> Implement:
>
> - Today dashboard
> - Week dashboard
> - Month dashboard
> - category allocation
> - task breakdown
> - “Today in one sentence”
> - history
> - session editing
> - offline behavior
> - Siri start/stop/switch/query
>
> The primary product metric is time allocation by category, not productivity score.
>
> Do not implement goals, streaks or productivity scoring in MVP.
>
> Keep business logic outside screen components.
>
> Use repositories/services between UI and persistence.
>
> Timer operations must be idempotent.
>
> Use deterministic client-generated UUIDs.
>
> Add comprehensive tests around timer calculations, date boundaries, aggregation and suspicious-session handling.
>
> Build the app incrementally in vertical slices.
>
> Do not create unnecessary abstractions before the domain requires them.
>
> Do not turn this into a giant enterprise architecture project. It is a tiny time tracker. The codebase should be appropriately boring.

---

# 49. Updated Acceptance Criteria — Core Experience

Tocky MVP is not considered successful until these are true:

### Start timer

- User can start a task in one obvious interaction.
- Works offline.
- UI immediately shows active timer.
- Session has a persistent start timestamp.

### Stop timer

- User can stop in one obvious interaction.
- Completed session is persisted locally.
- Duration is calculated from timestamps.
- Dashboard updates immediately.

### App restart

- Active timer survives app restart.
- Elapsed time is reconstructed correctly.

### Offline

- User can create tasks.
- User can start/stop timers.
- User can see history.
- User can see cached analytics.

### Category insight

Given:

```text
Coding        3h
Meeting       2h
Reading       1h
Gym           1h
Cooking       1h
```

with categories:

```text
Coding        → Work
Meeting       → Work
Reading       → Learning
Gym           → Personal
Cooking       → Personal
```

Tocky must display:

```text
Work        5h
Learning    1h
Personal    2h
```

without requiring manual calculation.

### Dashboard

Within a few seconds, the user should understand:

1. How much time they tracked.
2. What categories consumed it.
3. What category consumed the most.
4. Which tasks contributed to that category.

### Philosophy

The UI must never imply:

```text
more tracked work = better user
```

---

# 50. Definition of Done for MVP

The MVP is ready when a real user can:

```text
Install Tocky
    ↓
Open without creating an account
    ↓
Create “Coding”
    ↓
Assign it to Work
    ↓
Start timer
    ↓
Lock phone
    ↓
Continue working
    ↓
Unlock phone
    ↓
Stop timer
    ↓
Create “Read TypeScript”
    ↓
Assign it to Learning
    ↓
Track another session
    ↓
Open dashboard
    ↓
Immediately see:

Work       Xh Xm
Learning   Xh Xm
Personal   Xh Xm

    ↓
Ask Siri:
“How did I spend my day?”
    ↓
Receive the same summary
```

If that loop is delightful, **Tocky has a product.**

Everything else is seasoning.
