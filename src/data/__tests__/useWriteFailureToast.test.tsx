import { screen, act } from '@testing-library/react-native';

import { createNodeSqliteDatabase } from '@/test/nodeSqliteDatabase';
import { renderWithProviders } from '@/test/renderWithProviders';

import type { SqliteDatabase } from '../sqlite/database';
import { createSqliteSessionStore, type SqliteSessionStore } from '../sqlite/sqliteSessionStore';
import { useWriteFailureToast } from '../useWriteFailureToast';

function WriteFailureListener({ store }: { store: SqliteSessionStore }) {
  useWriteFailureToast(store);
  return null;
}

/** Opens and migrates normally, then refuses every write from here on. */
function storeOnAFullDisk(): SqliteSessionStore {
  const database = createNodeSqliteDatabase();
  let isOpen = false;

  const failingWrites: SqliteDatabase = {
    ...database,
    run: (sql, params) => {
      if (isOpen) throw new Error('database or disk is full');
      database.run(sql, params);
    },
  };

  const store = createSqliteSessionStore(failingWrites);
  isOpen = true;
  return store;
}

let logged: jest.SpyInstance;

beforeEach(() => {
  logged = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => logged.mockRestore());

it('tells the user which write failed, and that nothing was lost', async () => {
  const store = storeOnAFullDisk();
  await renderWithProviders(<WriteFailureListener store={store} />);

  await act(async () => {
    store.startSession({ categoryId: store.getSnapshot().categories[0]!.id, label: null, at: 1 });
  });

  expect(
    screen.getByText("Couldn't start the session. Nothing was lost — try again."),
  ).toBeOnTheScreen();
});

it('stops listening once the app is torn down', async () => {
  const store = storeOnAFullDisk();
  await renderWithProviders(<WriteFailureListener store={store} />);
  await screen.unmount();

  await act(async () => {
    store.startSession({ categoryId: store.getSnapshot().categories[0]!.id, label: null, at: 1 });
  });

  expect(screen.queryByText(/Nothing was lost/)).toBeNull();
});
