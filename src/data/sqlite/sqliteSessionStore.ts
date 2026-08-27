import type { ThemePreference } from '@/design-system';
import {
  findActiveSession,
  isPaused,
  type Category,
  type Pause,
  type Session,
  type Task,
} from '@/domain';

import {
  isAccidentalStart,
  isCategoryInUse,
  newCategory,
  newSession,
  newTask,
  trimmedNameOrNull,
  type SessionStore,
  type SessionStoreSnapshot,
} from '../sessionStore';
import type { SqliteDatabase } from './database';
import { migrateToLatestSchema } from './migrations';

const ONBOARDING_COMPLETED_KEY = 'onboardingCompleted';
const PROFILE_NAME_KEY = 'profileName';
const THEME_PREFERENCE_KEY = 'themePreference';
const ASKED_ABOUT_SESSION_KEY = 'askedAboutSessionId';

const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

/**
 * A write that never reached disk, after being retried. The snapshot is left
 * exactly as it was, so nothing recorded is lost — the change simply did not
 * happen, and `action` names it well enough to tell the user which one.
 */
export type WriteFailure = {
  readonly action: string;
  readonly error: unknown;
};

export type SqliteSessionStore = SessionStore & {
  subscribeToWriteFailures: (listener: (failure: WriteFailure) => void) => () => void;
};

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  isArchived: number;
  sortOrder: number;
};

type SessionRow = {
  id: string;
  categoryId: string;
  label: string | null;
  startedAt: number;
  endedAt: number | null;
  linkedTaskId: string | null;
  note: string | null;
};

type PauseRow = { sessionId: string; startedAt: number; endedAt: number | null };

type TaskRow = {
  id: string;
  title: string;
  categoryId: string;
  estimateSeconds: number | null;
  createdAt: number;
  completedAt: number | null;
};

export function createSqliteSessionStore(database: SqliteDatabase): SqliteSessionStore {
  migrateToLatestSchema(database);

  let snapshot = readSnapshot(database);
  const listeners = new Set<() => void>();
  const failureListeners = new Set<(failure: WriteFailure) => void>();

  // ponytail: every write re-reads the whole store. Fine for one person's own
  // history; swap for a targeted snapshot update if a year of sessions drags.
  function reloadAndNotify(): void {
    snapshot = readSnapshot(database);
    listeners.forEach((listener) => listener());
  }

  /**
   * A full disk or a busy database must not take the app down mid-session.
   * Every write is retried once, and a write that still fails leaves the
   * snapshot untouched: the running session keeps running and its time is
   * still on disk, because the last thing that reached disk is still there.
   */
  function write(action: string, apply: () => void): boolean {
    // ponytail: one immediate retry, which covers a database busy for a moment
    // and nothing else. A backoff queue belongs here only once a real failure
    // turns out to need one.
    try {
      apply();
    } catch {
      try {
        apply();
      } catch (error) {
        // Not every failure is a full disk. A constraint violation or a typo in
        // one of these statements would otherwise be swallowed into "try
        // again" and run twice, with nothing left to debug from.
        console.error(`Tocky could not ${action}.`, error);
        failureListeners.forEach((listener) => listener({ action, error }));
        return false;
      }
    }
    reloadAndNotify();
    return true;
  }

  return {
    subscribe(onStoreChanged) {
      listeners.add(onStoreChanged);
      return () => listeners.delete(onStoreChanged);
    },

    subscribeToWriteFailures(onWriteFailed) {
      failureListeners.add(onWriteFailed);
      return () => failureListeners.delete(onWriteFailed);
    },

    getSnapshot: () => snapshot,

    startSession(input) {
      const active = findActiveSession(snapshot.sessions);
      const session = newSession(input);

      return write('start the session', () => {
        database.inTransaction(() => {
          if (active !== null && isAccidentalStart(active, input.at)) {
            database.run('delete from pauses where sessionId = ?', [active.id]);
            database.run('delete from sessions where id = ?', [active.id]);
          } else if (active !== null) {
            database.run('update sessions set endedAt = ? where id = ?', [input.at, active.id]);
            database.run('update pauses set endedAt = ? where sessionId = ? and endedAt is null', [
              input.at,
              active.id,
            ]);
          }

          database.run(
            `insert into sessions (id, categoryId, label, startedAt, endedAt, linkedTaskId, note)
             values (?, ?, ?, ?, null, ?, null)`,
            [
              session.id,
              session.categoryId,
              session.label,
              session.startedAt,
              session.linkedTaskId,
            ],
          );
        });
      });
    },

    endActiveSession(at) {
      const active = findActiveSession(snapshot.sessions);
      if (active === null) return true;

      return write('end the session', () => {
        database.inTransaction(() => {
          database.run('update sessions set endedAt = ? where id = ?', [at, active.id]);
          database.run('update pauses set endedAt = ? where sessionId = ? and endedAt is null', [
            at,
            active.id,
          ]);
        });
      });
    },

    deleteSession(sessionId) {
      if (!snapshot.sessions.some((session) => session.id === sessionId)) return true;

      return write('delete the session', () => {
        database.inTransaction(() => {
          database.run('delete from pauses where sessionId = ?', [sessionId]);
          database.run('delete from sessions where id = ?', [sessionId]);
        });
      });
    },

    editSession(sessionId, edit) {
      if (!snapshot.sessions.some((session) => session.id === sessionId)) return true;

      return write('save your changes', () => {
        database.run(
          `update sessions
              set categoryId = ?, label = ?, startedAt = ?, endedAt = ?, note = ?
            where id = ?`,
          [edit.categoryId, edit.label, edit.startedAt, edit.endedAt, edit.note, sessionId],
        );
      });
    },

    addTask(input) {
      const task = newTask(input);

      write('add the task', () => {
        database.run(
          `insert into tasks (id, title, categoryId, estimateSeconds, createdAt, completedAt)
           values (?, ?, ?, ?, ?, null)`,
          [task.id, task.title, task.categoryId, task.estimateSeconds, task.createdAt],
        );
      });
    },

    setTaskCompleted(taskId, completedAt) {
      const existing = snapshot.tasks.find((task) => task.id === taskId);
      if (existing === undefined || existing.completedAt === completedAt) return true;

      return write('update the task', () => {
        database.run('update tasks set completedAt = ? where id = ?', [completedAt, taskId]);
      });
    },

    deleteTask(taskId) {
      if (!snapshot.tasks.some((task) => task.id === taskId)) return true;

      return write('delete the task', () => {
        database.inTransaction(() => {
          // Let the sessions go before the task does, so there is no instant
          // where a session points at a row that is not there.
          database.run('update sessions set linkedTaskId = null where linkedTaskId = ?', [taskId]);
          database.run('delete from tasks where id = ?', [taskId]);
        });
      });
    },

    completeOnboarding() {
      if (snapshot.hasCompletedOnboarding) return;

      write('finish setting up', () => {
        writeSetting(database, ONBOARDING_COMPLETED_KEY, 'true');
      });
    },

    setProfileName(name) {
      const profileName = trimmedNameOrNull(name);
      if (snapshot.profileName === profileName) return;

      write('save your name', () => {
        if (profileName === null)
          database.run('delete from settings where key = ?', [PROFILE_NAME_KEY]);
        else writeSetting(database, PROFILE_NAME_KEY, profileName);
      });
    },

    addCategory(draft) {
      const category = newCategory(draft);

      write('add the category', () => {
        const nextOrder =
          database.all<{ nextOrder: number }>(
            'select coalesce(max(sortOrder), 0) + 1 as nextOrder from categories',
          )[0]?.nextOrder ?? 1;

        database.run(
          `insert into categories (id, name, icon, color, isArchived, sortOrder)
           values (?, ?, ?, ?, 0, ?)`,
          [category.id, category.name, category.icon, category.color, nextOrder],
        );
      });
    },

    editCategory(categoryId, draft) {
      if (!snapshot.categories.some((category) => category.id === categoryId)) return;

      write('save the category', () => {
        database.run('update categories set name = ?, icon = ?, color = ? where id = ?', [
          draft.name.trim(),
          draft.icon,
          draft.color,
          categoryId,
        ]);
      });
    },

    setCategoryArchived(categoryId, isArchived) {
      const existing = snapshot.categories.find((category) => category.id === categoryId);
      if (existing === undefined || existing.isArchived === isArchived) return;

      write(isArchived ? 'archive the category' : 'restore the category', () => {
        database.run('update categories set isArchived = ? where id = ?', [
          isArchived ? 1 : 0,
          categoryId,
        ]);
      });
    },

    reorderCategories(orderedCategoryIds) {
      write('reorder your categories', () => {
        database.inTransaction(() => {
          orderedCategoryIds.forEach((categoryId, index) => {
            database.run('update categories set sortOrder = ? where id = ?', [index, categoryId]);
          });
        });
      });
    },

    deleteCategory(categoryId) {
      if (isCategoryInUse(categoryId, snapshot)) return;
      if (!snapshot.categories.some((category) => category.id === categoryId)) return;

      write('delete the category', () => {
        database.run('delete from categories where id = ?', [categoryId]);
      });
    },

    setAskedAboutSession(sessionId) {
      if (snapshot.askedAboutSessionId === sessionId) return;

      write('remember your answer', () => {
        if (sessionId === null)
          database.run('delete from settings where key = ?', [ASKED_ABOUT_SESSION_KEY]);
        else writeSetting(database, ASKED_ABOUT_SESSION_KEY, sessionId);
      });
    },

    setThemePreference(preference) {
      if (snapshot.themePreference === preference) return;

      write('save your appearance choice', () => {
        writeSetting(database, THEME_PREFERENCE_KEY, preference);
      });
    },

    noteActiveSession(note) {
      const active = findActiveSession(snapshot.sessions);
      if (active === null || active.note === note) return;

      write('save your note', () => {
        database.run('update sessions set note = ? where id = ?', [note, active.id]);
      });
    },

    pauseActiveSession(at) {
      const active = findActiveSession(snapshot.sessions);
      if (active === null || isPaused(active)) return;

      write('pause the session', () => {
        database.run('insert into pauses (sessionId, startedAt, endedAt) values (?, ?, null)', [
          active.id,
          at,
        ]);
      });
    },

    resumeActiveSession(at) {
      const active = findActiveSession(snapshot.sessions);
      if (active === null || !isPaused(active)) return;

      write('resume the session', () => {
        database.run('update pauses set endedAt = ? where sessionId = ? and endedAt is null', [
          at,
          active.id,
        ]);
      });
    },
  };
}

function readSnapshot(database: SqliteDatabase): SessionStoreSnapshot {
  const pausesBySessionId = groupPausesBySessionId(
    database.all<PauseRow>('select sessionId, startedAt, endedAt from pauses order by startedAt'),
  );

  const sessions = database
    .all<SessionRow>(
      `select id, categoryId, label, startedAt, endedAt, linkedTaskId, note
         from sessions
        order by startedAt desc`,
    )
    .map<Session>((row) => ({ ...row, pauses: pausesBySessionId.get(row.id) ?? [] }));

  const categories = database
    .all<CategoryRow>(
      `select id, name, icon, color, isArchived, sortOrder
         from categories
        order by sortOrder, rowid`,
    )
    .map<Category>(({ sortOrder: _sortOrder, ...row }) => ({
      ...row,
      isArchived: row.isArchived === 1,
    }));

  const tasks = database
    .all<TaskRow>(
      `select id, title, categoryId, estimateSeconds, createdAt, completedAt
         from tasks
        order by createdAt desc`,
    )
    .map<Task>((row) => ({ ...row }));

  const storedTheme = readSetting(database, THEME_PREFERENCE_KEY);

  return {
    status: 'ready',
    categories,
    sessions,
    tasks,
    hasCompletedOnboarding: readSetting(database, ONBOARDING_COMPLETED_KEY) !== null,
    profileName: readSetting(database, PROFILE_NAME_KEY),
    themePreference: THEME_PREFERENCES.find((known) => known === storedTheme) ?? 'system',
    askedAboutSessionId: readSetting(database, ASKED_ABOUT_SESSION_KEY),
  };
}

function readSetting(database: SqliteDatabase, key: string): string | null {
  return (
    database.all<{ value: string }>('select value from settings where key = ?', [key])[0]?.value ??
    null
  );
}

function writeSetting(database: SqliteDatabase, key: string, value: string): void {
  database.run('insert or replace into settings (key, value) values (?, ?)', [key, value]);
}

function groupPausesBySessionId(rows: readonly PauseRow[]): Map<string, Pause[]> {
  const pausesBySessionId = new Map<string, Pause[]>();

  rows.forEach(({ sessionId, startedAt, endedAt }) => {
    const pauses = pausesBySessionId.get(sessionId) ?? [];
    pauses.push({ startedAt, endedAt });
    pausesBySessionId.set(sessionId, pauses);
  });

  return pausesBySessionId;
}
