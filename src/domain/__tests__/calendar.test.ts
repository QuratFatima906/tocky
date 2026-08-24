import { dayRange, startOfDay } from '../calendar';

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
