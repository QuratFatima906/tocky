import { randomUUID } from 'expo-crypto';

import { findActiveSession, isPaused, type Category, type Session, type Task } from '@/domain';

export type SessionStoreSnapshot = {
  readonly status: 'loading' | 'ready';
  readonly categories: readonly Category[];
  readonly sessions: readonly Session[];
  readonly tasks: readonly Task[];
};

export type AddTaskInput = {
  readonly title: string;
  readonly categoryId: string;
  readonly estimateSeconds: number | null;
  readonly at: number;
};

export type StartSessionInput = {
  readonly categoryId: string;
  readonly label: string | null;
  readonly at: number;
  readonly linkedTaskId?: string | null;
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
  /** Removes a session outright. Only ever from an explicit choice. */
  deleteSession: (sessionId: string) => void;
  editSession: (sessionId: string, edit: SessionEdit) => void;
  noteActiveSession: (note: string | null) => void;
  addTask: (input: AddTaskInput) => void;
  setTaskCompleted: (taskId: string, completedAt: number | null) => void;
};

export type SessionEdit = {
  readonly categoryId: string;
  readonly label: string | null;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly note: string | null;
};

export function newSession({ categoryId, label, at, linkedTaskId }: StartSessionInput): Session {
  return {
    id: randomUUID(),
    categoryId,
    label,
    startedAt: at,
    endedAt: null,
    pauses: [],
    linkedTaskId: linkedTaskId ?? null,
    note: null,
  };
}

export function newTask({ title, categoryId, estimateSeconds, at }: AddTaskInput): Task {
  return {
    id: randomUUID(),
    title,
    categoryId,
    estimateSeconds,
    createdAt: at,
    completedAt: null,
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
  tasks: [],
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

    deleteSession(sessionId) {
      if (!snapshot.sessions.some((session) => session.id === sessionId)) return;

      snapshot = {
        ...snapshot,
        sessions: snapshot.sessions.filter((session) => session.id !== sessionId),
      };
      listeners.forEach((listener) => listener());
    },

    editSession(sessionId, edit) {
      const existing = snapshot.sessions.find((session) => session.id === sessionId);
      if (existing === undefined) return;

      snapshot = {
        ...snapshot,
        sessions: snapshot.sessions.map((session) =>
          session.id === sessionId ? { ...session, ...edit } : session,
        ),
      };
      listeners.forEach((listener) => listener());
    },

    addTask(input) {
      snapshot = { ...snapshot, tasks: [newTask(input), ...snapshot.tasks] };
      listeners.forEach((listener) => listener());
    },

    setTaskCompleted(taskId, completedAt) {
      const existing = snapshot.tasks.find((task) => task.id === taskId);
      if (existing === undefined || existing.completedAt === completedAt) return;

      snapshot = {
        ...snapshot,
        tasks: snapshot.tasks.map((task) => (task.id === taskId ? { ...task, completedAt } : task)),
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
