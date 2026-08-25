import { act, fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { createInMemorySessionStore, DEFAULT_CATEGORIES, type SessionStore } from '@/data';
import { findActiveSession, isRunning, type Session } from '@/domain';
import { NewSessionScreen } from '@/features/newSession/NewSessionScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const MINUTE = 60_000;

const RUNNING_WORK_SESSION: Session = {
  id: 'running',
  categoryId: 'work',
  label: 'Building Tocky',
  startedAt: NOW - 40 * MINUTE,
  endedAt: null,
  pauses: [],
  linkedTaskId: null,
  note: null,
};

const onDismiss = jest.fn();
const onStarted = jest.fn();

function storeWith(sessions: readonly Session[]): SessionStore {
  return createInMemorySessionStore({
    status: 'ready',
    categories: DEFAULT_CATEGORIES,
    sessions,
  });
}

async function renderNewSession(store: SessionStore = storeWith([])) {
  await renderWithProviders(<NewSessionScreen onDismiss={onDismiss} onStarted={onStarted} />, {
    store,
  });
  return store;
}

async function press(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  onDismiss.mockClear();
  onStarted.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('picking a category', () => {
  it('offers every category the user has', async () => {
    await renderNewSession();

    for (const category of DEFAULT_CATEGORIES) {
      expect(screen.getByLabelText(category.name)).toBeTruthy();
    }
  });

  it('starts with nothing chosen, so nothing is tracked by accident', async () => {
    await renderNewSession();

    for (const category of DEFAULT_CATEGORIES) {
      expect(screen.getByLabelText(category.name).props.accessibilityState.checked).toBe(false);
    }
  });

  it('checks only the category that was tapped', async () => {
    await renderNewSession();

    await press('Learning');

    expect(screen.getByLabelText('Learning').props.accessibilityState.checked).toBe(true);
    expect(screen.getByLabelText('Work').props.accessibilityState.checked).toBe(false);
  });

  it('moves the choice rather than adding to it', async () => {
    await renderNewSession();

    await press('Learning');
    await press('Health');

    expect(screen.getByLabelText('Learning').props.accessibilityState.checked).toBe(false);
    expect(screen.getByLabelText('Health').props.accessibilityState.checked).toBe(true);
  });
});

describe('the start button', () => {
  it('cannot start until a category is chosen', async () => {
    const store = await renderNewSession();

    const startButton = screen.getByLabelText('Pick a category to start');
    expect(startButton.props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      fireEvent.press(startButton);
    });

    expect(store.getSnapshot().sessions).toHaveLength(0);
  });

  it('names the category it is about to start', async () => {
    await renderNewSession();

    await press('Creative');

    expect(screen.getByLabelText('Start Creative session')).toBeTruthy();
  });

  it('starts the session on the chosen category and closes', async () => {
    const store = await renderNewSession();

    await press('Health');
    await press('Start Health session');

    expect(store.getSnapshot().sessions[0]).toMatchObject({
      categoryId: 'health',
      startedAt: NOW,
      endedAt: null,
    });
    expect(onStarted).toHaveBeenCalled();
  });

  it('hands off to the timer rather than just closing', async () => {
    await renderNewSession();

    await press('Health');
    await press('Start Health session');

    expect(onStarted).toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('the optional label', () => {
  it('records what the user typed', async () => {
    const store = await renderNewSession();

    await press('Work');
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('What are you working on?'), 'Wiring C3');
    });
    await press('Start Work session');

    expect(store.getSnapshot().sessions[0]!.label).toBe('Wiring C3');
  });

  it('stays optional, and blank is not a label', async () => {
    const store = await renderNewSession();

    await press('Work');
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('What are you working on?'), '   ');
    });
    await press('Start Work session');

    expect(store.getSnapshot().sessions[0]!.label).toBeNull();
  });
});

describe('dismissing', () => {
  it('tracks nothing when the user closes it', async () => {
    const store = await renderNewSession();

    await press('Work');
    await press('Close');

    expect(store.getSnapshot().sessions).toHaveLength(0);
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('starting while another session runs', () => {
  function alertSpy() {
    return jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  }

  async function startOverRunningSession() {
    const store = await renderNewSession(storeWith([RUNNING_WORK_SESSION]));
    await press('Health');
    await press('Start Health session');
    return store;
  }

  it('asks before replacing what is already being tracked', async () => {
    const alert = alertSpy();

    const store = await startOverRunningSession();

    expect(alert).toHaveBeenCalled();
    expect(store.getSnapshot().sessions).toHaveLength(1);
    expect(onStarted).not.toHaveBeenCalled();
  });

  it('names both sides of the switch, and promises no lost time', async () => {
    const alert = alertSpy();

    await startOverRunningSession();
    const [title, message] = alert.mock.calls[0]!;

    expect(title).toBe('Switch to Health?');
    expect(message).toContain('Work');
    expect(message).toContain('no time goes untracked');
  });

  it('still explains the switch when the running category has since been deleted', async () => {
    const alert = alertSpy();
    const store = await renderNewSession(
      storeWith([{ ...RUNNING_WORK_SESSION, categoryId: 'deleted' }]),
    );

    await press('Health');
    await press('Start Health session');
    const [, message] = alert.mock.calls[0]!;

    expect(message).toContain('Your current session ends');
    expect(store.getSnapshot().sessions).toHaveLength(1);
  });

  it('keeps tracking when the switch is declined', async () => {
    const alert = alertSpy();

    const store = await startOverRunningSession();
    const [, , buttons] = alert.mock.calls[0]!;

    expect(buttons?.[0]).toMatchObject({ text: 'Keep tracking', style: 'cancel' });
    expect(findActiveSession(store.getSnapshot().sessions)?.id).toBe(RUNNING_WORK_SESSION.id);
  });

  it('ends the old session exactly when the new one starts, once confirmed', async () => {
    const alert = alertSpy();

    const store = await startOverRunningSession();
    const [, , buttons] = alert.mock.calls[0]!;
    await act(async () => {
      buttons?.[1]?.onPress?.();
    });

    const { sessions } = store.getSnapshot();
    const previous = sessions.find((session) => session.id === RUNNING_WORK_SESSION.id)!;
    const started = sessions.find(isRunning)!;

    expect(previous.endedAt).toBe(NOW);
    expect(started.startedAt).toBe(NOW);
    expect(sessions.filter(isRunning)).toHaveLength(1);
    expect(onStarted).toHaveBeenCalled();
  });
});
