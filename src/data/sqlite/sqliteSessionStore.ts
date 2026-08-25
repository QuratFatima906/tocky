import { findActiveSession, isPaused, type Category, type Pause, type Session } from '@/domain';

import { newSession, type SessionStore, type SessionStoreSnapshot } from '../sessionStore';
import type { SqliteDatabase } from './database';
import { migrateToLatestSchema } from './migrations';

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
           values (?, ?, ?, ?, null, null, null)`,
          [session.id, session.categoryId, session.label, session.startedAt],
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

    discardActiveSession() {
      const active = findActiveSession(snapshot.sessions);
      if (active === null) return;

      database.inTransaction(() => {
        database.run('delete from pauses where sessionId = ?', [active.id]);
        database.run('delete from sessions where id = ?', [active.id]);
      });
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

  return { status: 'ready', categories, sessions };
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
