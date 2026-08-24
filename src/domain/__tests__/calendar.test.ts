import { dayRange, daysBetween, sameClockTimeOnPreviousDay, startOfDay } from '../calendar';

describe('startOfDay', () => {
  it('rewinds a timestamp to local midnight', () => {
    const midday = new Date(2026, 7, 19, 14, 37, 12, 500).getTime();

    expect(startOfDay(midday)).toBe(new Date(2026, 7, 19, 0, 0, 0, 0).getTime());
  });

  it('is already midnight-stable', () => {
    const midnight = new Date(2026, 7, 19).getTime();

    expect(startOfDay(midnight)).toBe(midnight);
  });

  it('crosses month and year boundaries with the offset', () => {
    const firstOfMonth = new Date(2026, 8, 1, 10, 0).getTime();
    expect(startOfDay(firstOfMonth, -1)).toBe(new Date(2026, 7, 31).getTime());

    const newYearsDay = new Date(2027, 0, 1, 10, 0).getTime();
    expect(startOfDay(newYearsDay, -1)).toBe(new Date(2026, 11, 31).getTime());
  });
});

describe('dayRange', () => {
  it('spans local midnight to the next local midnight', () => {
    const range = dayRange(new Date(2026, 7, 19, 14, 0).getTime());

    expect(range).toEqual({
      start: new Date(2026, 7, 19).getTime(),
      end: new Date(2026, 7, 20).getTime(),
    });
  });

  it('offsets whole days without drifting across a daylight-saving change', () => {
    const dayAfterSpringForward = new Date(2026, 2, 9, 14, 0).getTime();

    expect(dayRange(dayAfterSpringForward, -1)).toEqual({
      start: new Date(2026, 2, 8).getTime(),
      end: new Date(2026, 2, 9).getTime(),
    });
  });
});

describe('sameClockTimeOnPreviousDay', () => {
  it('lands on the same wall-clock time a day earlier', () => {
    const afternoon = new Date(2026, 7, 19, 14, 37, 12, 250).getTime();

    expect(sameClockTimeOnPreviousDay(afternoon)).toBe(
      new Date(2026, 7, 18, 14, 37, 12, 250).getTime(),
    );
  });

  it('keeps the wall-clock time across a spring-forward day, not the elapsed hours', () => {
    const afterSpringForward = new Date(2026, 2, 8, 23, 30).getTime();

    expect(sameClockTimeOnPreviousDay(afterSpringForward)).toBe(
      new Date(2026, 2, 7, 23, 30).getTime(),
    );
  });

  it('never reaches forward into the current day on a fall-back day', () => {
    const afterFallBack = new Date(2026, 10, 1, 23, 30).getTime();
    const result = sameClockTimeOnPreviousDay(afterFallBack);

    expect(result).toBe(new Date(2026, 9, 31, 23, 30).getTime());
    expect(result).toBeLessThan(startOfDay(afterFallBack));
  });
});

describe('daysBetween', () => {
  it.each([
    ['the same day', new Date(2026, 7, 19, 8, 0).getTime(), 0],
    ['the day before', new Date(2026, 7, 18, 23, 59).getTime(), 1],
    ['a week earlier', new Date(2026, 7, 12, 12, 0).getTime(), 7],
  ])('counts %s as %i days back', (_label, timestamp, expected) => {
    expect(daysBetween(timestamp, new Date(2026, 7, 19, 12, 0).getTime())).toBe(expected);
  });

  it('counts whole days across a daylight-saving change', () => {
    expect(
      daysBetween(new Date(2026, 2, 7, 20, 0).getTime(), new Date(2026, 2, 8, 20, 0).getTime()),
    ).toBe(1);
    expect(
      daysBetween(new Date(2026, 9, 31, 20, 0).getTime(), new Date(2026, 10, 1, 20, 0).getTime()),
    ).toBe(1);
  });
});
