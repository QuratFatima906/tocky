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
  return createInMemorySessionStore({
    status: 'ready',
    categories: CATEGORIES,
    sessions,
    tasks: [],
  });
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

  it('greets without a name until onboarding captures one', async () => {
    await renderWithProviders(<HomeScreen />, { store: storeWith([]) });

    expect(screen.getByRole('header', { name: 'Afternoon' })).toBeTruthy();
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

describe('HomeScreen across local midnight', () => {
  it('resets the day and keeps yesterday visible in Recent when the clock rolls over', async () => {
    const lateLastNight = new Date(2026, 7, 19, 23, 40).getTime();
    const justBeforeMidnight = new Date(2026, 7, 19, 23, 55).getTime();
    jest.setSystemTime(justBeforeMidnight);

    await renderHome(
      storeWith([
        buildSession({
          id: 'last-night',
          label: 'Late push',
          startedAt: lateLastNight,
          endedAt: lateLastNight + 15 * MINUTE,
        }),
      ]),
    );

    expect(screen.getByLabelText('15 minutes tracked today')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(30 * MINUTE);
    });

    expect(screen.getByLabelText('0 minutes tracked today')).toBeTruthy();
    expect(screen.getByText('Nothing tracked today yet — tap + to start')).toBeTruthy();
    expect(screen.getByLabelText(/^Late push, Work, Yesterday,/)).toBeTruthy();
  });

  it('tells a brand new user nothing is tracked yet', async () => {
    await renderHome(storeWith([]));

    expect(screen.getByText('Nothing tracked yet — tap + to start')).toBeTruthy();
  });
});

describe('HomeScreen yesterday comparison across a daylight-saving change', () => {
  it('compares against the same clock time, not the same elapsed hours', async () => {
    const lateOnFallBackDay = new Date(2026, 10, 1, 23, 30).getTime();
    jest.setSystemTime(lateOnFallBackDay);

    const earlyToday = new Date(2026, 10, 1, 0, 5).getTime();
    const yesterdayEvening = new Date(2026, 9, 31, 20, 0).getTime();

    await renderHome(
      storeWith([
        buildSession({ id: 'today', startedAt: earlyToday, endedAt: earlyToday + 20 * MINUTE }),
        buildSession({
          id: 'yesterday',
          startedAt: yesterdayEvening,
          endedAt: yesterdayEvening + 120 * MINUTE,
        }),
      ]),
    );

    expect(screen.getByText('−1h 40m vs yesterday')).toBeTruthy();
  });
});
