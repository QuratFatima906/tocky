import { act, fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import {
  createInMemorySessionStore,
  DEFAULT_CATEGORIES,
  LOADING_SNAPSHOT,
  type SessionStore,
} from '@/data';
import { findActiveSession, type Session, type Task } from '@/domain';
import { TasksScreen } from '@/features/tasks/TasksScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const MINUTE = 60_000;

const onTrackingStarted = jest.fn();

function buildTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: 'Write release notes',
    categoryId: 'work',
    estimateSeconds: 30 * 60,
    createdAt: NOW - 60 * MINUTE,
    completedAt: null,
    ...overrides,
  };
}

function storeWith(tasks: readonly Task[], sessions: readonly Session[] = []): SessionStore {
  return createInMemorySessionStore({
    status: 'ready',
    categories: DEFAULT_CATEGORIES,
    sessions,
    tasks,
  });
}

async function renderTasks(store: SessionStore = storeWith([])) {
  await renderWithProviders(<TasksScreen onTrackingStarted={onTrackingStarted} />, { store });
  return store;
}

async function press(label: string | RegExp) {
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
  onTrackingStarted.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('the list', () => {
  it('invites a first task when there are none', async () => {
    await renderTasks();

    expect(screen.getByText('No tasks yet. Add one and Tocky can track against it.')).toBeTruthy();
  });

  it('counts what is done against what there is', async () => {
    await renderTasks(
      storeWith([
        buildTask({ id: 'a' }),
        buildTask({ id: 'b' }),
        buildTask({ id: 'c', completedAt: NOW }),
      ]),
    );

    expect(screen.getByText('1 of 3 done')).toBeTruthy();
  });

  it('shows the estimate until something has been tracked against it', async () => {
    await renderTasks(storeWith([buildTask({ id: 'a' })]));

    expect(screen.getByLabelText(/Est\. 30m/)).toBeTruthy();
  });

  it('shows what was tracked once a session is linked', async () => {
    const linked: Session = {
      id: 'session',
      categoryId: 'work',
      label: 'Write release notes',
      startedAt: NOW - 45 * MINUTE,
      endedAt: NOW - 15 * MINUTE,
      pauses: [],
      linkedTaskId: 'a',
      note: null,
    };
    await renderTasks(storeWith([buildTask({ id: 'a' })], [linked]));

    expect(screen.getByLabelText(/Tracked 30m/)).toBeTruthy();
  });

  it('does not promise future tracking on a task that is already done', async () => {
    await renderTasks(
      storeWith([buildTask({ id: 'done', estimateSeconds: null, completedAt: NOW })]),
    );

    expect(screen.getByLabelText(/No time tracked/)).toBeTruthy();
  });

  it('separates what is done from what is not', async () => {
    await renderTasks(
      storeWith([buildTask({ id: 'open' }), buildTask({ id: 'done', completedAt: NOW })]),
    );

    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('shows a skeleton rather than an empty list while loading', async () => {
    await renderTasks(createInMemorySessionStore(LOADING_SNAPSHOT));

    expect(screen.getByTestId('tasks-skeleton')).toBeTruthy();
  });
});

describe('adding a task', () => {
  it('will not add one without a title and a category', async () => {
    await renderTasks();

    await press('Add a task');
    expect(screen.getByLabelText('Add task').props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('What needs doing?'), 'Ship the timer');
    });
    expect(screen.getByLabelText('Add task').props.accessibilityState.disabled).toBe(true);
  });

  it('adds the task once it has both', async () => {
    const store = await renderTasks();

    await press('Add a task');
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('What needs doing?'), 'Ship the timer');
    });
    await press('Work');
    await press('Add task');

    expect(store.getSnapshot().tasks[0]).toMatchObject({
      title: 'Ship the timer',
      categoryId: 'work',
      estimateSeconds: null,
      completedAt: null,
    });
  });

  it('records the estimate that was chosen', async () => {
    const store = await renderTasks();

    await press('Add a task');
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('What needs doing?'), 'Ship the timer');
    });
    await press('Work');
    await press('30m');
    await press('Add task');

    expect(store.getSnapshot().tasks[0]!.estimateSeconds).toBe(30 * 60);
  });

  it('adds nothing when the form is cancelled', async () => {
    const store = await renderTasks();

    await press('Add a task');
    await press('Cancel');

    expect(store.getSnapshot().tasks).toHaveLength(0);
    expect(screen.queryByTestId('add-task-form')).toBeNull();
  });
});

describe('tracking against a task', () => {
  it('starts a session linked to the task, named after it', async () => {
    const store = await renderTasks(storeWith([buildTask({ id: 'a' })]));

    await press(/^Write release notes, Est\. 30m\. Start tracking\.$/);

    const started = findActiveSession(store.getSnapshot().sessions)!;
    expect(started).toMatchObject({
      categoryId: 'work',
      label: 'Write release notes',
      linkedTaskId: 'a',
    });
    expect(onTrackingStarted).toHaveBeenCalled();
  });

  it('asks before replacing a session that is already running', async () => {
    const alert = alertSpy();
    const running: Session = {
      id: 'running',
      categoryId: 'health',
      label: null,
      startedAt: NOW - 10 * MINUTE,
      endedAt: null,
      pauses: [],
      linkedTaskId: null,
      note: null,
    };
    const store = await renderTasks(storeWith([buildTask({ id: 'a' })], [running]));

    await press(/^Write release notes, Est\. 30m\. Start tracking\.$/);

    expect(alert).toHaveBeenCalled();
    expect(findActiveSession(store.getSnapshot().sessions)!.id).toBe('running');

    await tapAlertButton(alert, 'Switch');
    expect(findActiveSession(store.getSnapshot().sessions)!.linkedTaskId).toBe('a');
  });

  it('says a task is being tracked while its session runs', async () => {
    const running: Session = {
      id: 'running',
      categoryId: 'work',
      label: 'Write release notes',
      startedAt: NOW - 5 * MINUTE,
      endedAt: null,
      pauses: [],
      linkedTaskId: 'a',
      note: null,
    };
    await renderTasks(storeWith([buildTask({ id: 'a' })], [running]));

    expect(screen.getByLabelText(/Tracking now · 5m/)).toBeTruthy();
  });
});

describe('completing a task', () => {
  it('marks it done, and lets it be reopened', async () => {
    const store = await renderTasks(storeWith([buildTask({ id: 'a' })]));

    await press('Write release notes');
    expect(store.getSnapshot().tasks[0]!.completedAt).toBe(NOW);

    await press('Write release notes');
    expect(store.getSnapshot().tasks[0]!.completedAt).toBeNull();
  });

  it('asks about the session when one is still running against it', async () => {
    const alert = alertSpy();
    const running: Session = {
      id: 'running',
      categoryId: 'work',
      label: 'Write release notes',
      startedAt: NOW - 5 * MINUTE,
      endedAt: null,
      pauses: [],
      linkedTaskId: 'a',
      note: null,
    };
    const store = await renderTasks(storeWith([buildTask({ id: 'a' })], [running]));

    await press('Write release notes');

    expect(alert).toHaveBeenCalled();
    expect(store.getSnapshot().tasks[0]!.completedAt).toBeNull();
  });

  it('ends the session too when asked', async () => {
    const alert = alertSpy();
    const running: Session = {
      id: 'running',
      categoryId: 'work',
      label: 'Write release notes',
      startedAt: NOW - 5 * MINUTE,
      endedAt: null,
      pauses: [],
      linkedTaskId: 'a',
      note: null,
    };
    const store = await renderTasks(storeWith([buildTask({ id: 'a' })], [running]));

    await press('Write release notes');
    await tapAlertButton(alert, 'End it');

    expect(store.getSnapshot().tasks[0]!.completedAt).toBe(NOW);
    expect(findActiveSession(store.getSnapshot().sessions)).toBeNull();
  });

  it('keeps tracking when asked to leave the session alone', async () => {
    const alert = alertSpy();
    const running: Session = {
      id: 'running',
      categoryId: 'work',
      label: 'Write release notes',
      startedAt: NOW - 5 * MINUTE,
      endedAt: null,
      pauses: [],
      linkedTaskId: 'a',
      note: null,
    };
    const store = await renderTasks(storeWith([buildTask({ id: 'a' })], [running]));

    await press('Write release notes');
    await tapAlertButton(alert, 'Keep tracking');

    expect(store.getSnapshot().tasks[0]!.completedAt).toBe(NOW);
    expect(findActiveSession(store.getSnapshot().sessions)!.id).toBe('running');
  });
});

describe('filtering by category', () => {
  const MIXED = [
    buildTask({ id: 'work-task' }),
    buildTask({ id: 'health-task', categoryId: 'health', title: 'Lunch walk' }),
  ];

  it('offers a chip per category in use, plus all of them', async () => {
    await renderTasks(storeWith(MIXED));

    expect(screen.getByLabelText('Show All')).toBeTruthy();
    expect(screen.getByLabelText('Show Work')).toBeTruthy();
    expect(screen.getByLabelText('Show Health')).toBeTruthy();
    expect(screen.queryByLabelText('Show Creative')).toBeNull();
  });

  it('narrows the list to the chosen category', async () => {
    await renderTasks(storeWith(MIXED));

    await press('Show Health');

    expect(screen.getByText('Lunch walk')).toBeTruthy();
    expect(screen.queryByText('Write release notes')).toBeNull();
  });

  it('counts only what the filter shows', async () => {
    await renderTasks(
      storeWith([...MIXED, buildTask({ id: 'done', completedAt: NOW, title: 'Done thing' })]),
    );

    await press('Show Health');

    expect(screen.getByText('0 of 1 done')).toBeTruthy();
  });

  it('says when a category has nothing in it', async () => {
    await renderTasks(storeWith(MIXED));

    await press('Show Health');
    await press('Show Work');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Show Health'));
    });

    expect(screen.getByText('Lunch walk')).toBeTruthy();
  });

  it('hides the chips entirely when only one category is in use', async () => {
    await renderTasks(storeWith([buildTask({ id: 'a' })]));

    expect(screen.queryByLabelText('Show All')).toBeNull();
  });
});
