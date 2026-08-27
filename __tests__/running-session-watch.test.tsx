import { act, screen } from '@testing-library/react-native';
import { Alert, AppState, type AppStateStatus } from 'react-native';

import { createInMemorySessionStore, DEFAULT_CATEGORIES, type SessionStore } from '@/data';
import { isRunning, type Session } from '@/domain';
import { useRunningSessionWatch } from '@/features/timer/useRunningSessionWatch';
import { renderWithProviders } from '@/test/renderWithProviders';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const HOUR = 60 * 60 * 1000;

const WORK = DEFAULT_CATEGORIES[0]!;

function running(overrides: Partial<Session> = {}): Session {
  return {
    id: 'running',
    categoryId: WORK.id,
    label: null,
    startedAt: NOW - 2 * HOUR,
    endedAt: null,
    pauses: [],
    linkedTaskId: null,
    note: null,
    ...overrides,
  };
}

function storeWith(sessions: readonly Session[]): SessionStore {
  return createInMemorySessionStore({
    status: 'ready',
    categories: DEFAULT_CATEGORIES,
    sessions,
    tasks: [],
  });
}

const onEditSession = jest.fn();

function Watcher() {
  useRunningSessionWatch({ onEditSession });
  return null;
}

async function renderWatch(store: SessionStore) {
  await renderWithProviders(<Watcher />, { store });
  return store;
}

/** Drives the AppState listener the hook registers, the way a foreground does. */
async function foreground(state: AppStateStatus = 'active') {
  const listener = (AppState.addEventListener as jest.Mock).mock.calls.at(-1)?.[1] as (
    next: AppStateStatus,
  ) => void;

  await act(async () => {
    listener(state);
  });
}

function tapAlertButton(alert: jest.SpyInstance, text: string) {
  const [, , buttons] = alert.mock.calls.at(-1)!;
  return act(async () => {
    (buttons as { text?: string; onPress?: () => void }[] | undefined)
      ?.find((button) => button.text === text)
      ?.onPress?.();
  });
}

let alert: jest.SpyInstance;
let addEventListener: jest.SpyInstance;
const remove = jest.fn();

beforeEach(() => {
  jest.setSystemTime(NOW);
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  addEventListener = jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove } as unknown as ReturnType<typeof AppState.addEventListener>);
});

afterEach(() => {
  alert.mockRestore();
  addEventListener.mockRestore();
  jest.clearAllMocks();
});

beforeAll(() => jest.useFakeTimers());
afterAll(() => jest.useRealTimers());

describe('a session of an ordinary length', () => {
  it('is left entirely alone', async () => {
    await renderWatch(storeWith([running()]));

    expect(alert).not.toHaveBeenCalled();
  });

  it('is still left alone when the app comes back to the foreground', async () => {
    await renderWatch(storeWith([running()]));

    await foreground();

    expect(alert).not.toHaveBeenCalled();
  });
});

describe('a session still running after a working day', () => {
  const OVERNIGHT = running({ startedAt: NOW - 39 * HOUR });

  it('asks about it as soon as the app opens', async () => {
    await renderWatch(storeWith([OVERNIGHT]));

    const [title, message] = alert.mock.calls[0]!;
    expect(title).toBe(`Still tracking ${WORK.name}?`);
    expect(message).toContain('39h 00m');
  });

  it('offers keeping it, and keeps it by default', async () => {
    await renderWatch(storeWith([OVERNIGHT]));

    const [, , buttons] = alert.mock.calls[0]!;
    const keep = (buttons as { text?: string; style?: string }[]).at(-1);
    expect(keep).toMatchObject({ text: 'Keep tracking', style: 'cancel' });
  });

  it('changes nothing at all unless the user picks something', async () => {
    const store = await renderWatch(storeWith([OVERNIGHT]));

    expect(store.getSnapshot().sessions.filter(isRunning)).toHaveLength(1);
    expect(store.getSnapshot().sessions[0]).toEqual(OVERNIGHT);
  });

  it('ends it at the moment asked, when that is what the user wants', async () => {
    const store = await renderWatch(storeWith([OVERNIGHT]));

    await tapAlertButton(alert, 'End it now');

    expect(store.getSnapshot().sessions[0]!.endedAt).toBe(NOW);
  });

  it('opens the session itself when the user would rather fix the time', async () => {
    await renderWatch(storeWith([OVERNIGHT]));

    await tapAlertButton(alert, 'Fix the time');

    expect(onEditSession).toHaveBeenCalledWith(OVERNIGHT.id);
  });

  it('asks once and then lets it be, rather than nagging every foreground', async () => {
    await renderWatch(storeWith([OVERNIGHT]));

    await foreground();
    await foreground();

    expect(alert).toHaveBeenCalledTimes(1);
  });

  it('asks again about a different session that runs just as long', async () => {
    const store = await renderWatch(storeWith([OVERNIGHT]));

    await act(async () => {
      store.endActiveSession(NOW);
      store.startSession({ categoryId: WORK.id, label: null, at: NOW - 40 * HOUR });
    });
    await foreground();

    expect(alert).toHaveBeenCalledTimes(2);
  });
});

describe('a session that starts in the future', () => {
  const FROM_THE_FUTURE = running({ startedAt: NOW + 3 * HOUR });

  it('says the clock is what changed, not the session', async () => {
    await renderWatch(storeWith([FROM_THE_FUTURE]));

    const [title, message] = alert.mock.calls[0]!;
    expect(title).toBe('This session starts in the future');
    expect(message).toContain('device clock');
  });

  it('does not offer to end it, which would record nothing at all', async () => {
    await renderWatch(storeWith([FROM_THE_FUTURE]));

    const [, , buttons] = alert.mock.calls[0]!;
    const labels = (buttons as { text?: string }[]).map((button) => button.text);
    expect(labels).toEqual(['Fix the time', 'Keep tracking']);
  });

  it('leaves the session exactly as recorded', async () => {
    const store = await renderWatch(storeWith([FROM_THE_FUTURE]));

    expect(store.getSnapshot().sessions[0]).toEqual(FROM_THE_FUTURE);
  });
});

describe('the watch itself', () => {
  it('has nothing to ask when nothing is running', async () => {
    await renderWatch(storeWith([]));

    await foreground();

    expect(alert).not.toHaveBeenCalled();
  });

  it('ignores the app going to the background', async () => {
    await renderWatch(storeWith([running({ startedAt: NOW - 39 * HOUR })]));
    alert.mockClear();

    await foreground('background');

    expect(alert).not.toHaveBeenCalled();
  });

  it('stops listening when it goes away', async () => {
    await renderWatch(storeWith([running()]));

    await screen.unmount();

    expect(remove).toHaveBeenCalled();
  });
});
