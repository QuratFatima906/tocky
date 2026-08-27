import type { Session } from '@/domain';
import { createNodeSqliteDatabase } from '@/test/nodeSqliteDatabase';
import {
  ACTIVE_SESSION,
  CONTRACT_NOW,
  describeSessionStoreContract,
  FINISHED_SESSION,
} from '@/test/sessionStoreContract';

import { DEFAULT_CATEGORIES } from '../defaultCategories';
import type { SqliteDatabase } from '../sqlite/database';
import {
  LATEST_SCHEMA_VERSION,
  migrateToLatestSchema,
  schemaVersionOf,
} from '../sqlite/migrations';
import { createSqliteSessionStore } from '../sqlite/sqliteSessionStore';

function insertSessions(database: SqliteDatabase, sessions: readonly Session[]): void {
  sessions.forEach((session) => {
    database.run(
      `insert into sessions (id, categoryId, label, startedAt, endedAt, linkedTaskId, note)
       values (?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.categoryId,
        session.label,
        session.startedAt,
        session.endedAt,
        session.linkedTaskId,
        session.note,
      ],
    );
    session.pauses.forEach((pause) => {
      database.run('insert into pauses (sessionId, startedAt, endedAt) values (?, ?, ?)', [
        session.id,
        pause.startedAt,
        pause.endedAt,
      ]);
    });
  });
}

function categoryCount(database: SqliteDatabase): number {
  return database.all<{ total: number }>('select count(*) as total from categories')[0]!.total;
}

function databaseHolding(sessions: readonly Session[]): SqliteDatabase {
  const database = createNodeSqliteDatabase();
  migrateToLatestSchema(database);
  insertSessions(database, sessions);
  return database;
}

describeSessionStoreContract('createSqliteSessionStore', (sessions) =>
  createSqliteSessionStore(databaseHolding(sessions)),
);

/** The last schema that shipped before settings and category ordering. */
const TASKS_ONLY_SCHEMA_VERSION = 3;

function rewindToTasksOnlySchema(database: SqliteDatabase): void {
  database.execute(`
    drop table settings;
    alter table categories drop column sortOrder;
    pragma user_version = ${TASKS_ONLY_SCHEMA_VERSION}
  `);
}

describe('the Tocky schema', () => {
  it('migrates an empty database to the current version', () => {
    const database = createNodeSqliteDatabase();

    expect(schemaVersionOf(database)).toBe(0);
    createSqliteSessionStore(database);

    expect(schemaVersionOf(database)).toBe(LATEST_SCHEMA_VERSION);
  });

  it('seeds the six default categories on first run', () => {
    const store = createSqliteSessionStore(createNodeSqliteDatabase());

    expect(store.getSnapshot().categories).toEqual(DEFAULT_CATEGORIES);
  });

  it('seeds nothing on later runs, however often it is opened', () => {
    const database = createNodeSqliteDatabase();

    createSqliteSessionStore(database);
    createSqliteSessionStore(database);
    createSqliteSessionStore(database);

    expect(categoryCount(database)).toBe(DEFAULT_CATEGORIES.length);
  });

  it('indexes the columns history and breakdowns are read by', () => {
    const database = createNodeSqliteDatabase();
    createSqliteSessionStore(database);

    const indexes = database
      .all<{ name: string }>("select name from sqlite_master where type = 'index'")
      .map((row) => row.name);

    expect(indexes).toEqual(
      expect.arrayContaining(['sessions_startedAt', 'sessions_categoryId', 'pauses_sessionId']),
    );
  });

  it('upgrades an install that already holds data, without disturbing it', () => {
    const database = databaseHolding([FINISHED_SESSION]);

    rewindToTasksOnlySchema(database);
    const upgraded = createSqliteSessionStore(database);

    expect(schemaVersionOf(database)).toBe(LATEST_SCHEMA_VERSION);
    expect(upgraded.getSnapshot().sessions).toHaveLength(1);
    expect(upgraded.getSnapshot().categories).toEqual(DEFAULT_CATEGORIES);
    expect(upgraded.getSnapshot().hasCompletedOnboarding).toBe(false);
  });

  it('refuses a session that belongs to no category', () => {
    const database = databaseHolding([]);

    expect(() =>
      insertSessions(database, [{ ...ACTIVE_SESSION, categoryId: 'not-a-category' }]),
    ).toThrow();
  });
});

describe('createSqliteSessionStore', () => {
  it('reads back everything a previous run wrote', () => {
    const database = databaseHolding([ACTIVE_SESSION]);

    createSqliteSessionStore(database).pauseActiveSession(CONTRACT_NOW);
    const reopened = createSqliteSessionStore(database);

    expect(reopened.getSnapshot().sessions[0]!.pauses).toEqual([
      { startedAt: CONTRACT_NOW, endedAt: null },
    ]);
  });

  it('still knows onboarding is done after the app is relaunched', () => {
    const database = databaseHolding([]);

    createSqliteSessionStore(database).completeOnboarding();

    expect(createSqliteSessionStore(database).getSnapshot().hasCompletedOnboarding).toBe(true);
  });

  it('hands back the newest session first', () => {
    const store = createSqliteSessionStore(databaseHolding([FINISHED_SESSION, ACTIVE_SESSION]));

    expect(store.getSnapshot().sessions.map((session) => session.id)).toEqual([
      'active',
      'finished',
    ]);
  });

  it('reads a session with no label, note or task as empty rather than missing', () => {
    const bare: Session = { ...FINISHED_SESSION, label: null, note: null, linkedTaskId: null };
    const store = createSqliteSessionStore(databaseHolding([bare]));

    expect(store.getSnapshot().sessions[0]).toEqual(bare);
  });

  it('is ready as soon as it is opened', () => {
    expect(createSqliteSessionStore(createNodeSqliteDatabase()).getSnapshot().status).toBe('ready');
  });
});

/**
 * A database that refuses writes the way a full disk would.
 * `failOnlyTheNextWrite` is the transient case a retry survives.
 * `failEveryWriteFrom` lets the first n - 1 statements through and refuses
 * from the nth on, which is the only way to get a transaction partway in and
 * prove it rolls back.
 */
function databaseFailingWrites(database: SqliteDatabase): SqliteDatabase & {
  failOnlyTheNextWrite: () => void;
  failEveryWriteFrom: (nth: number) => void;
} {
  let writesUntilFailure = Number.POSITIVE_INFINITY;
  let recoversAfterFailing = false;

  return {
    ...database,
    failOnlyTheNextWrite: () => {
      writesUntilFailure = 0;
      recoversAfterFailing = true;
    },
    failEveryWriteFrom: (nth) => {
      writesUntilFailure = nth - 1;
      recoversAfterFailing = false;
    },
    run: (sql, params) => {
      if (writesUntilFailure <= 0) {
        if (recoversAfterFailing) writesUntilFailure = Number.POSITIVE_INFINITY;
        throw new Error('database or disk is full');
      }
      writesUntilFailure -= 1;
      database.run(sql, params);
    },
  };
}

describe('a write that cannot reach disk', () => {
  let logged: jest.SpyInstance;

  beforeEach(() => {
    logged = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => logged.mockRestore());

  it('logs what actually went wrong, so a real bug is not read as a full disk', () => {
    const database = databaseFailingWrites(databaseHolding([ACTIVE_SESSION]));
    const store = createSqliteSessionStore(database);

    database.failEveryWriteFrom(1);
    store.endActiveSession(CONTRACT_NOW);

    expect(logged).toHaveBeenCalledWith('Tocky could not end the session.', expect.any(Error));
  });

  it('retries once, so a momentarily busy database costs nothing', () => {
    const database = databaseFailingWrites(databaseHolding([ACTIVE_SESSION]));
    const store = createSqliteSessionStore(database);
    const onWriteFailed = jest.fn();
    store.subscribeToWriteFailures(onWriteFailed);

    database.failOnlyTheNextWrite();
    store.endActiveSession(CONTRACT_NOW);

    expect(store.getSnapshot().sessions[0]!.endedAt).toBe(CONTRACT_NOW);
    expect(onWriteFailed).not.toHaveBeenCalled();
  });

  it('leaves the running session running rather than losing its time', () => {
    const database = databaseFailingWrites(databaseHolding([ACTIVE_SESSION]));
    const store = createSqliteSessionStore(database);
    const before = store.getSnapshot();

    database.failEveryWriteFrom(1);
    store.endActiveSession(CONTRACT_NOW);

    expect(store.getSnapshot()).toBe(before);
    expect(store.getSnapshot().sessions[0]!.endedAt).toBeNull();
  });

  it('names the action it could not carry out', () => {
    const database = databaseFailingWrites(databaseHolding([ACTIVE_SESSION]));
    const store = createSqliteSessionStore(database);
    const onWriteFailed = jest.fn();
    store.subscribeToWriteFailures(onWriteFailed);

    database.failEveryWriteFrom(1);
    store.pauseActiveSession(CONTRACT_NOW);

    expect(onWriteFailed).toHaveBeenCalledTimes(1);
    expect(onWriteFailed.mock.calls[0]![0]).toMatchObject({ action: 'pause the session' });
  });

  it('does not tell subscribers a thing changed when nothing did', () => {
    const database = databaseFailingWrites(databaseHolding([ACTIVE_SESSION]));
    const store = createSqliteSessionStore(database);
    const onStoreChanged = jest.fn();
    store.subscribe(onStoreChanged);

    database.failEveryWriteFrom(1);
    store.endActiveSession(CONTRACT_NOW);

    expect(onStoreChanged).not.toHaveBeenCalled();
  });

  it('stops reporting failures once unsubscribed', () => {
    const database = databaseFailingWrites(databaseHolding([ACTIVE_SESSION]));
    const store = createSqliteSessionStore(database);
    const onWriteFailed = jest.fn();
    store.subscribeToWriteFailures(onWriteFailed)();

    database.failEveryWriteFrom(1);
    store.endActiveSession(CONTRACT_NOW);

    expect(onWriteFailed).not.toHaveBeenCalled();
  });

  it('rolls a failed multi-statement write all the way back', () => {
    const database = databaseFailingWrites(databaseHolding([ACTIVE_SESSION]));
    const store = createSqliteSessionStore(database);
    const onWriteFailed = jest.fn();
    store.subscribeToWriteFailures(onWriteFailed);

    store.pauseActiveSession(CONTRACT_NOW - 60_000);

    // Starting a session ends the old one, closes its pause, then inserts the
    // new one. Refusing from the third leaves the first two to be undone.
    database.failEveryWriteFrom(3);
    store.startSession({ categoryId: 'health', label: null, at: CONTRACT_NOW });

    // Read the disk, not the snapshot: the snapshot is deliberately frozen on
    // a failed write, so it would look right however much half-work survived.
    const rows = database.all<{ id: string; endedAt: number | null }>(
      'select id, endedAt from sessions',
    );
    const openPauses = database.all<{ total: number }>(
      'select count(*) as total from pauses where endedAt is null',
    )[0]!.total;

    expect(onWriteFailed).toHaveBeenCalledTimes(1);
    expect(rows).toEqual([{ id: ACTIVE_SESSION.id, endedAt: null }]);
    expect(openPauses).toBe(1);
  });
});
