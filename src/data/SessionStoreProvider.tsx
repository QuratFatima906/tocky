import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

import type { SessionStore, SessionStoreSnapshot } from './sessionStore';

const SessionStoreContext = createContext<SessionStore | null>(null);

export function SessionStoreProvider({
  store,
  children,
}: {
  store: SessionStore;
  children: ReactNode;
}) {
  return <SessionStoreContext.Provider value={store}>{children}</SessionStoreContext.Provider>;
}

export function useSessionStore(): SessionStore {
  const store = useContext(SessionStoreContext);
  if (store === null) {
    throw new Error('useSessionStore must be used inside a SessionStoreProvider.');
  }
  return store;
}

export function useSessionStoreSnapshot(): SessionStoreSnapshot {
  const store = useSessionStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
