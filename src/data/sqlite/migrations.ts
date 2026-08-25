import { DEFAULT_CATEGORIES } from '../defaultCategories';
import type { SqliteDatabase } from './database';

type Migration = (database: SqliteDatabase) => void;

const createTables: Migration = (database) => {
  database.execute(`
    create table categories (
      id text primary key not null,
      name text not null,
      icon text not null,
      color text not null,
      isArchived integer not null default 0
    );

    create table sessions (
      id text primary key not null,
      categoryId text not null references categories (id),
      label text,
      startedAt integer not null,
      endedAt integer,
      linkedTaskId text,
      note text
    );

    create table pauses (
      sessionId text not null references sessions (id) on delete cascade,
      startedAt integer not null,
      endedAt integer
    );

    create index sessions_startedAt on sessions (startedAt desc);
    create index sessions_categoryId on sessions (categoryId);
    create index pauses_sessionId on pauses (sessionId);
  `);
};

const seedDefaultCategories: Migration = (database) => {
  DEFAULT_CATEGORIES.forEach((category) => {
    database.run('insert into categories (id, name, icon, color) values (?, ?, ?, ?)', [
      category.id,
      category.name,
      category.icon,
      category.color,
    ]);
  });
};

const createTasks: Migration = (database) => {
  database.execute(`
    create table tasks (
      id text primary key not null,
      title text not null,
      categoryId text not null references categories (id),
      estimateSeconds integer,
      createdAt integer not null,
      completedAt integer
    );

    create index tasks_completedAt on tasks (completedAt);
  `);
};

const createSettings: Migration = (database) => {
  database.execute(`
    create table settings (
      key text primary key not null,
      value text not null
    );
  `);
};

const MIGRATIONS: readonly Migration[] = [
  createTables,
  seedDefaultCategories,
  createTasks,
  createSettings,
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS.length;

export function migrateToLatestSchema(database: SqliteDatabase): void {
  const currentVersion = schemaVersionOf(database);
  if (currentVersion >= LATEST_SCHEMA_VERSION) return;

  database.inTransaction(() => {
    MIGRATIONS.slice(currentVersion).forEach((migrate) => migrate(database));
    database.execute(`pragma user_version = ${LATEST_SCHEMA_VERSION}`);
  });
}

export function schemaVersionOf(database: SqliteDatabase): number {
  return database.all<{ user_version: number }>('pragma user_version')[0]?.user_version ?? 0;
}
