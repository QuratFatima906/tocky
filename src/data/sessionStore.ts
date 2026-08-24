import { findActiveSession, isPaused, type Category, type Session } from '@/domain';

export type SessionStoreSnapshot = {
  readonly status: 'loading' | 'ready';
  readonly categories: readonly Category[];
  readonly sessions: readonly Session[];
};

export type SessionStore = {
  subscribe: (onStoreChanged: () => void) => () => void;
  getSnapshot: () => SessionStoreSnapshot;
  pauseActiveSession: (at: number) => void;
  resumeActiveSession: (at: number) => void;
};

export const LOADING_SNAPSHOT: SessionStoreSnapshot = {
  status: 'loading',
  categories: [],
  sessions: [],
};

export function createInMemorySessionStore(initialSnapshot: SessionStoreSnapshot): SessionStore {
  let snapshot = initialSnapshot;
  const listeners = new Set<() => void>();

  function replaceActiveSession(update: (active: Session) => Session): void {
    const active = findActiveSession(snapshot.sessions);
    if (active === null) return;

    const updated = update(active);
    if (updated === active) return;

    snapshot = {
      ...snapshot,
      sessions: snapshot.sessions.map((session) => (session.id === active.id ? updated : session)),
    };
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(onStoreChanged) {
      listeners.add(onStoreChanged);
      return () => listeners.delete(onStoreChanged);
    },

    getSnapshot: () => snapshot,

    pauseActiveSession(at) {
      replaceActiveSession((active) =>
        isPaused(active)
          ? active
          : { ...active, pauses: [...active.pauses, { startedAt: at, endedAt: null }] },
      );
    },

    resumeActiveSession(at) {
      replaceActiveSession((active) =>
        isPaused(active)
          ? {
              ...active,
              pauses: active.pauses.map((pause) =>
                pause.endedAt === null ? { ...pause, endedAt: at } : pause,
              ),
            }
          : active,
      );
    },
  };
}
