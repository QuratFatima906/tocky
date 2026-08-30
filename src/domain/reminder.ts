/**
 * A daily reminder is a time of day, kept whether or not it is switched on, so
 * turning it off and back on does not lose the time that was chosen.
 *
 * It is a nudge to record, never a target to hit: nothing here counts what was
 * tracked, and nothing about it can be missed.
 */
export type DailyReminder = {
  readonly isOn: boolean;
  readonly hour: number;
  readonly minute: number;
};

export const DEFAULT_REMINDER_TIME = { hour: 20, minute: 0 } as const;

export const DAILY_REMINDER_OFF: DailyReminder = { isOn: false, ...DEFAULT_REMINDER_TIME };

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;

function isWholeWithin(value: number, limit: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < limit;
}

/** A time the clock can actually show, so a stored one can never be believed blindly. */
export function isTimeOfDay(hour: number, minute: number): boolean {
  return isWholeWithin(hour, HOURS_PER_DAY) && isWholeWithin(minute, MINUTES_PER_HOUR);
}

/** `HH:MM`, which is what the settings table stores and sorts sensibly. */
export function formatReminderTime({ hour, minute }: { hour: number; minute: number }): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Anything unparseable falls back to the default rather than throwing at launch. */
export function parseReminderTime(stored: string | null): { hour: number; minute: number } {
  const [hourText = '', minuteText = ''] = (stored ?? '').split(':');
  // `Number('')` is 0, not NaN, so an empty half would read as midnight.
  if (hourText === '' || minuteText === '') return { ...DEFAULT_REMINDER_TIME };

  const hour = Number(hourText);
  const minute = Number(minuteText);

  return isTimeOfDay(hour, minute) ? { hour, minute } : { ...DEFAULT_REMINDER_TIME };
}

/** The next time the reminder is due, which is today's unless today's has passed. */
export function nextReminderAt(
  { hour, minute }: { hour: number; minute: number },
  now: number,
): number {
  const due = new Date(now);
  due.setHours(hour, minute, 0, 0);

  if (due.getTime() <= now) due.setDate(due.getDate() + 1);

  return due.getTime();
}
