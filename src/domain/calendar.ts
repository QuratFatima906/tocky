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
