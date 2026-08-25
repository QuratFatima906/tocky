import { openDatabaseSync } from 'expo-sqlite';

import { openTockyDatabase, TOCKY_DATABASE_NAME } from '../sqlite/database';

jest.mock('expo-sqlite', () => ({ openDatabaseSync: jest.fn() }));

const nativeDatabase = {
  execSync: jest.fn(),
  runSync: jest.fn(),
  getAllSync: jest.fn(() => [{ id: 'work' }]),
  withTransactionSync: jest.fn((work: () => void) => work()),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(openDatabaseSync).mockReturnValue(nativeDatabase as never);
});

describe('openTockyDatabase', () => {
  it('opens the one Tocky database by default', () => {
    openTockyDatabase();

    expect(openDatabaseSync).toHaveBeenCalledWith(TOCKY_DATABASE_NAME);
  });

  it('turns on the pragmas the schema depends on', () => {
    openTockyDatabase();

    expect(nativeDatabase.execSync).toHaveBeenCalledWith(expect.stringContaining('foreign_keys'));
  });

  it('passes parameters through as a mutable array, which the native call requires', () => {
    openTockyDatabase().run('insert into pauses values (?, ?)', ['active', 7]);

    expect(nativeDatabase.runSync).toHaveBeenCalledWith('insert into pauses values (?, ?)', [
      'active',
      7,
    ]);
  });

  it('defaults to no parameters', () => {
    const database = openTockyDatabase();

    database.run('delete from pauses');
    database.all('select * from categories');

    expect(nativeDatabase.runSync).toHaveBeenCalledWith('delete from pauses', []);
    expect(nativeDatabase.getAllSync).toHaveBeenCalledWith('select * from categories', []);
  });

  it('runs statements that take no parameters straight through', () => {
    openTockyDatabase().execute('create table categories (id text)');

    expect(nativeDatabase.execSync).toHaveBeenCalledWith('create table categories (id text)');
  });

  it('returns the rows the native call read', () => {
    expect(openTockyDatabase().all('select id from categories')).toEqual([{ id: 'work' }]);
  });

  it('runs work inside the native transaction', () => {
    const work = jest.fn();

    openTockyDatabase().inTransaction(work);

    expect(nativeDatabase.withTransactionSync).toHaveBeenCalled();
    expect(work).toHaveBeenCalled();
  });
});
