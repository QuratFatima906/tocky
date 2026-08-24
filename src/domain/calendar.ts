import type { TimeRange } from './types';

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
