import { breakdownForRange, findActiveSession, mostRecentlyStarted } from '../aggregate';
import { dayRange } from '../calendar';
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
