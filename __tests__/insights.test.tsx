import { act, fireEvent, screen } from '@testing-library/react-native';

import {
  createInMemorySessionStore,
  DEFAULT_CATEGORIES,
  LOADING_SNAPSHOT,
  type SessionStore,
} from '@/data';
import type { Session } from '@/domain';
import { InsightsScreen } from '@/features/insights/InsightsScreen';
import { renderWithProviders } from '@/test/renderWithProviders';

// Wednesday 19 August 2026, so the week runs Monday 17th to Sunday 23rd.
const NOW = new Date(2026, 7, 19, 12, 0).getTime();
const HOUR = 3_600_000;

const onSelectCategory = jest.fn();

function tracked(id: string, dayOfMonth: number, hours: number, categoryId = 'work'): Session {
  const startedAt = new Date(2026, 7, dayOfMonth, 9, 0).getTime();

  return {
    id,
    categoryId,
    label: null,
    startedAt,
    endedAt: startedAt + hours * HOUR,
    pauses: [],
    linkedTaskId: null,
    note: null,
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

const A_FULL_WEEK: readonly Session[] = [
  tracked('mon', 17, 2, 'work'),
  tracked('tue', 18, 3, 'learning'),
  tracked('wed', 19, 6, 'work'),
];

async function renderInsights(store: SessionStore = storeWith(A_FULL_WEEK)) {
  await renderWithProviders(<InsightsScreen onSelectCategory={onSelectCategory} />, { store });
  return store;
}

async function press(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  onSelectCategory.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the week total', () => {
  it('totals the whole week, not just today', async () => {
    await renderInsights();

    expect(screen.getByText('11h 00m')).toBeTruthy();
  });

  it('compares against last week in plain words, with no verdict attached', async () => {
    await renderInsights(storeWith([...A_FULL_WEEK, tracked('lastweek', 12, 4)]));

    expect(screen.getByText('7h 00m more than last week')).toBeTruthy();
  });

  it('says so when the two weeks match', async () => {
    await renderInsights(storeWith([tracked('this', 17, 4), tracked('last', 10, 4)]));

    expect(screen.getByText('same as last week')).toBeTruthy();
  });
});

describe('the week switcher', () => {
  it('starts on this week and cannot go forward from it', async () => {
    await renderInsights();

    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.getByLabelText('The week after').props.accessibilityState.disabled).toBe(true);
  });

  it('steps back a week at a time', async () => {
    await renderInsights();

    await press('The week before');
    expect(screen.getByText('Last week')).toBeTruthy();

    await press('The week before');
    expect(screen.getByText('2 weeks ago')).toBeTruthy();
  });

  it('shows the week it was moved to, not the one it started on', async () => {
    await renderInsights(storeWith([...A_FULL_WEEK, tracked('lastweek', 12, 4)]));

    await press('The week before');

    expect(screen.getByText('4h 00m')).toBeTruthy();
  });

  it('can come forward again once it has gone back', async () => {
    await renderInsights();

    await press('The week before');
    await press('The week after');

    expect(screen.getByText('This week')).toBeTruthy();
  });
});

describe('the daily chart', () => {
  it('gives every day of the week a column, whether or not it was tracked', async () => {
    await renderInsights();

    expect(screen.getByLabelText('Monday, 2 hours')).toBeTruthy();
    expect(screen.getByLabelText('Thursday, nothing tracked')).toBeTruthy();
    expect(screen.getByLabelText('Sunday, nothing tracked')).toBeTruthy();
  });

  it('tags the longest day with what it came to', async () => {
    await renderInsights();

    expect(screen.getByLabelText('Wednesday, 6 hours')).toBeTruthy();
    expect(screen.getAllByText('6h 00m').length).toBeGreaterThan(0);
  });
});

describe('the quick stats', () => {
  it('counts sessions, their average and the longest one', async () => {
    await renderInsights();

    expect(screen.getByLabelText('Sessions: 3 this week')).toBeTruthy();
    expect(screen.getByLabelText('Average: 3h 40m a session')).toBeTruthy();
    expect(screen.getByLabelText('Longest: 6h 00m one session')).toBeTruthy();
  });

  it('offers no streak, since Tocky does not keep score', async () => {
    await renderInsights();

    expect(screen.queryByText('Streak')).toBeNull();
  });
});

describe('the category ranking', () => {
  it('ranks the week by category with its share', async () => {
    await renderInsights();

    expect(screen.getByText('By category')).toBeTruthy();
    expect(screen.getByText('73%')).toBeTruthy();
    expect(screen.getByText('27%')).toBeTruthy();
  });

  it('opens what was tapped', async () => {
    await renderInsights();

    await press('Learning, 3 hours');

    expect(onSelectCategory).toHaveBeenCalledWith('learning');
  });
});

describe('the callout', () => {
  it('reports the longest day without praising it', async () => {
    await renderInsights();

    expect(screen.getByText(/Wednesday had the most tracked — 6h 00m, mostly Work\./)).toBeTruthy();
  });
});

describe('when there is not enough yet', () => {
  it('says so rather than drawing a chart of one day', async () => {
    await renderInsights(storeWith([tracked('only', 17, 2)]));

    expect(screen.getByText('One day in. Track another and the week takes shape.')).toBeTruthy();
    expect(screen.queryByTestId('week-chart')).toBeNull();
  });

  it('says nothing was tracked when the week is empty', async () => {
    await renderInsights(storeWith([]));

    expect(screen.getByText('Nothing tracked this week yet.')).toBeTruthy();
  });

  it('shows a skeleton rather than an empty week while loading', async () => {
    await renderInsights(createInMemorySessionStore(LOADING_SNAPSHOT));

    expect(screen.getByTestId('insights-skeleton')).toBeTruthy();
  });
});
