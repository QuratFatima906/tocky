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
    const versionBeforeSettings = LATEST_SCHEMA_VERSION - 1;

    database.execute(`drop table settings; pragma user_version = ${versionBeforeSettings}`);
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
