import { act, fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { createInMemorySessionStore, DEFAULT_CATEGORIES, type SessionStore } from '@/data';
import { isRunning, type Session } from '@/domain';
import { TimerScreen } from '@/features/timer/TimerScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const MINUTE = 60_000;

const RUNNING_SESSION: Session = {
  id: 'running',
  categoryId: 'work',
  label: 'Building Tocky',
  startedAt: NOW - 42 * MINUTE,
  endedAt: null,
  pauses: [],
  linkedTaskId: null,
  note: null,
};

const onCollapse = jest.fn();
const onSwitchCategory = jest.fn();
const onEnded = jest.fn();

function storeWith(sessions: readonly Session[]): SessionStore {
  return createInMemorySessionStore({ status: 'ready', categories: DEFAULT_CATEGORIES, sessions });
}

async function renderTimer(store: SessionStore = storeWith([RUNNING_SESSION])) {
  await renderWithProviders(
    <TimerScreen onCollapse={onCollapse} onSwitchCategory={onSwitchCategory} onEnded={onEnded} />,
    { store },
  );
  return store;
}

async function press(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

function alertSpy() {
  return jest.spyOn(Alert, 'alert').mockImplementation(() => {});
}

async function tapAlertButton(alert: ReturnType<typeof alertSpy>, text: string) {
  const [, , buttons] = alert.mock.calls[0]!;
  await act(async () => {
    buttons?.find((button) => button.text === text)?.onPress?.();
  });
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  onCollapse.mockClear();
  onSwitchCategory.mockClear();
  onEnded.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('what the timer shows', () => {
  it('names the session it is tracking', async () => {
    await renderTimer();

    expect(screen.getByText('Work')).toBeTruthy();
    expect(screen.getByText('Building Tocky')).toBeTruthy();
    expect(screen.getByText('Tracking session')).toBeTruthy();
  });

  it('counts the elapsed time up while it runs', async () => {
    await renderTimer();

    expect(screen.getByText('42:00')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(12_000);
    });

    expect(screen.getByText('42:12')).toBeTruthy();
  });

  it('speaks the elapsed time as words rather than a stopwatch string', async () => {
    await renderTimer();

    expect(screen.getByLabelText('Tracking 42 minutes')).toBeTruthy();
  });

  it('shows the category alone when the session was started without a label', async () => {
    await renderTimer(storeWith([{ ...RUNNING_SESSION, label: null }]));

    expect(screen.getByText('Work')).toBeTruthy();
    expect(screen.queryByText('Building Tocky')).toBeNull();
  });

  it('still tracks a session whose category has since been deleted', async () => {
    await renderTimer(storeWith([{ ...RUNNING_SESSION, categoryId: 'deleted' }]));

    expect(screen.getByText('Uncategorised')).toBeTruthy();
    expect(screen.getByText('42:00')).toBeTruthy();
  });

  it('offers a way out when nothing is being tracked at all', async () => {
    await renderTimer(storeWith([]));

    expect(screen.getByText('Nothing is being tracked')).toBeTruthy();

    await press('Back to Home');

    expect(onCollapse).toHaveBeenCalled();
  });
});

describe('pausing', () => {
  it('freezes the clock and says so', async () => {
    await renderTimer();

    await press('Pause tracking');
    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(screen.getByText('Paused session')).toBeTruthy();
    expect(screen.getByText('42:00')).toBeTruthy();
  });

  it('starts counting again on resume, without crediting the paused time', async () => {
    await renderTimer();

    await press('Pause tracking');
    await act(async () => {
      jest.advanceTimersByTime(5 * MINUTE);
    });
    await press('Resume tracking');
    await act(async () => {
      jest.advanceTimersByTime(8_000);
    });

    expect(screen.getByText('42:08')).toBeTruthy();
  });
});

describe('collapsing', () => {
  it('leaves the session running', async () => {
    const store = await renderTimer();

    await press('Collapse the timer');

    expect(onCollapse).toHaveBeenCalled();
    expect(store.getSnapshot().sessions.filter(isRunning)).toHaveLength(1);
  });
});

describe('switching category', () => {
  it('hands over to the picker rather than growing a second one', async () => {
    const store = await renderTimer();

    await press('Switch');

    expect(onSwitchCategory).toHaveBeenCalled();
    expect(store.getSnapshot().sessions.filter(isRunning)).toHaveLength(1);
  });
});

describe('ending a session', () => {
  it('saves it and leaves, once it is worth keeping', async () => {
    const store = await renderTimer();

    await press('End');

    const [ended] = store.getSnapshot().sessions;
    expect(ended!.endedAt).toBe(NOW);
    expect(onEnded).toHaveBeenCalled();
  });

  it('confirms the save with what was tracked', async () => {
    await renderTimer();

    await press('End');

    expect(screen.getByText('Session saved · 42m')).toBeTruthy();
  });

  it('asks first when the session is under a minute', async () => {
    const alert = alertSpy();
    const store = await renderTimer(storeWith([{ ...RUNNING_SESSION, startedAt: NOW - 40_000 }]));

    await press('End');

    expect(alert).toHaveBeenCalled();
    expect(store.getSnapshot().sessions[0]!.endedAt).toBeNull();
    expect(onEnded).not.toHaveBeenCalled();
  });

  it('keeps a short session when asked to', async () => {
    const alert = alertSpy();
    const store = await renderTimer(storeWith([{ ...RUNNING_SESSION, startedAt: NOW - 40_000 }]));

    await press('End');
    await tapAlertButton(alert, 'Keep it');

    expect(store.getSnapshot().sessions[0]!.endedAt).toBe(NOW);
    expect(onEnded).toHaveBeenCalled();
  });

  it('throws a short session away when asked to', async () => {
    const alert = alertSpy();
    const store = await renderTimer(storeWith([{ ...RUNNING_SESSION, startedAt: NOW - 40_000 }]));

    await press('End');
    await tapAlertButton(alert, 'Discard');

    expect(store.getSnapshot().sessions).toHaveLength(0);
    expect(onEnded).toHaveBeenCalled();
  });
});

describe('discarding from the menu', () => {
  it('never discards without asking', async () => {
    const alert = alertSpy();
    const store = await renderTimer();

    await press('More options');

    expect(alert).toHaveBeenCalled();
    expect(store.getSnapshot().sessions).toHaveLength(1);
  });

  it('discards the whole session once confirmed', async () => {
    const alert = alertSpy();
    const store = await renderTimer();

    await press('More options');
    await tapAlertButton(alert, 'Discard');

    expect(store.getSnapshot().sessions).toHaveLength(0);
    expect(screen.queryByText('Session discarded')).toBeTruthy();
    expect(onEnded).toHaveBeenCalled();
  });
});

describe('the note', () => {
  it('starts as an invitation rather than an empty field', async () => {
    await renderTimer();

    expect(screen.getByLabelText('Add a note')).toBeTruthy();
  });

  it('records what was typed against the session', async () => {
    const store = await renderTimer();

    await press('Add a note');
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('Session note'), 'Ring maths');
    });

    expect(store.getSnapshot().sessions[0]!.note).toBe('Ring maths');
  });

  it('shows an existing note instead of the invitation', async () => {
    await renderTimer(storeWith([{ ...RUNNING_SESSION, note: 'Ring maths' }]));

    expect(screen.getByLabelText('Note: Ring maths')).toBeTruthy();
  });

  it('treats an emptied field as no note at all', async () => {
    const store = await renderTimer(storeWith([{ ...RUNNING_SESSION, note: 'Ring maths' }]));

    await press('Note: Ring maths');
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('Session note'), '');
    });

    expect(store.getSnapshot().sessions[0]!.note).toBeNull();
  });
});
