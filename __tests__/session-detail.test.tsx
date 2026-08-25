import { act, fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { createInMemorySessionStore, DEFAULT_CATEGORIES, type SessionStore } from '@/data';
import { findActiveSession, isRunning, type Session } from '@/domain';
import { SessionDetailScreen } from '@/features/sessionDetail/SessionDetailScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const HOUR = 3_600_000;
const MINUTE = 60_000;

const SESSION: Session = {
  id: 'session-1',
  categoryId: 'work',
  label: 'Building Tocky',
  startedAt: NOW - 2 * HOUR,
  endedAt: NOW - 30 * MINUTE,
  pauses: [],
  linkedTaskId: null,
  note: null,
};

const onBack = jest.fn();
const onResumed = jest.fn();

function storeWith(sessions: readonly Session[]): SessionStore {
  return createInMemorySessionStore({ status: 'ready', categories: DEFAULT_CATEGORIES, sessions });
}

async function renderDetail(store: SessionStore = storeWith([SESSION]), sessionId = SESSION.id) {
  await renderWithProviders(
    <SessionDetailScreen sessionId={sessionId} onBack={onBack} onResumed={onResumed} />,
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
  onBack.mockClear();
  onResumed.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('what the detail shows', () => {
  it('names the session, its category and how long it ran', async () => {
    await renderDetail();

    expect(screen.getByText('Building Tocky')).toBeTruthy();
    expect(screen.getByText('Work')).toBeTruthy();
    expect(screen.getByText('1h 30m')).toBeTruthy();
  });

  it('spells out when it started and ended', async () => {
    await renderDetail();

    expect(screen.getByLabelText(/^Started: /)).toBeTruthy();
    expect(screen.getByLabelText(/^Ended: /)).toBeTruthy();
  });

  it('says there were no pauses rather than showing nothing', async () => {
    await renderDetail();

    expect(screen.getByLabelText('Pauses: None')).toBeTruthy();
  });

  it('counts the pauses and their total', async () => {
    await renderDetail(
      storeWith([
        {
          ...SESSION,
          pauses: [
            { startedAt: NOW - 100 * MINUTE, endedAt: NOW - 96 * MINUTE },
            { startedAt: NOW - 60 * MINUTE, endedAt: NOW - 58 * MINUTE },
          ],
        },
      ]),
    );

    expect(screen.getByLabelText('Pauses: 2 · 6m total')).toBeTruthy();
  });

  it('leaves the note card out when the session has no note', async () => {
    await renderDetail();

    expect(screen.queryByText('Note')).toBeNull();
  });

  it('shows the note when there is one', async () => {
    await renderDetail(storeWith([{ ...SESSION, note: 'Rebuilt the controls' }]));

    expect(screen.getByText('Rebuilt the controls')).toBeTruthy();
  });

  it('says so plainly when the session no longer exists', async () => {
    await renderDetail(storeWith([]), 'deleted-already');

    expect(screen.getByText('This session is gone')).toBeTruthy();

    await press('Back to History');
    expect(onBack).toHaveBeenCalled();
  });
});

describe('deleting', () => {
  it('never deletes without asking', async () => {
    const alert = alertSpy();
    const store = await renderDetail();

    await press('Delete');

    expect(alert).toHaveBeenCalled();
    expect(store.getSnapshot().sessions).toHaveLength(1);
  });

  it('removes the session and leaves once confirmed', async () => {
    const alert = alertSpy();
    const store = await renderDetail();

    await press('Delete');
    await tapAlertButton(alert, 'Delete');

    expect(store.getSnapshot().sessions).toHaveLength(0);
    expect(onBack).toHaveBeenCalled();
  });

  it('refuses to delete a session that is still running, and says why', async () => {
    await renderDetail(storeWith([{ ...SESSION, endedAt: null }]));

    expect(screen.getByLabelText('Delete').props.accessibilityState.disabled).toBe(true);
    expect(
      screen.getByText('This session is still running. End it before deleting it.'),
    ).toBeTruthy();
  });
});

describe('resuming', () => {
  it('starts a fresh session on the same category and label', async () => {
    const store = await renderDetail();

    await press('Resume');
    const started = findActiveSession(store.getSnapshot().sessions)!;

    expect(started.id).not.toBe(SESSION.id);
    expect(started).toMatchObject({ categoryId: 'work', label: 'Building Tocky', startedAt: NOW });
    expect(onResumed).toHaveBeenCalled();
  });

  it('asks first when something else is already being tracked', async () => {
    const alert = alertSpy();
    const running: Session = {
      ...SESSION,
      id: 'running',
      categoryId: 'health',
      startedAt: NOW - 10 * MINUTE,
      endedAt: null,
    };
    const store = await renderDetail(storeWith([SESSION, running]));

    await press('Resume');

    expect(alert).toHaveBeenCalled();
    expect(findActiveSession(store.getSnapshot().sessions)!.id).toBe('running');
    expect(onResumed).not.toHaveBeenCalled();

    await tapAlertButton(alert, 'Switch');

    expect(store.getSnapshot().sessions.filter(isRunning)).toHaveLength(1);
    expect(onResumed).toHaveBeenCalled();
  });
});

describe('editing', () => {
  async function startEditing(store?: SessionStore) {
    const opened = await renderDetail(store);
    await press('Edit this session');
    return opened;
  }

  it('opens on what the session already says', async () => {
    await startEditing();

    expect(screen.getByText('Edit session')).toBeTruthy();
    expect(screen.getByLabelText('Work').props.accessibilityState.checked).toBe(true);
    expect(screen.getByLabelText('What were you working on?').props.value).toBe('Building Tocky');
  });

  it('changes the category, label and note together', async () => {
    const store = await startEditing();

    await press('Health');
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('What were you working on?'), 'Lunch walk');
      fireEvent.changeText(screen.getByLabelText('Session note'), 'Longer than planned');
    });
    await press('Save changes');

    expect(store.getSnapshot().sessions[0]).toMatchObject({
      categoryId: 'health',
      label: 'Lunch walk',
      note: 'Longer than planned',
    });
  });

  it('nudges the start time without a picker', async () => {
    const store = await startEditing();

    await press('Started earlier by 15 minutes');
    await press('Save changes');

    expect(store.getSnapshot().sessions[0]!.startedAt).toBe(SESSION.startedAt - 15 * MINUTE);
  });

  it('blocks a save that would end the session before it started', async () => {
    const store = await startEditing();

    await press('Started later by 15 minutes');
    await press('Started later by 15 minutes');
    await press('Started later by 15 minutes');
    await press('Started later by 15 minutes');
    await press('Started later by 15 minutes');
    await press('Started later by 15 minutes');
    await press('Started later by 15 minutes');

    expect(screen.getByText('A session has to end after it starts.')).toBeTruthy();
    expect(screen.getByLabelText('Save changes').props.accessibilityState.disabled).toBe(true);

    await press('Save changes');
    expect(store.getSnapshot().sessions[0]!.startedAt).toBe(SESSION.startedAt);
  });

  it('blocks a save that would overlap another session', async () => {
    const neighbour: Session = {
      ...SESSION,
      id: 'neighbour',
      startedAt: NOW - 3 * HOUR,
      endedAt: NOW - 2 * HOUR + 5 * MINUTE,
    };
    await startEditing(storeWith([SESSION, neighbour]));

    await press('Started earlier by 15 minutes');

    expect(
      screen.getByText('That overlaps another session, so the same minutes would count twice.'),
    ).toBeTruthy();
  });

  it('leaves the session untouched when the edit is cancelled', async () => {
    const store = await startEditing();

    await press('Health');
    await press('Cancel');

    expect(store.getSnapshot().sessions[0]!.categoryId).toBe('work');
    expect(screen.getByText('Session')).toBeTruthy();
  });

  it('opens on an empty field when the session was never labelled', async () => {
    await startEditing(storeWith([{ ...SESSION, label: null }]));

    expect(screen.getByLabelText('What were you working on?').props.value).toBe('');
  });

  it('backs out of editing without leaving the session', async () => {
    const store = await startEditing();

    await press('Health');
    await press('Back');

    expect(screen.getByText('Session')).toBeTruthy();
    expect(store.getSnapshot().sessions[0]!.categoryId).toBe('work');
    expect(onBack).not.toHaveBeenCalled();
  });

  it('treats a blank label and note as nothing rather than empty text', async () => {
    const store = await startEditing(storeWith([{ ...SESSION, note: 'Something' }]));

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('What were you working on?'), '   ');
      fireEvent.changeText(screen.getByLabelText('Session note'), '  ');
    });
    await press('Save changes');

    expect(store.getSnapshot().sessions[0]).toMatchObject({ label: null, note: null });
  });

  it('confirms the change so the user knows it stuck', async () => {
    await startEditing();

    await press('Save changes');

    expect(screen.getByText('Session updated')).toBeTruthy();
  });

  it('offers no end time to edit while the session is still running', async () => {
    await startEditing(storeWith([{ ...SESSION, endedAt: null }]));

    expect(screen.getByLabelText(/^Started at /)).toBeTruthy();
    expect(screen.queryByLabelText(/^Ended at /)).toBeNull();
  });
});
