import {
  DEFAULT_REMINDER_TIME,
  formatReminderTime,
  isTimeOfDay,
  nextReminderAt,
  parseReminderTime,
} from '../reminder';

describe('a time the clock can show', () => {
  it.each([
    [0, 0],
    [23, 59],
    [8, 30],
  ])('accepts %i:%i', (hour, minute) => {
    expect(isTimeOfDay(hour, minute)).toBe(true);
  });

  it.each([
    [24, 0],
    [-1, 0],
    [12, 60],
    [12, -1],
    [8.5, 0],
    [Number.NaN, 0],
  ])('rejects %s:%s', (hour, minute) => {
    expect(isTimeOfDay(hour, minute)).toBe(false);
  });
});

describe('how a time is stored and read back', () => {
  it('pads to HH:MM so stored times sort as they read', () => {
    expect(formatReminderTime({ hour: 8, minute: 5 })).toBe('08:05');
    expect(formatReminderTime({ hour: 20, minute: 30 })).toBe('20:30');
  });

  it('round-trips every hour and minute it can hold', () => {
    for (const [hour, minute] of [
      [0, 0],
      [9, 7],
      [23, 59],
    ] as const) {
      expect(parseReminderTime(formatReminderTime({ hour, minute }))).toEqual({ hour, minute });
    }
  });

  it.each([null, '', 'half eight', '25:00', '12:60', '12', ':'])(
    'falls back to the default rather than throwing on %p',
    (stored) => {
      expect(parseReminderTime(stored)).toEqual({ ...DEFAULT_REMINDER_TIME });
    },
  );
});

describe('when the reminder is next due', () => {
  const AT = (hour: number, minute: number) => new Date(2026, 7, 19, hour, minute, 0, 0).getTime();

  it('is later today when today has not reached it', () => {
    expect(nextReminderAt({ hour: 20, minute: 0 }, AT(9, 0))).toBe(AT(20, 0));
  });

  it('is tomorrow once today has passed it', () => {
    const tomorrow = new Date(2026, 7, 20, 20, 0, 0, 0).getTime();

    expect(nextReminderAt({ hour: 20, minute: 0 }, AT(21, 0))).toBe(tomorrow);
  });

  it('is tomorrow when now is exactly the reminder, rather than firing twice', () => {
    const tomorrow = new Date(2026, 7, 20, 20, 0, 0, 0).getTime();

    expect(nextReminderAt({ hour: 20, minute: 0 }, AT(20, 0))).toBe(tomorrow);
  });

  it('lands on the wall clock, not a fixed number of hours later', () => {
    // The Sunday US clocks go back: 25 local hours, still the same time of day.
    const beforeChange = new Date(2026, 10, 1, 9, 0, 0, 0).getTime();
    const due = new Date(nextReminderAt({ hour: 20, minute: 0 }, beforeChange));

    expect([due.getHours(), due.getMinutes()]).toEqual([20, 0]);
    expect(due.getDate()).toBe(1);
  });
});
