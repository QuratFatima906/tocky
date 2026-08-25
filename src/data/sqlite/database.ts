import { openDatabaseSync } from 'expo-sqlite';

export type SqlValue = string | number | null;

export type SqliteDatabase = {
  execute: (sql: string) => void;
  run: (sql: string, params?: readonly SqlValue[]) => void;
  all: <Row>(sql: string, params?: readonly SqlValue[]) => Row[];
  inTransaction: (work: () => void) => void;
};

export const TOCKY_DATABASE_NAME = 'tocky.db';

export function openTockyDatabase(databaseName: string = TOCKY_DATABASE_NAME): SqliteDatabase {
  const database = openDatabaseSync(databaseName);
  database.execSync('pragma journal_mode = WAL; pragma foreign_keys = ON;');

  return {
    execute: (sql) => database.execSync(sql),
    run: (sql, params = []) => {
      database.runSync(sql, [...params]);
    },
    all: <Row>(sql: string, params: readonly SqlValue[] = []) =>
      database.getAllSync<Row>(sql, [...params]),
    inTransaction: (work) => database.withTransactionSync(work),
  };
}
