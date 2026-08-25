import { DatabaseSync } from 'node:sqlite';

import type { SqlValue, SqliteDatabase } from '@/data';

export function createNodeSqliteDatabase(filename = ':memory:'): SqliteDatabase {
  const database = new DatabaseSync(filename);
  database.exec('pragma foreign_keys = ON');

  return {
    execute: (sql) => database.exec(sql),
    run: (sql, params = []) => {
      database.prepare(sql).run(...params);
    },
    all: <Row>(sql: string, params: readonly SqlValue[] = []) =>
      database.prepare(sql).all(...params) as Row[],
    inTransaction: (work) => {
      database.exec('begin');
      try {
        work();
        database.exec('commit');
      } catch (error) {
        database.exec('rollback');
        throw error;
      }
    },
  };
}
