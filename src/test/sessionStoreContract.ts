import type { SessionStore } from '@/data';
import { isPaused, sessionSeconds, type Session } from '@/domain';

export const CONTRACT_NOW = new Date(2026, 7, 19, 12, 0).getTime();
const MINUTE = 60_000;

export const ACTIVE_SESSION: Session = {
  id: 'active',
  categoryId: 'work',
  label: 'Building Tocky',
  startedAt: CONTRACT_NOW - 60 * MINUTE,
  endedAt: null,
  pauses: [],
  linkedTaskId: null,
  note: null,
};

export const FINISHED_SESSION: Session = {
  ...ACTIVE_SESSION,
  id: 'finished',
  startedAt: CONTRACT_NOW - 180 * MINUTE,
  endedAt: CONTRACT_NOW - 120 * MINUTE,
};

export function describeSessionStoreContract(
  storeName: string,
  createStore: (sessions: readonly Session[]) => SessionStore,
): void {
  describe(`${storeName} honours the session store contract`, () => {
    it('returns a stable snapshot reference until something changes', () => {
      const store = createStore([FINISHED_SESSION]);

      expect(store.getSnapshot()).toBe(store.getSnapshot());
    });

    it('notifies subscribers when the active session changes', () => {
      const store = createStore([ACTIVE_SESSION]);
      const onStoreChanged = jest.fn();
      store.subscribe(onStoreChanged);

      store.pauseActiveSession(CONTRACT_NOW);

      expect(onStoreChanged).toHaveBeenCalledTimes(1);
    });

    it('stops notifying after unsubscribing', () => {
      const store = createStore([ACTIVE_SESSION]);
      const onStoreChanged = jest.fn();
      store.subscribe(onStoreChanged)();

      store.pauseActiveSession(CONTRACT_NOW);

      expect(onStoreChanged).not.toHaveBeenCalled();
    });

    it('opens a pause on the active session and freezes its elapsed time', () => {
      const store = createStore([ACTIVE_SESSION]);

      store.pauseActiveSession(CONTRACT_NOW);
      const paused = store.getSnapshot().sessions[0]!;

      expect(isPaused(paused)).toBe(true);
      expect(sessionSeconds(paused, CONTRACT_NOW + 30 * MINUTE)).toBe(
        sessionSeconds(paused, CONTRACT_NOW),
      );
    });

    it('closes the open pause on resume and keeps time running again', () => {
      const store = createStore([ACTIVE_SESSION]);

      store.pauseActiveSession(CONTRACT_NOW);
      store.resumeActiveSession(CONTRACT_NOW + 10 * MINUTE);
      const resumed = store.getSnapshot().sessions[0]!;

      expect(isPaused(resumed)).toBe(false);
      expect(sessionSeconds(resumed, CONTRACT_NOW + 10 * MINUTE)).toBe(60 * 60);
    });

    it('ignores a second pause while already paused', () => {
      const store = createStore([ACTIVE_SESSION]);
      const onStoreChanged = jest.fn();
      store.subscribe(onStoreChanged);

      store.pauseActiveSession(CONTRACT_NOW);
      store.pauseActiveSession(CONTRACT_NOW + MINUTE);

      expect(store.getSnapshot().sessions[0]!.pauses).toHaveLength(1);
      expect(onStoreChanged).toHaveBeenCalledTimes(1);
    });

    it('ignores a resume when nothing is paused', () => {
      const store = createStore([ACTIVE_SESSION]);
      const before = store.getSnapshot();

      store.resumeActiveSession(CONTRACT_NOW);

      expect(store.getSnapshot()).toBe(before);
    });

    it('leaves finished sessions alone when there is nothing active', () => {
      const store = createStore([FINISHED_SESSION]);
      const before = store.getSnapshot();

      store.pauseActiveSession(CONTRACT_NOW);
      store.resumeActiveSession(CONTRACT_NOW);

      expect(store.getSnapshot()).toBe(before);
    });
  });
}
