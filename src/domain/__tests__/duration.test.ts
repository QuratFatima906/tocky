import { dayRange } from '../calendar';
import {
  findSessionTimeProblem,
  isPaused,
  isRunning,
  overlapsRange,
  sessionSeconds,
  sessionSecondsInRange,
} from '../duration';
import type { Pause, Session } from '../types';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function buildSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    categoryId: 'work',
    label: null,
    startedAt: Date.UTC(2026, 7, 19, 9, 0),
    endedAt: Date.UTC(2026, 7, 19, 11, 0),
    pauses: [],
    linkedTaskId: null,
    note: null,
    ...overrides,
  };
}

function pause(startedAt: number, endedAt: number | null): Pause {
  return { startedAt, endedAt };
}

describe('sessionSeconds', () => {
  const NOW = Date.UTC(2026, 7, 19, 12, 0);

  it('measures a closed session from start to end', () => {
    expect(sessionSeconds(buildSession(), NOW)).toBe(2 * 3600);
  });

  it('measures a running session up to now', () => {
    expect(sessionSeconds(buildSession({ endedAt: null }), NOW)).toBe(3 * 3600);
  });

  it('subtracts closed pauses', () => {
    const session = buildSession({
      pauses: [
        pause(Date.UTC(2026, 7, 19, 9, 30), Date.UTC(2026, 7, 19, 9, 45)),
        pause(Date.UTC(2026, 7, 19, 10, 0), Date.UTC(2026, 7, 19, 10, 10)),
      ],
    });

    expect(sessionSeconds(session, NOW)).toBe(2 * 3600 - 25 * 60);
  });

  it('treats an open pause on a running session as lasting until now', () => {
    const session = buildSession({
      endedAt: null,
      pauses: [pause(Date.UTC(2026, 7, 19, 11, 0), null)],
    });

    expect(sessionSeconds(session, NOW)).toBe(2 * 3600);
  });

  it('does not count an open pause beyond the end of a closed session', () => {
    const session = buildSession({ pauses: [pause(Date.UTC(2026, 7, 19, 10, 30), null)] });

    expect(sessionSeconds(session, NOW)).toBe(2 * 3600 - 30 * 60);
  });

  it('rounds sub-second remainders down only once across many pauses', () => {
    const startedAt = 0;
    const pauses = Array.from({ length: 5 }, (_, index) =>
      pause(index * 10_000, index * 10_000 + 1_900),
    );

    expect(sessionSeconds(buildSession({ startedAt, endedAt: 60_000, pauses }), NOW)).toBe(50);
  });

  it('returns zero for a zero-length session', () => {
    const startedAt = Date.UTC(2026, 7, 19, 9, 0);
    expect(sessionSeconds(buildSession({ startedAt, endedAt: startedAt }), NOW)).toBe(0);
  });

  it('returns zero when the clock jumped backwards mid-session', () => {
    const session = buildSession({
      startedAt: Date.UTC(2026, 7, 19, 11, 0),
      endedAt: Date.UTC(2026, 7, 19, 9, 0),
    });

    expect(sessionSeconds(session, NOW)).toBe(0);
  });

  it('returns zero when now precedes the start of a running session', () => {
    const session = buildSession({ startedAt: Date.UTC(2026, 7, 19, 13, 0), endedAt: null });

    expect(sessionSeconds(session, NOW)).toBe(0);
  });

  it('never reports negative time when pauses exceed the tracked span', () => {
    const session = buildSession({
      pauses: [pause(Date.UTC(2026, 7, 19, 8, 0), Date.UTC(2026, 7, 19, 12, 0))],
    });

    expect(sessionSeconds(session, NOW)).toBe(0);
  });
});

describe('sessionSecondsInRange', () => {
  it('splits a cross-midnight session at the local day boundary', () => {
    const startedAt = new Date(2026, 7, 19, 23, 0).getTime();
    const endedAt = new Date(2026, 7, 20, 1, 30).getTime();
    const session = buildSession({ startedAt, endedAt });
    const now = endedAt;

    expect(sessionSecondsInRange(session, dayRange(startedAt), now)).toBe(3600);
    expect(sessionSecondsInRange(session, dayRange(endedAt), now)).toBe(90 * 60);
    expect(sessionSeconds(session, now)).toBe(150 * 60);
  });

  it('attributes a pause to the day it happened in', () => {
    const startedAt = new Date(2026, 7, 19, 23, 0).getTime();
    const endedAt = new Date(2026, 7, 20, 1, 0).getTime();
    const session = buildSession({
      startedAt,
      endedAt,
      pauses: [
        pause(new Date(2026, 7, 20, 0, 10).getTime(), new Date(2026, 7, 20, 0, 40).getTime()),
      ],
    });

    expect(sessionSecondsInRange(session, dayRange(startedAt), endedAt)).toBe(3600);
    expect(sessionSecondsInRange(session, dayRange(endedAt), endedAt)).toBe(30 * 60);
  });

  it('clips a pause that straddles midnight to each day', () => {
    const startedAt = new Date(2026, 7, 19, 22, 0).getTime();
    const endedAt = new Date(2026, 7, 20, 2, 0).getTime();
    const session = buildSession({
      startedAt,
      endedAt,
      pauses: [
        pause(new Date(2026, 7, 19, 23, 30).getTime(), new Date(2026, 7, 20, 0, 30).getTime()),
      ],
    });

    expect(sessionSecondsInRange(session, dayRange(startedAt), endedAt)).toBe(90 * 60);
    expect(sessionSecondsInRange(session, dayRange(endedAt), endedAt)).toBe(90 * 60);
  });

  it('reports nothing for a day the session never touched', () => {
    const session = buildSession();
    const otherDay = dayRange(Date.UTC(2026, 7, 25, 12, 0));

    expect(sessionSecondsInRange(session, otherDay, Date.UTC(2026, 7, 25, 12, 0))).toBe(0);
  });

  it.each([
    ['a spring forward day as 23 real hours', new Date(2026, 2, 8, 12, 0).getTime(), 23],
    ['a fall back day as 25 real hours', new Date(2026, 10, 1, 12, 0).getTime(), 25],
  ])('measures %s', (_label, dayTimestamp, expectedHours) => {
    const range = dayRange(dayTimestamp);
    const session = buildSession({ startedAt: range.start, endedAt: range.end });

    expect(sessionSecondsInRange(session, range, range.end)).toBe(expectedHours * 3600);
  });
});

describe('session state', () => {
  it('reports a session without an end as running', () => {
    expect(isRunning(buildSession({ endedAt: null }))).toBe(true);
    expect(isRunning(buildSession())).toBe(false);
  });

  it('reports a running session with an open pause as paused', () => {
    const openPause = [pause(Date.UTC(2026, 7, 19, 10, 0), null)];

    expect(isPaused(buildSession({ endedAt: null, pauses: openPause }))).toBe(true);
    expect(isPaused(buildSession({ endedAt: null }))).toBe(false);
    expect(isPaused(buildSession({ pauses: openPause }))).toBe(false);
  });
});

describe('overlapsRange', () => {
  const now = Date.UTC(2026, 7, 19, 12, 0);

  it('includes a session that only partially covers the range', () => {
    const range = dayRange(Date.UTC(2026, 7, 19, 10, 0));
    expect(overlapsRange(buildSession(), range, now)).toBe(true);
  });

  it('excludes a session that ends exactly when the range starts', () => {
    const dayStart = new Date(2026, 7, 20, 0, 0).getTime();
    const session = buildSession({ startedAt: dayStart - HOUR, endedAt: dayStart });

    expect(overlapsRange(session, dayRange(dayStart), now)).toBe(false);
  });
});

describe('findSessionTimeProblem', () => {
  const NOON = new Date(2026, 7, 19, 12, 0).getTime();

  function session(id: string, startedAt: number, endedAt: number | null): Session {
    return {
      id,
      categoryId: 'work',
      label: null,
      startedAt,
      endedAt,
      pauses: [],
      linkedTaskId: null,
      note: null,
    };
  }

  const MORNING = session('morning', NOON - 4 * HOUR, NOON - 3 * HOUR);

  it('accepts a session that sits in a gap of its own', () => {
    const edited = session('edited', NOON - 2 * HOUR, NOON - HOUR);

    expect(findSessionTimeProblem(edited, [MORNING, edited], NOON)).toBeNull();
  });

  it('refuses a session that ends before it starts', () => {
    const edited = session('edited', NOON - HOUR, NOON - 2 * HOUR);

    expect(findSessionTimeProblem(edited, [edited], NOON)).toBe('endsBeforeItStarts');
  });

  it('refuses a session of no length at all', () => {
    const edited = session('edited', NOON - HOUR, NOON - HOUR);

    expect(findSessionTimeProblem(edited, [edited], NOON)).toBe('endsBeforeItStarts');
  });

  it('refuses a session that has not happened yet', () => {
    const edited = session('edited', NOON + HOUR, NOON + 2 * HOUR);

    expect(findSessionTimeProblem(edited, [edited], NOON)).toBe('startsInTheFuture');
  });

  it('refuses a session that overlaps another, since the minute would be counted twice', () => {
    const edited = session('edited', NOON - 4 * HOUR - 1800_000, NOON - 3 * HOUR - 1800_000);

    expect(findSessionTimeProblem(edited, [MORNING, edited], NOON)).toBe('overlapsAnother');
  });

  it('refuses a session that swallows another whole', () => {
    const edited = session('edited', NOON - 5 * HOUR, NOON - HOUR);

    expect(findSessionTimeProblem(edited, [MORNING, edited], NOON)).toBe('overlapsAnother');
  });

  it('lets a session end exactly where the next one begins', () => {
    const edited = session('edited', NOON - 5 * HOUR, NOON - 4 * HOUR);

    expect(findSessionTimeProblem(edited, [MORNING, edited], NOON)).toBeNull();
  });

  it('never counts the session against itself', () => {
    expect(findSessionTimeProblem(MORNING, [MORNING], NOON)).toBeNull();
  });

  it('counts a still-running session as occupying the time up to now', () => {
    const running = session('running', NOON - 2 * HOUR, null);
    const edited = session('edited', NOON - HOUR, NOON - 1800_000);

    expect(findSessionTimeProblem(edited, [running, edited], NOON)).toBe('overlapsAnother');
  });
});
