import {
  breakdownForRange,
  findActiveSession,
  groupSessionsByDay,
  mostRecentlyStarted,
} from '../aggregate';
import { dayRange, startOfDay } from '../calendar';
import type { Category, Session } from '../types';

const MINUTE = 60_000;

const CATEGORIES: readonly Category[] = [
  { id: 'work', name: 'Work', icon: 'work', color: '#8C7DE8', isArchived: false },
  { id: 'learning', name: 'Learning', icon: 'learning', color: '#2FBFA0', isArchived: false },
  { id: 'creative', name: 'Creative', icon: 'creative', color: '#FF8A5C', isArchived: false },
];

const TODAY_NOON = new Date(2026, 7, 19, 12, 0).getTime();
const TODAY = dayRange(TODAY_NOON);

function buildSession(id: string, categoryId: string, startHour: number, minutes: number): Session {
  const startedAt = new Date(2026, 7, 19, startHour, 0).getTime();

  return {
    id,
    categoryId,
    label: null,
    startedAt,
    endedAt: startedAt + minutes * MINUTE,
    pauses: [],
    linkedTaskId: null,
    note: null,
  };
}

describe('breakdownForRange', () => {
  it('totals each category and ranks them by time spent', () => {
    const sessions = [
      buildSession('a', 'learning', 8, 66),
      buildSession('b', 'work', 9, 84),
      buildSession('c', 'work', 11, 60),
      buildSession('d', 'creative', 14, 48),
    ];

    const { totalSeconds, categoryTotals } = breakdownForRange(
      sessions,
      CATEGORIES,
      TODAY,
      TODAY_NOON,
    );

    expect(totalSeconds).toBe((66 + 84 + 60 + 48) * 60);
    expect(categoryTotals.map((total) => [total.category.id, total.seconds])).toEqual([
      ['work', 144 * 60],
      ['learning', 66 * 60],
      ['creative', 48 * 60],
    ]);
  });

  it('gives each category its share of the day, summing to one', () => {
    const sessions = [buildSession('a', 'work', 9, 90), buildSession('b', 'learning', 11, 30)];

    const { categoryTotals } = breakdownForRange(sessions, CATEGORIES, TODAY, TODAY_NOON);

    expect(categoryTotals.map((total) => total.share)).toEqual([0.75, 0.25]);
    expect(categoryTotals.reduce((sum, total) => sum + total.share, 0)).toBeCloseTo(1);
  });

  it('omits categories with no tracked time', () => {
    const { categoryTotals } = breakdownForRange(
      [buildSession('a', 'work', 9, 30)],
      CATEGORIES,
      TODAY,
      TODAY_NOON,
    );

    expect(categoryTotals).toHaveLength(1);
  });

  it('counts only the part of a cross-midnight session inside the range', () => {
    const startedAt = new Date(2026, 7, 18, 23, 0).getTime();
    const session: Session = {
      ...buildSession('a', 'work', 9, 0),
      startedAt,
      endedAt: new Date(2026, 7, 19, 2, 0).getTime(),
    };

    expect(breakdownForRange([session], CATEGORIES, TODAY, TODAY_NOON).totalSeconds).toBe(2 * 3600);
  });

  it('leaves sessions on an unknown category out of both the total and the rows', () => {
    const orphan = buildSession('a', 'deleted-category', 9, 30);

    const { totalSeconds, categoryTotals } = breakdownForRange(
      [orphan, buildSession('b', 'work', 10, 30)],
      CATEGORIES,
      TODAY,
      TODAY_NOON,
    );

    expect(totalSeconds).toBe(30 * 60);
    expect(categoryTotals).toHaveLength(1);
  });

  it('always keeps the total equal to the sum of its category rows', () => {
    const sessions = [
      buildSession('a', 'work', 9, 84),
      buildSession('b', 'deleted-category', 11, 60),
      buildSession('c', 'learning', 13, 45),
    ];

    const { totalSeconds, categoryTotals } = breakdownForRange(
      sessions,
      CATEGORIES,
      TODAY,
      TODAY_NOON,
    );

    expect(categoryTotals.reduce((sum, total) => sum + total.seconds, 0)).toBe(totalSeconds);
    expect(categoryTotals.reduce((sum, total) => sum + total.share, 0)).toBeCloseTo(1);
  });

  it('returns an empty breakdown for a day with nothing tracked', () => {
    expect(breakdownForRange([], CATEGORIES, TODAY, TODAY_NOON)).toEqual({
      totalSeconds: 0,
      categoryTotals: [],
    });
  });
});

describe('findActiveSession', () => {
  it('returns the session that has not ended', () => {
    const finished = buildSession('a', 'work', 9, 30);
    const active: Session = { ...buildSession('b', 'learning', 11, 0), endedAt: null };

    expect(findActiveSession([finished, active])?.id).toBe('b');
    expect(findActiveSession([finished])).toBeNull();
  });
});

describe('mostRecentlyStarted', () => {
  it('returns the newest sessions first, capped at the limit', () => {
    const sessions = [
      buildSession('early', 'work', 8, 30),
      buildSession('late', 'work', 15, 30),
      buildSession('midday', 'work', 11, 30),
    ];

    expect(mostRecentlyStarted(sessions, 2).map((session) => session.id)).toEqual([
      'late',
      'midday',
    ]);
  });

  it('does not mutate the source order', () => {
    const sessions = [buildSession('early', 'work', 8, 30), buildSession('late', 'work', 15, 30)];
    mostRecentlyStarted(sessions, 2);

    expect(sessions.map((session) => session.id)).toEqual(['early', 'late']);
  });
});

describe('groupSessionsByDay', () => {
  const NOON = new Date(2026, 7, 19, 12, 0).getTime();
  const HOUR = 3_600_000;

  function session(overrides: Partial<Session> & { id: string }): Session {
    return {
      categoryId: 'work',
      label: null,
      startedAt: NOON - HOUR,
      endedAt: NOON,
      pauses: [],
      linkedTaskId: null,
      note: null,
      ...overrides,
    };
  }

  it('groups a day of sessions under that day, newest first', () => {
    const morning = session({
      id: 'morning',
      startedAt: NOON - 5 * HOUR,
      endedAt: NOON - 4 * HOUR,
    });
    const midday = session({ id: 'midday' });

    const [today, ...otherDays] = groupSessionsByDay([morning, midday], NOON);

    expect(otherDays).toHaveLength(0);
    expect(today!.dayStart).toBe(startOfDay(NOON));
    expect(today!.entries.map((entry) => entry.session.id)).toEqual(['midday', 'morning']);
  });

  it('totals a day from the rows that explain it', () => {
    const [today] = groupSessionsByDay(
      [
        session({ id: 'one' }),
        session({ id: 'two', startedAt: NOON - 3 * HOUR, endedAt: NOON - HOUR }),
      ],
      NOON,
    );

    expect(today!.totalSeconds).toBe(
      today!.entries.reduce((total, entry) => total + entry.seconds, 0),
    );
    expect(today!.totalSeconds).toBe(3 * 3600);
  });

  it('splits a session that runs past midnight across both days', () => {
    const lastNight = new Date(2026, 7, 18, 23, 0).getTime();
    const overnight = session({
      id: 'overnight',
      startedAt: lastNight,
      endedAt: lastNight + 3 * HOUR,
    });

    const days = groupSessionsByDay([overnight], NOON);

    expect(days.map((day) => day.totalSeconds)).toEqual([2 * 3600, 3600]);
    expect(days.map((day) => day.dayStart)).toEqual([startOfDay(NOON), startOfDay(lastNight)]);
    expect(days.every((day) => day.entries[0]!.session.id === 'overnight')).toBe(true);
  });

  it('keeps the session record whole even where the day buckets divide it', () => {
    const lastNight = new Date(2026, 7, 18, 23, 0).getTime();
    const overnight = session({
      id: 'overnight',
      startedAt: lastNight,
      endedAt: lastNight + 3 * HOUR,
    });

    const days = groupSessionsByDay([overnight], NOON);

    expect(days.every((day) => day.entries[0]!.session === overnight)).toBe(true);
  });

  it('sorts a session that began yesterday by where it starts in today', () => {
    const lastNight = new Date(2026, 7, 18, 23, 0).getTime();
    const overnight = session({
      id: 'overnight',
      startedAt: lastNight,
      endedAt: lastNight + 3 * HOUR,
    });
    const earlyToday = session({
      id: 'early',
      startedAt: startOfDay(NOON) + 30 * 60_000,
      endedAt: startOfDay(NOON) + 90 * 60_000,
    });

    const [today] = groupSessionsByDay([overnight, earlyToday], NOON);

    expect(today!.entries.map((entry) => entry.session.id)).toEqual(['early', 'overnight']);
  });

  it('counts a running session up to now, and no further', () => {
    const running = session({ id: 'running', startedAt: NOON - 2 * HOUR, endedAt: null });

    const [today] = groupSessionsByDay([running], NOON);

    expect(today!.totalSeconds).toBe(2 * 3600);
  });

  it('leaves out a day a session only touched for zero seconds', () => {
    const endsExactlyAtMidnight = session({
      id: 'clean',
      startedAt: startOfDay(NOON) - HOUR,
      endedAt: startOfDay(NOON),
    });

    const days = groupSessionsByDay([endsExactlyAtMidnight], NOON);

    expect(days).toHaveLength(1);
    expect(days[0]!.dayStart).toBe(startOfDay(NOON, -1));
  });

  it('has nothing to group when nothing was tracked', () => {
    expect(groupSessionsByDay([], NOON)).toEqual([]);
  });

  it('splits across a 25-hour day without losing or inventing an hour', () => {
    const beforeFallBack = new Date(2026, 10, 1, 0, 30).getTime();
    const spansFallBack = session({
      id: 'dst',
      startedAt: beforeFallBack,
      endedAt: beforeFallBack + 25 * HOUR,
    });

    const days = groupSessionsByDay([spansFallBack], beforeFallBack + 26 * HOUR);
    const total = days.reduce((sum, day) => sum + day.totalSeconds, 0);

    expect(total).toBe(25 * 3600);
  });
});
