import { randomUUID } from 'expo-crypto';

import type { ThemePreference } from '@/design-system';
import {
  DAILY_REMINDER_OFF,
  findActiveSession,
  isPaused,
  type Category,
  type DailyReminder,
  type Session,
  type Task,
} from '@/domain';

export type SessionStoreSnapshot = {
  readonly status: 'loading' | 'ready';
  readonly categories: readonly Category[];
  readonly sessions: readonly Session[];
  readonly tasks: readonly Task[];
  readonly hasCompletedOnboarding: boolean;
  readonly profileName: string | null;
  readonly themePreference: ThemePreference;
  /** A nudge to record, kept whether or not it is on, so the time survives. */
  readonly dailyReminder: DailyReminder;
  /**
   * The running session Tocky has already asked about. Persisted rather than
   * held in memory because the question is asked when the app opens, and
   * force-quitting is ordinary on iOS — a ref would ask again every launch.
   */
  readonly askedAboutSessionId: string | null;
};

/** Everything the `settings` table holds, rather than a table of its own. */
type StoredSetting =
  | 'hasCompletedOnboarding'
  | 'profileName'
  | 'themePreference'
  | 'dailyReminder'
  | 'askedAboutSessionId';

/**
 * Mirrors SQLite's "no row recorded yet": a snapshot that says nothing about a
 * setting has never had one written.
 */
export type SessionStoreSeed = Omit<SessionStoreSnapshot, StoredSetting> &
  Partial<Pick<SessionStoreSnapshot, StoredSetting>>;

export type CategoryDraft = {
  readonly name: string;
  readonly icon: string;
  readonly color: string;
};

export type AddTaskInput = {
  readonly title: string;
  readonly categoryId: string;
  readonly estimateSeconds: number | null;
  readonly at: number;
};

export type StartSessionInput = {
  readonly categoryId: string;
  readonly label: string | null;
  readonly at: number;
  readonly linkedTaskId?: string | null;
};

/**
 * `false` means the write never reached disk and the store did not move, so a
 * screen must not say it did — no success toast, no navigating away, no
 * closing a form over the user's typing. Only the writes a screen acts on the
 * outcome of report it; the rest cannot mislead anyone, because their whole
 * effect is a snapshot that simply stays where it was. A write refused for a
 * reason of its own — a session that is not there, a state already reached —
 * still counts as landed: nothing failed, so nothing needs saying.
 */
export type WriteLanded = boolean;

export type SessionStore = {
  subscribe: (onStoreChanged: () => void) => () => void;
  getSnapshot: () => SessionStoreSnapshot;
  /**
   * Ends whatever is running at the same instant the new session starts, so
   * switching category leaves no untracked gap and no overlap.
   */
  startSession: (input: StartSessionInput) => WriteLanded;
  pauseActiveSession: (at: number) => void;
  resumeActiveSession: (at: number) => void;
  endActiveSession: (at: number) => WriteLanded;
  /** Removes a session outright. Only ever from an explicit choice. */
  deleteSession: (sessionId: string) => WriteLanded;
  editSession: (sessionId: string, edit: SessionEdit) => WriteLanded;
  noteActiveSession: (note: string | null) => void;
  addTask: (input: AddTaskInput) => void;
  setTaskCompleted: (taskId: string, completedAt: number | null) => WriteLanded;
  /**
   * Removes the task and lets go of every session tracked against it, rather
   * than removing those too. The time was really spent; only the thing it was
   * spent on is gone. Each session keeps whatever label it holds — the task's
   * title, since that is what starting from a task writes there, unless the
   * user has since cleared it, which is theirs to have done.
   */
  deleteTask: (taskId: string) => WriteLanded;
  /** Retires the intro panes for good. Onboarding is shown once per install. */
  completeOnboarding: () => void;
  /** An empty name clears it, rather than greeting the user with blank space. */
  setProfileName: (name: string) => void;
  setThemePreference: (preference: ThemePreference) => void;
  /** Off keeps the time that was chosen, so turning it back on does not lose it. */
  setDailyReminder: (reminder: DailyReminder) => void;
  /** Remembers that the user has answered for this session, so it is asked once. */
  setAskedAboutSession: (sessionId: string | null) => void;
  addCategory: (draft: CategoryDraft) => void;
  editCategory: (categoryId: string, draft: CategoryDraft) => void;
  /** Archiving keeps a category's history readable; only the picker loses it. */
  setCategoryArchived: (categoryId: string, isArchived: boolean) => void;
  reorderCategories: (orderedCategoryIds: readonly string[]) => void;
  /** Refused outright while anything still points at it. Archive instead. */
  deleteCategory: (categoryId: string) => void;
};

export type SessionEdit = {
  readonly categoryId: string;
  readonly label: string | null;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly note: string | null;
};

export function newSession({ categoryId, label, at, linkedTaskId }: StartSessionInput): Session {
  return {
    id: randomUUID(),
    categoryId,
    label,
    startedAt: at,
    endedAt: null,
    pauses: [],
    linkedTaskId: linkedTaskId ?? null,
    note: null,
  };
}

export function newCategory({ name, icon, color }: CategoryDraft): Category {
  return { id: randomUUID(), name: name.trim(), icon, color, isArchived: false };
}

export function isCategoryInUse(
  categoryId: string,
  snapshot: Pick<SessionStoreSnapshot, 'sessions' | 'tasks'>,
): boolean {
  return (
    snapshot.sessions.some((session) => session.categoryId === categoryId) ||
    snapshot.tasks.some((task) => task.categoryId === categoryId)
  );
}

export function newTask({ title, categoryId, estimateSeconds, at }: AddTaskInput): Task {
  return {
    id: randomUUID(),
    title,
    categoryId,
    estimateSeconds,
    createdAt: at,
    completedAt: null,
  };
}

export function trimmedNameOrNull(name: string): string | null {
  const trimmed = name.trim();
  return trimmed === '' ? null : trimmed;
}

/** Ids not named keep their relative order, after the ones that were. */
export function reordered(
  categories: readonly Category[],
  orderedCategoryIds: readonly string[],
): readonly Category[] {
  const named = orderedCategoryIds
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is Category => category !== undefined);

  return [...named, ...categories.filter((category) => !named.includes(category))];
}

/**
 * Two taps on Start land milliseconds apart, and the first opens a session the
 * second immediately ends — a zero-length ghost in History that no one meant to
 * record. Discarding it is not losing data, because there is none: measured on
 * the wall clock, not on tracked seconds, so a session someone deliberately
 * paused and switched away from is still real however little it counted.
 */
const ACCIDENTAL_START_WINDOW_MS = 1000;

export function isAccidentalStart(active: Session, at: number): boolean {
  const elapsed = at - active.startedAt;

  // A clock moved backwards makes any session look shorter than it was, and a
  // negative elapsed is not evidence of anything. Keep it and let D1b ask.
  return elapsed >= 0 && elapsed < ACCIDENTAL_START_WINDOW_MS;
}

function endedAtInstant(session: Session, at: number): Session {
  return {
    ...session,
    endedAt: at,
    pauses: session.pauses.map((pause) =>
      pause.endedAt === null ? { ...pause, endedAt: at } : pause,
    ),
  };
}

export const LOADING_SNAPSHOT: SessionStoreSnapshot = {
  status: 'loading',
  categories: [],
  sessions: [],
  tasks: [],
  hasCompletedOnboarding: false,
  profileName: null,
  themePreference: 'system',
  dailyReminder: DAILY_REMINDER_OFF,
  askedAboutSessionId: null,
};

export function createInMemorySessionStore(seed: SessionStoreSeed): SessionStore {
  let snapshot: SessionStoreSnapshot = {
    hasCompletedOnboarding: false,
    profileName: null,
    themePreference: 'system',
    dailyReminder: DAILY_REMINDER_OFF,
    askedAboutSessionId: null,
    ...seed,
  };
  const listeners = new Set<() => void>();

  function replaceActiveSession(update: (active: Session) => Session): void {
    const active = findActiveSession(snapshot.sessions);
    if (active === null) return;

    const updated = update(active);
    if (updated === active) return;

    snapshot = {
      ...snapshot,
      sessions: snapshot.sessions.map((session) => (session.id === active.id ? updated : session)),
    };
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(onStoreChanged) {
      listeners.add(onStoreChanged);
      return () => listeners.delete(onStoreChanged);
    },

    getSnapshot: () => snapshot,

    startSession(input) {
      const active = findActiveSession(snapshot.sessions);
      const discardsActive = active !== null && isAccidentalStart(active, input.at);

      snapshot = {
        ...snapshot,
        sessions: [
          newSession(input),
          ...snapshot.sessions.flatMap((session) => {
            if (session.id !== active?.id) return [session];
            return discardsActive ? [] : [endedAtInstant(session, input.at)];
          }),
        ],
      };
      listeners.forEach((listener) => listener());
      return true;
    },

    endActiveSession(at) {
      replaceActiveSession((active) => endedAtInstant(active, at));
      return true;
    },

    deleteSession(sessionId) {
      if (!snapshot.sessions.some((session) => session.id === sessionId)) return true;

      snapshot = {
        ...snapshot,
        sessions: snapshot.sessions.filter((session) => session.id !== sessionId),
      };
      listeners.forEach((listener) => listener());
      return true;
    },

    editSession(sessionId, edit) {
      const existing = snapshot.sessions.find((session) => session.id === sessionId);
      if (existing === undefined) return true;

      snapshot = {
        ...snapshot,
        sessions: snapshot.sessions.map((session) =>
          session.id === sessionId ? { ...session, ...edit } : session,
        ),
      };
      listeners.forEach((listener) => listener());
      return true;
    },

    addTask(input) {
      snapshot = { ...snapshot, tasks: [newTask(input), ...snapshot.tasks] };
      listeners.forEach((listener) => listener());
    },

    setTaskCompleted(taskId, completedAt) {
      const existing = snapshot.tasks.find((task) => task.id === taskId);
      if (existing === undefined || existing.completedAt === completedAt) return true;

      snapshot = {
        ...snapshot,
        tasks: snapshot.tasks.map((task) => (task.id === taskId ? { ...task, completedAt } : task)),
      };
      listeners.forEach((listener) => listener());
      return true;
    },

    noteActiveSession(note) {
      replaceActiveSession((active) => (active.note === note ? active : { ...active, note }));
    },

    deleteTask(taskId) {
      if (!snapshot.tasks.some((task) => task.id === taskId)) return true;

      snapshot = {
        ...snapshot,
        tasks: snapshot.tasks.filter((task) => task.id !== taskId),
        sessions: snapshot.sessions.map((session) =>
          session.linkedTaskId === taskId ? { ...session, linkedTaskId: null } : session,
        ),
      };
      listeners.forEach((listener) => listener());
      return true;
    },

    completeOnboarding() {
      if (snapshot.hasCompletedOnboarding) return;

      snapshot = { ...snapshot, hasCompletedOnboarding: true };
      listeners.forEach((listener) => listener());
    },

    setProfileName(name) {
      const profileName = trimmedNameOrNull(name);
      if (snapshot.profileName === profileName) return;

      snapshot = { ...snapshot, profileName };
      listeners.forEach((listener) => listener());
    },

    setThemePreference(themePreference) {
      if (snapshot.themePreference === themePreference) return;

      snapshot = { ...snapshot, themePreference };
      listeners.forEach((listener) => listener());
    },

    setDailyReminder(dailyReminder) {
      const { isOn, hour, minute } = snapshot.dailyReminder;
      if (
        dailyReminder.isOn === isOn &&
        dailyReminder.hour === hour &&
        dailyReminder.minute === minute
      ) {
        return;
      }

      snapshot = { ...snapshot, dailyReminder };
      listeners.forEach((listener) => listener());
    },

    setAskedAboutSession(askedAboutSessionId) {
      if (snapshot.askedAboutSessionId === askedAboutSessionId) return;

      snapshot = { ...snapshot, askedAboutSessionId };
      listeners.forEach((listener) => listener());
    },

    addCategory(draft) {
      snapshot = { ...snapshot, categories: [...snapshot.categories, newCategory(draft)] };
      listeners.forEach((listener) => listener());
    },

    editCategory(categoryId, draft) {
      if (!snapshot.categories.some((category) => category.id === categoryId)) return;

      snapshot = {
        ...snapshot,
        categories: snapshot.categories.map((category) =>
          category.id === categoryId
            ? { ...category, ...draft, name: draft.name.trim() }
            : category,
        ),
      };
      listeners.forEach((listener) => listener());
    },

    setCategoryArchived(categoryId, isArchived) {
      const existing = snapshot.categories.find((category) => category.id === categoryId);
      if (existing === undefined || existing.isArchived === isArchived) return;

      snapshot = {
        ...snapshot,
        categories: snapshot.categories.map((category) =>
          category.id === categoryId ? { ...category, isArchived } : category,
        ),
      };
      listeners.forEach((listener) => listener());
    },

    reorderCategories(orderedCategoryIds) {
      snapshot = { ...snapshot, categories: reordered(snapshot.categories, orderedCategoryIds) };
      listeners.forEach((listener) => listener());
    },

    deleteCategory(categoryId) {
      if (isCategoryInUse(categoryId, snapshot)) return;
      if (!snapshot.categories.some((category) => category.id === categoryId)) return;

      snapshot = {
        ...snapshot,
        categories: snapshot.categories.filter((category) => category.id !== categoryId),
      };
      listeners.forEach((listener) => listener());
    },

    pauseActiveSession(at) {
      replaceActiveSession((active) =>
        isPaused(active)
          ? active
          : { ...active, pauses: [...active.pauses, { startedAt: at, endedAt: null }] },
      );
    },

    resumeActiveSession(at) {
      replaceActiveSession((active) =>
        isPaused(active)
          ? {
              ...active,
              pauses: active.pauses.map((pause) =>
                pause.endedAt === null ? { ...pause, endedAt: at } : pause,
              ),
            }
          : active,
      );
    },
  };
}
