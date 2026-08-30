import { act, screen } from '@testing-library/react-native';

import { createInMemorySessionStore, DEFAULT_CATEGORIES, type SessionStore } from '@/data';
import type { Session } from '@/domain';
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

/**
 * The timer redraws once a second for as long as a session runs, which is the
 * one thing in the app that repeats without being asked to. Everything the
 * clock does not move has to sit outside it, and nothing but a test saying so
 * stops the next change lifting the clock back up to the screen.
 */
const mockControlsRendered = jest.fn();

jest.mock('@/features/timer/TimerControls', () => {
  const actual = jest.requireActual('@/features/timer/TimerControls');

  return {
    ...actual,
    TimerControls: (props: Record<string, unknown>) => {
      mockControlsRendered();
      return actual.TimerControls(props);
    },
  };
});

function storeWith(sessions: readonly Session[]): SessionStore {
  return createInMemorySessionStore({
    status: 'ready',
    categories: DEFAULT_CATEGORIES,
    sessions,
    tasks: [],
  });
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  mockControlsRendered.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

async function runTimerFor(seconds: number): Promise<void> {
  await renderWithProviders(
    <TimerScreen onCollapse={jest.fn()} onSwitchCategory={jest.fn()} onEnded={jest.fn()} />,
    { store: storeWith([RUNNING_SESSION]) },
  );

  await act(async () => {
    jest.advanceTimersByTime(seconds * 1000);
  });
}

it('moves the numerals every second', async () => {
  await runTimerFor(0);
  expect(screen.getByText('42:00')).toBeTruthy();

  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(screen.getByText('42:05')).toBeTruthy();
});

it('leaves the controls alone while the numerals move', async () => {
  await runTimerFor(10);

  // One render for the mount, and nothing the ten ticks after it asked for.
  expect(mockControlsRendered).toHaveBeenCalledTimes(1);
});
