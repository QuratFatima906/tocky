import { useEffect } from 'react';

import { useToast } from '@/design-system';

import type { SqliteSessionStore } from './sqlite/sqliteSessionStore';

/**
 * The only place a failed write becomes visible. It says nothing was lost
 * because nothing was: the store left its snapshot alone, so a session that
 * was running is still running and its time is still on disk.
 */
export function useWriteFailureToast(store: SqliteSessionStore): void {
  const showToast = useToast();

  useEffect(
    () =>
      store.subscribeToWriteFailures(({ action }) => {
        showToast(`Couldn't ${action}. Nothing was lost — try again.`);
      }),
    [store, showToast],
  );
}
