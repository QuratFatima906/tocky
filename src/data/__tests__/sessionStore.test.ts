import { isPaused, sessionSeconds, type Session } from '@/domain';

import { createDevSeedSnapshot, DEFAULT_CATEGORIES } from '../devSeed';
import { createInMemorySessionStore, LOADING_SNAPSHOT } from '../sessionStore';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const MINUTE = 60_000;

const ACTIVE_SESSION: Session = {
  id: 'active',
  categoryId: 'work',
  label: 'Building Tocky',
  startedAt: NOW - 60 * MINUTE,
  endedAt: null,
  pauses: [],
  linkedTaskId: null,
  note: null,
};

const FINISHED_SESSION: Session = {
  ...ACTIVE_SESSION,
  id: 'finished',
  startedAt: NOW - 180 * MINUTE,
  endedAt: NOW - 120 * MINUTE,
};

function createStore(sessions: readonly Session[]) {
  return createInMemorySessionStore({ status: 'ready', categories: DEFAULT_CATEGORIES, sessions });
}

describe('createInMemorySessionStore', () => {
  it('exposes the snapshot it was created with', () => {
    expect(createStore([FINISHED_SESSION]).getSnapshot()).toEqual({
      status: 'ready',
      categories: DEFAULT_CATEGORIES,
      sessions: [FINISHED_SESSION],
    });
  });

  it('returns a stable snapshot reference until something changes', () => {
    const store = createStore([FINISHED_SESSION]);

    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it('notifies subscribers when the active session changes', () => {
    const store = createStore([ACTIVE_SESSION]);
    const onStoreChanged = jest.fn();
    store.subscribe(onStoreChanged);

    store.pauseActiveSession(NOW);

    expect(onStoreChanged).toHaveBeenCalledTimes(1);
  });

  it('stops notifying after unsubscribing', () => {
    const store = createStore([ACTIVE_SESSION]);
    const onStoreChanged = jest.fn();
    store.subscribe(onStoreChanged)();

    store.pauseActiveSession(NOW);

    expect(onStoreChanged).not.toHaveBeenCalled();
  });

  it('opens a pause on the active session and freezes its elapsed time', () => {
    const store = createStore([ACTIVE_SESSION]);

    store.pauseActiveSession(NOW);
    const paused = store.getSnapshot().sessions[0]!;

    expect(isPaused(paused)).toBe(true);
    expect(sessionSeconds(paused, NOW + 30 * MINUTE)).toBe(sessionSeconds(paused, NOW));
  });

  it('closes the open pause on resume and keeps time running again', () => {
    const store = createStore([ACTIVE_SESSION]);

    store.pauseActiveSession(NOW);
    store.resumeActiveSession(NOW + 10 * MINUTE);
    const resumed = store.getSnapshot().sessions[0]!;

    expect(isPaused(resumed)).toBe(false);
    expect(sessionSeconds(resumed, NOW + 10 * MINUTE)).toBe(60 * 60);
  });

  it('ignores a second pause while already paused', () => {
    const store = createStore([ACTIVE_SESSION]);
    const onStoreChanged = jest.fn();
    store.subscribe(onStoreChanged);

    store.pauseActiveSession(NOW);
    store.pauseActiveSession(NOW + MINUTE);

    expect(store.getSnapshot().sessions[0]!.pauses).toHaveLength(1);
    expect(onStoreChanged).toHaveBeenCalledTimes(1);
  });

  it('ignores a resume when nothing is paused', () => {
    const store = createStore([ACTIVE_SESSION]);
    const before = store.getSnapshot();

    store.resumeActiveSession(NOW);

    expect(store.getSnapshot()).toBe(before);
  });

  it('leaves finished sessions alone when there is nothing active', () => {
    const store = createStore([FINISHED_SESSION]);
    const before = store.getSnapshot();

    store.pauseActiveSession(NOW);
    store.resumeActiveSession(NOW);

    expect(store.getSnapshot()).toBe(before);
  });

  it('starts empty and loading from the loading snapshot', () => {
    expect(createInMemorySessionStore(LOADING_SNAPSHOT).getSnapshot().status).toBe('loading');
  });
});

describe('createDevSeedSnapshot', () => {
  it('seeds the six default categories', () => {
    expect(createDevSeedSnapshot(NOW).categories.map((category) => category.name)).toEqual([
      'Work',
      'Learning',
      'Personal',
      'Health',
      'Creative',
      'Social',
    ]);
  });

  it('seeds exactly one running session', () => {
    const running = createDevSeedSnapshot(NOW).sessions.filter(
      (session) => session.endedAt === null,
    );

    expect(running).toHaveLength(1);
  });

  it('seeds every session against a known category', () => {
    const { categories, sessions } = createDevSeedSnapshot(NOW);
    const categoryIds = new Set(categories.map((category) => category.id));

    expect(sessions.every((session) => categoryIds.has(session.categoryId))).toBe(true);
  });

  it('places sessions relative to now so the seed never looks stale', () => {
    const { sessions } = createDevSeedSnapshot(NOW);

    expect(sessions.every((session) => session.startedAt < NOW)).toBe(true);
    expect(sessions.every((session) => (session.endedAt ?? NOW) <= NOW)).toBe(true);
  });
});
