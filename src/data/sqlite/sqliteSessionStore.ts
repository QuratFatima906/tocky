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

const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  isArchived: number;
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

export function createSqliteSessionStore(database: SqliteDatabase): SessionStore {
  migrateToLatestSchema(database);

  let snapshot = readSnapshot(database);
  const listeners = new Set<() => void>();

  // ponytail: every write re-reads the whole store. Fine for one person's own
  // history; swap for a targeted snapshot update if a year of sessions drags.
  function reloadAndNotify(): void {
    snapshot = readSnapshot(database);
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
      const session = newSession(input);

      database.inTransaction(() => {
        if (active !== null) {
          database.run('update sessions set endedAt = ? where id = ?', [input.at, active.id]);
          database.run('update pauses set endedAt = ? where sessionId = ? and endedAt is null', [
            input.at,
            active.id,
          ]);
        }

        database.run(
          `insert into sessions (id, categoryId, label, startedAt, endedAt, linkedTaskId, note)
           values (?, ?, ?, ?, null, ?, null)`,
          [session.id, session.categoryId, session.label, session.startedAt, session.linkedTaskId],
        );
      });
      reloadAndNotify();
    },

    endActiveSession(at) {
      const active = findActiveSession(snapshot.sessions);
      if (active === null) return;

      database.inTransaction(() => {
        database.run('update sessions set endedAt = ? where id = ?', [at, active.id]);
        database.run('update pauses set endedAt = ? where sessionId = ? and endedAt is null', [
          at,
          active.id,
        ]);
      });
      reloadAndNotify();
    },

    deleteSession(sessionId) {
      if (!snapshot.sessions.some((session) => session.id === sessionId)) return;

      database.inTransaction(() => {
        database.run('delete from pauses where sessionId = ?', [sessionId]);
        database.run('delete from sessions where id = ?', [sessionId]);
      });
      reloadAndNotify();
    },

    editSession(sessionId, edit) {
      if (!snapshot.sessions.some((session) => session.id === sessionId)) return;

      database.run(
        `update sessions
            set categoryId = ?, label = ?, startedAt = ?, endedAt = ?, note = ?
          where id = ?`,
        [edit.categoryId, edit.label, edit.startedAt, edit.endedAt, edit.note, sessionId],
      );
      reloadAndNotify();
    },

    addTask(input) {
      const task = newTask(input);

      database.run(
        `insert into tasks (id, title, categoryId, estimateSeconds, createdAt, completedAt)
         values (?, ?, ?, ?, ?, null)`,
        [task.id, task.title, task.categoryId, task.estimateSeconds, task.createdAt],
      );
      reloadAndNotify();
    },

    setTaskCompleted(taskId, completedAt) {
      const existing = snapshot.tasks.find((task) => task.id === taskId);
      if (existing === undefined || existing.completedAt === completedAt) return;

      database.run('update tasks set completedAt = ? where id = ?', [completedAt, taskId]);
      reloadAndNotify();
    },

    completeOnboarding() {
      if (snapshot.hasCompletedOnboarding) return;

      writeSetting(database, ONBOARDING_COMPLETED_KEY, 'true');
      reloadAndNotify();
    },

    setProfileName(name) {
      const profileName = trimmedNameOrNull(name);
      if (snapshot.profileName === profileName) return;

      if (profileName === null)
        database.run('delete from settings where key = ?', [PROFILE_NAME_KEY]);
      else writeSetting(database, PROFILE_NAME_KEY, profileName);
      reloadAndNotify();
    },

    setThemePreference(preference) {
      if (snapshot.themePreference === preference) return;

      writeSetting(database, THEME_PREFERENCE_KEY, preference);
      reloadAndNotify();
    },

    noteActiveSession(note) {
      const active = findActiveSession(snapshot.sessions);
      if (active === null || active.note === note) return;

      database.run('update sessions set note = ? where id = ?', [note, active.id]);
      reloadAndNotify();
    },

    pauseActiveSession(at) {
      const active = findActiveSession(snapshot.sessions);
      if (active === null || isPaused(active)) return;

      database.run('insert into pauses (sessionId, startedAt, endedAt) values (?, ?, null)', [
        active.id,
        at,
      ]);
      reloadAndNotify();
    },

    resumeActiveSession(at) {
      const active = findActiveSession(snapshot.sessions);
      if (active === null || !isPaused(active)) return;

      database.run('update pauses set endedAt = ? where sessionId = ? and endedAt is null', [
        at,
        active.id,
      ]);
      reloadAndNotify();
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
    .all<CategoryRow>('select id, name, icon, color, isArchived from categories order by rowid')
    .map<Category>((row) => ({ ...row, isArchived: row.isArchived === 1 }));

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
