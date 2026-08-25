import { act, fireEvent, screen, within } from '@testing-library/react-native';

import {
  createInMemorySessionStore,
  DEFAULT_CATEGORIES,
  LOADING_SNAPSHOT,
  type SessionStore,
} from '@/data';
import type { Session } from '@/domain';
import { HistoryScreen } from '@/features/history/HistoryScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const HOUR = 3_600_000;
const MINUTE = 60_000;

const onOpenSession = jest.fn();

function buildSession(overrides: Partial<Session> & { id: string }): Session {
  return {
    categoryId: 'work',
    label: 'Building Tocky',
    startedAt: NOW - HOUR,
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
    categories: DEFAULT_CATEGORIES,
    sessions,
    tasks: [],
  });
}

async function renderHistory(store: SessionStore) {
  await renderWithProviders(<HistoryScreen onOpenSession={onOpenSession} />, { store });
}

async function search(text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Search your sessions'), text);
  });
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  onOpenSession.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the day groups', () => {
  it('heads today and yesterday by name, and older days by date', async () => {
    await renderHistory(
      storeWith([
        buildSession({ id: 'today' }),
        buildSession({ id: 'yesterday', startedAt: NOW - 25 * HOUR, endedAt: NOW - 24 * HOUR }),
        buildSession({ id: 'older', startedAt: NOW - 72 * HOUR, endedAt: NOW - 71 * HOUR }),
      ]),
    );

    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Yesterday')).toBeTruthy();
    expect(screen.getByText('Sunday, Aug 16')).toBeTruthy();
  });

  it('totals each day beside its heading', async () => {
    await renderHistory(
      storeWith([
        buildSession({ id: 'one' }),
        buildSession({ id: 'two', startedAt: NOW - 3 * HOUR, endedAt: NOW - 2 * HOUR }),
      ]),
    );

    expect(screen.getByText('1h 30m')).toBeTruthy();
  });

  it('shows a session that ran past midnight under both days', async () => {
    const lastNight = new Date(2026, 7, 18, 23, 0).getTime();

    await renderHistory(
      storeWith([
        buildSession({ id: 'overnight', startedAt: lastNight, endedAt: lastNight + 2 * HOUR }),
      ]),
    );

    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Yesterday')).toBeTruthy();
    expect(screen.getAllByText('Building Tocky')).toHaveLength(2);
  });
});

describe('a session row', () => {
  it('shows when it started, what it was, and how long it ran', async () => {
    await renderHistory(storeWith([buildSession({ id: 'one' })]));

    const row = screen.getByLabelText(/^Building Tocky, Work, from /);

    expect(within(row).getByText('Work')).toBeTruthy();
    expect(within(row).getByText('30m')).toBeTruthy();
  });

  it('falls back to the category when the session was never labelled', async () => {
    await renderHistory(storeWith([buildSession({ id: 'one', label: null })]));

    expect(screen.getByLabelText(/^Work, Work, from /)).toBeTruthy();
  });

  it('still lists a session whose category has been deleted', async () => {
    await renderHistory(storeWith([buildSession({ id: 'one', categoryId: 'gone' })]));

    expect(screen.getByText('Uncategorised')).toBeTruthy();
  });

  it('names a session with neither label nor category, rather than showing nothing', async () => {
    await renderHistory(storeWith([buildSession({ id: 'one', label: null, categoryId: 'gone' })]));

    expect(screen.getByLabelText(/^Session, Uncategorised, from /)).toBeTruthy();
  });

  it('opens the session that was tapped', async () => {
    await renderHistory(storeWith([buildSession({ id: 'tapped' })]));

    await act(async () => {
      fireEvent.press(screen.getByLabelText(/^Building Tocky, Work, from /));
    });

    expect(onOpenSession).toHaveBeenCalledWith('tapped');
  });
});

describe('searching', () => {
  async function renderTwoSessions() {
    await renderHistory(
      storeWith([
        buildSession({ id: 'work', label: 'Building Tocky' }),
        buildSession({
          id: 'walk',
          categoryId: 'health',
          label: 'Lunch walk',
          startedAt: NOW - 25 * HOUR,
          endedAt: NOW - 24 * HOUR,
        }),
      ]),
    );
  }

  it('narrows to sessions whose name matches', async () => {
    await renderTwoSessions();

    await search('lunch');

    expect(screen.getByText('Lunch walk')).toBeTruthy();
    expect(screen.queryByText('Building Tocky')).toBeNull();
  });

  it('narrows by category, so typing a category name works as a filter', async () => {
    await renderTwoSessions();

    await search('health');

    expect(screen.getByText('Lunch walk')).toBeTruthy();
    expect(screen.queryByText('Building Tocky')).toBeNull();
  });

  it('narrows by day, so typing a day name filters by date', async () => {
    await renderTwoSessions();

    await search('yesterday');

    expect(screen.getByText('Lunch walk')).toBeTruthy();
    expect(screen.queryByText('Building Tocky')).toBeNull();
  });

  it('finds a session by something written in its note', async () => {
    await renderHistory(storeWith([buildSession({ id: 'one', note: 'Ring maths' })]));

    await search('ring');

    expect(screen.getByText('Building Tocky')).toBeTruthy();
  });

  it('re-totals the day from what is left, so the total still explains the rows', async () => {
    await renderHistory(
      storeWith([
        buildSession({ id: 'kept', label: 'Kept' }),
        buildSession({
          id: 'hidden',
          label: 'Hidden',
          startedAt: NOW - 3 * HOUR,
          endedAt: NOW - HOUR,
        }),
      ]),
    );

    expect(screen.getByText('2h 30m')).toBeTruthy();

    await search('kept');

    expect(screen.queryByText('2h 30m')).toBeNull();
    expect(screen.getAllByText('30m')).toHaveLength(2);
  });

  it('says so plainly when nothing matches', async () => {
    await renderHistory(storeWith([buildSession({ id: 'one' })]));

    await search('nothing like this');

    expect(screen.getByText('Nothing matches that yet.')).toBeTruthy();
  });

  it('ignores surrounding spaces and case', async () => {
    await renderTwoSessions();

    await search('  LUNCH  ');

    expect(screen.getByText('Lunch walk')).toBeTruthy();
  });
});

describe('the empty states', () => {
  it('invites a first session when nothing has ever been tracked', async () => {
    await renderHistory(storeWith([]));

    expect(screen.getByText('Nothing tracked yet — tap + to start.')).toBeTruthy();
    expect(screen.queryByLabelText('Search your sessions')).toBeNull();
  });

  it('distinguishes a day with nothing in it from having tracked nothing ever', async () => {
    const instant = NOW - HOUR;
    await renderHistory(
      storeWith([buildSession({ id: 'zero', startedAt: instant, endedAt: instant })]),
    );

    expect(screen.getByText('Nothing tracked on these days.')).toBeTruthy();
  });

  it('shows a skeleton rather than an empty history while loading', async () => {
    await renderHistory(createInMemorySessionStore(LOADING_SNAPSHOT));

    expect(screen.getByTestId('history-skeleton')).toBeTruthy();
    expect(screen.queryByText('Nothing tracked yet — tap + to start.')).toBeNull();
  });
});
