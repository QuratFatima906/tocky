import { randomUUID } from 'expo-crypto';

import { findActiveSession, isPaused, type Category, type Session } from '@/domain';

export type SessionStoreSnapshot = {
  readonly status: 'loading' | 'ready';
  readonly categories: readonly Category[];
  readonly sessions: readonly Session[];
};

export type StartSessionInput = {
  readonly categoryId: string;
  readonly label: string | null;
  readonly at: number;
};

export type SessionStore = {
  subscribe: (onStoreChanged: () => void) => () => void;
  getSnapshot: () => SessionStoreSnapshot;
  /**
   * Ends whatever is running at the same instant the new session starts, so
   * switching category leaves no untracked gap and no overlap.
   */
  startSession: (input: StartSessionInput) => void;
  pauseActiveSession: (at: number) => void;
  resumeActiveSession: (at: number) => void;
  endActiveSession: (at: number) => void;
  /** Removes the running session outright. Only ever from an explicit choice. */
  discardActiveSession: () => void;
  noteActiveSession: (note: string | null) => void;
};

export function newSession({ categoryId, label, at }: StartSessionInput): Session {
  return {
    id: randomUUID(),
    categoryId,
    label,
    startedAt: at,
    endedAt: null,
    pauses: [],
    linkedTaskId: null,
    note: null,
  };
}

function endedAtInstant(session: Session, at: number): Session {
  return {
    ...session,
    endedAt: at,
    pauses: session.pauses.map((pause) =>
      pause.endedAt === null ? { ...pause, endedAt: at } : pause,
    ),
  };
}

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

    startSession(input) {
      const active = findActiveSession(snapshot.sessions);

      snapshot = {
        ...snapshot,
        sessions: [
          newSession(input),
          ...snapshot.sessions.map((session) =>
            session.id === active?.id ? endedAtInstant(session, input.at) : session,
          ),
        ],
      };
      listeners.forEach((listener) => listener());
    },

    endActiveSession(at) {
      replaceActiveSession((active) => endedAtInstant(active, at));
    },

    discardActiveSession() {
      const active = findActiveSession(snapshot.sessions);
      if (active === null) return;

      snapshot = {
        ...snapshot,
        sessions: snapshot.sessions.filter((session) => session.id !== active.id),
      };
      listeners.forEach((listener) => listener());
    },

    noteActiveSession(note) {
      replaceActiveSession((active) => (active.note === note ? active : { ...active, note }));
    },

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
