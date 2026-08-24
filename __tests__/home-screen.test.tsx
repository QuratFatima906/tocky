import { act, fireEvent, screen } from '@testing-library/react-native';

import { createInMemorySessionStore, LOADING_SNAPSHOT, type SessionStore } from '@/data';
import type { Category, Session } from '@/domain';
import { HomeScreen } from '@/features/home/HomeScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const MINUTE = 60_000;

const CATEGORIES: readonly Category[] = [
  { id: 'work', name: 'Work', icon: 'work', color: '#8C7DE8', isArchived: false },
  { id: 'learning', name: 'Learning', icon: 'learning', color: '#2FBFA0', isArchived: false },
];

function buildSession(overrides: Partial<Session> & Pick<Session, 'id'>): Session {
  return {
    categoryId: 'work',
    label: null,
    startedAt: NOW - 90 * MINUTE,
    endedAt: NOW - 30 * MINUTE,
    pauses: [],
    linkedTaskId: null,
    note: null,
    ...overrides,
  };
}

function storeWith(sessions: readonly Session[]): SessionStore {
  return createInMemorySessionStore({ status: 'ready', categories: CATEGORIES, sessions });
}

async function renderHome(store: SessionStore, props = {}) {
  await renderWithProviders(<HomeScreen userName="Alex" {...props} />, { store });
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('HomeScreen greeting', () => {
  it('greets the user by name for the time of day', async () => {
    await renderHome(storeWith([]));

    expect(screen.getByRole('header', { name: 'Afternoon, Alex' })).toBeTruthy();
  });

  it("shows today's date", async () => {
    await renderHome(storeWith([]));

    expect(screen.getByText(/^Wednesday, /)).toBeTruthy();
  });

  it('opens the profile from the avatar', async () => {
    const onOpenProfile = jest.fn();
    await renderHome(storeWith([]), { onOpenProfile });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Open your profile'));
    });

    expect(onOpenProfile).toHaveBeenCalled();
  });
});

describe('HomeScreen tracked today', () => {
  it("totals today's sessions and breaks them down by category", async () => {
    await renderHome(
      storeWith([
        buildSession({
          id: 'a',
          categoryId: 'work',
          startedAt: NOW - 150 * MINUTE,
          endedAt: NOW - 60 * MINUTE,
        }),
        buildSession({
          id: 'b',
          categoryId: 'learning',
          startedAt: NOW - 60 * MINUTE,
          endedAt: NOW - 30 * MINUTE,
        }),
      ]),
    );

    expect(screen.getByText('2h 00m')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Breakdown' })).toBeTruthy();
    expect(screen.getByLabelText('Work, 1 hour 30 minutes')).toBeTruthy();
    expect(screen.getByLabelText('Learning, 30 minutes')).toBeTruthy();
  });

  it('excludes the part of a session that belongs to yesterday', async () => {
    const beforeMidnight = new Date(2026, 7, 18, 23, 0).getTime();
    const afterMidnight = new Date(2026, 7, 19, 1, 0).getTime();

    await renderHome(
      storeWith([buildSession({ id: 'a', startedAt: beforeMidnight, endedAt: afterMidnight })]),
    );

    expect(screen.getByLabelText('1 hour tracked today')).toBeTruthy();
  });

  it('compares today against the same point yesterday', async () => {
    const yesterdayMorning = new Date(2026, 7, 18, 9, 0).getTime();

    await renderHome(
      storeWith([
        buildSession({ id: 'today', startedAt: NOW - 60 * MINUTE, endedAt: NOW }),
        buildSession({
          id: 'yesterday',
          startedAt: yesterdayMorning,
          endedAt: yesterdayMorning + 38 * MINUTE,
        }),
      ]),
    );

    expect(screen.getByText('+22m vs yesterday')).toBeTruthy();
  });

  it('reads the total out as words for screen readers', async () => {
    await renderHome(
      storeWith([buildSession({ id: 'a', startedAt: NOW - 90 * MINUTE, endedAt: NOW })]),
    );

    expect(screen.getByLabelText('1 hour 30 minutes tracked today')).toBeTruthy();
  });
});

describe('HomeScreen empty day', () => {
  it('shows a zero total and the empty-day prompt', async () => {
    await renderHome(storeWith([]));

    expect(screen.getByText('0m')).toBeTruthy();
    expect(screen.getByText('Nothing tracked yet — tap + to start')).toBeTruthy();
  });

  it('hides the breakdown, the comparison and the recent list', async () => {
    await renderHome(storeWith([]));

    expect(screen.queryByRole('header', { name: 'Breakdown' })).toBeNull();
    expect(screen.queryByRole('header', { name: 'Recent' })).toBeNull();
    expect(screen.queryByText(/vs yesterday/)).toBeNull();
  });
});

describe('HomeScreen loading', () => {
  it('shows a skeleton until the store is ready', async () => {
    await renderHome(createInMemorySessionStore(LOADING_SNAPSHOT));

    expect(screen.getByTestId('home-skeleton')).toBeTruthy();
    expect(screen.queryByText('0m')).toBeNull();
  });
});

describe('HomeScreen recent sessions', () => {
  it('lists finished sessions newest first with their range and duration', async () => {
    await renderHome(
      storeWith([
        buildSession({
          id: 'early',
          label: 'Inbox',
          startedAt: new Date(2026, 7, 19, 8, 4).getTime(),
          endedAt: new Date(2026, 7, 19, 8, 38).getTime(),
        }),
        buildSession({
          id: 'late',
          label: 'Building Tocky',
          startedAt: new Date(2026, 7, 19, 9, 12).getTime(),
          endedAt: new Date(2026, 7, 19, 10, 36).getTime(),
        }),
      ]),
    );

    const rows = screen.getAllByRole('button').filter((node) => {
      const label = node.props.accessibilityLabel as string | undefined;
      return label?.includes('Inbox') === true || label?.includes('Building Tocky') === true;
    });

    expect(rows[0]?.props.accessibilityLabel).toContain('Building Tocky');
    expect(screen.getByText('Work · 9:12 AM – 10:36 AM')).toBeTruthy();
    expect(screen.getByText('1h 24m')).toBeTruthy();
  });

  it('opens a session when its row is pressed', async () => {
    const onOpenSession = jest.fn();
    await renderHome(storeWith([buildSession({ id: 'a', label: 'Inbox' })]), { onOpenSession });

    await act(async () => {
      fireEvent.press(screen.getByLabelText(/^Inbox, Work,/));
    });

    expect(onOpenSession).toHaveBeenCalledWith('a');
  });

  it('falls back to the category name when a session has no label', async () => {
    await renderHome(storeWith([buildSession({ id: 'a', label: null })]));

    expect(screen.getByLabelText('Work, Work, 10:30 AM – 11:30 AM, 1 hour')).toBeTruthy();
  });

  it('still renders a session whose category was deleted', async () => {
    await renderHome(storeWith([buildSession({ id: 'a', categoryId: 'gone', label: 'Orphan' })]));

    expect(screen.getByLabelText(/^Orphan, Uncategorised,/)).toBeTruthy();
  });

  it('keeps the active session out of the recent list', async () => {
    await renderHome(
      storeWith([buildSession({ id: 'active', label: 'Building Tocky', endedAt: null })]),
    );

    expect(screen.queryByRole('header', { name: 'Recent' })).toBeNull();
  });
});

describe('HomeScreen now tracking bar', () => {
  const activeStore = () =>
    storeWith([buildSession({ id: 'active', startedAt: NOW - 102 * MINUTE, endedAt: null })]);

  it('names an uncategorised active session', async () => {
    await renderHome(
      storeWith([buildSession({ id: 'active', categoryId: 'gone', endedAt: null })]),
    );

    expect(screen.getByText('Now tracking · Uncategorised')).toBeTruthy();
  });

  it('is hidden when no session is active', async () => {
    await renderHome(storeWith([buildSession({ id: 'a' })]));

    expect(screen.queryByText('Now tracking · Work')).toBeNull();
  });

  it('shows the live elapsed time of the active session', async () => {
    await renderHome(activeStore());

    expect(screen.getByText('Now tracking · Work')).toBeTruthy();
    expect(screen.getByText('1:42:00')).toBeTruthy();
  });

  it('ticks the elapsed time every second', async () => {
    await renderHome(activeStore());

    await act(async () => {
      jest.advanceTimersByTime(18_000);
    });

    expect(screen.getByText('1:42:18')).toBeTruthy();
  });

  it('pauses the session in place and stops the clock', async () => {
    await renderHome(activeStore());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Pause Work'));
    });
    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(screen.getByText('Paused · Work')).toBeTruthy();
    expect(screen.getByText('1:42:00')).toBeTruthy();
  });

  it('resumes a paused session and starts the clock again', async () => {
    await renderHome(activeStore());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Pause Work'));
    });
    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Resume Work'));
    });
    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(screen.getByText('Now tracking · Work')).toBeTruthy();
    expect(screen.getByText('1:42:05')).toBeTruthy();
  });

  it('opens the timer when the bar is tapped', async () => {
    const onOpenTimer = jest.fn();
    await renderHome(activeStore(), { onOpenTimer });

    await act(async () => {
      fireEvent.press(screen.getByLabelText(/^Now tracking Work, 1:42:00/));
    });

    expect(onOpenTimer).toHaveBeenCalled();
  });
});

describe('HomeScreen in dark mode', () => {
  it('renders the same content', async () => {
    const store = storeWith([buildSession({ id: 'a', label: 'Inbox' })]);
    await renderWithProviders(<HomeScreen userName="Alex" />, { store, theme: 'dark' });

    expect(screen.getByRole('header', { name: 'Afternoon, Alex' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Breakdown' })).toBeTruthy();
  });
});

describe('HomeScreen category breakdown', () => {
  it('opens a category when its row is pressed', async () => {
    const onOpenCategory = jest.fn();
    await renderHome(storeWith([buildSession({ id: 'a' })]), { onOpenCategory });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Work, 1 hour'));
    });

    expect(onOpenCategory).toHaveBeenCalledWith('work');
  });
});
