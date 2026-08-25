import type { TimeRange } from './types';

const DAY_MILLISECONDS = 86_400_000;

export function startOfDay(timestamp: number, dayOffset = 0): number {
  const date = new Date(timestamp);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + dayOffset,
    0,
    0,
    0,
    0,
  ).getTime();
}

const DAYS_PER_WEEK = 7;

/** Weeks start on Monday, which is what the daily chart reads left to right. */
export function startOfWeek(timestamp: number, weekOffset = 0): number {
  const mondayIsZero = (new Date(timestamp).getDay() + 6) % DAYS_PER_WEEK;

  return startOfDay(timestamp, weekOffset * DAYS_PER_WEEK - mondayIsZero);
}

export function weekRange(timestamp: number, weekOffset = 0): TimeRange {
  const start = startOfWeek(timestamp, weekOffset);

  return { start, end: startOfDay(start, DAYS_PER_WEEK) };
}

export function dayRange(timestamp: number, dayOffset = 0): TimeRange {
  return { start: startOfDay(timestamp, dayOffset), end: startOfDay(timestamp, dayOffset + 1) };
}

export function sameClockTimeOnPreviousDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - 1,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  ).getTime();
}

export function daysBetween(timestamp: number, reference: number): number {
  return Math.round((startOfDay(reference) - startOfDay(timestamp)) / DAY_MILLISECONDS);
}
