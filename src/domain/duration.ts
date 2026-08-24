import type { Pause, Session, TimeRange } from './types';

const MILLISECONDS_PER_SECOND = 1000;

export const UNBOUNDED_RANGE: TimeRange = {
  start: Number.NEGATIVE_INFINITY,
  end: Number.POSITIVE_INFINITY,
};

function overlapMilliseconds(start: number, end: number, range: TimeRange): number {
  return Math.max(0, Math.min(end, range.end) - Math.max(start, range.start));
}

function pausedMilliseconds(pauses: readonly Pause[], range: TimeRange, now: number): number {
  return pauses.reduce(
    (total, pause) => total + overlapMilliseconds(pause.startedAt, pause.endedAt ?? now, range),
    0,
  );
}

export function sessionSecondsInRange(session: Session, range: TimeRange, now: number): number {
  const endedAt = session.endedAt ?? now;
  const trackedMilliseconds = overlapMilliseconds(session.startedAt, endedAt, range);
  const pausedWithinTracked = pausedMilliseconds(
    session.pauses,
    clampRangeTo(range, session.startedAt, endedAt),
    now,
  );

  return Math.floor(
    Math.max(0, trackedMilliseconds - pausedWithinTracked) / MILLISECONDS_PER_SECOND,
  );
}

function clampRangeTo(range: TimeRange, start: number, end: number): TimeRange {
  return { start: Math.max(range.start, start), end: Math.min(range.end, end) };
}

export function sessionSeconds(session: Session, now: number): number {
  return sessionSecondsInRange(session, UNBOUNDED_RANGE, now);
}

export function isRunning(session: Session): boolean {
  return session.endedAt === null;
}

export function isPaused(session: Session): boolean {
  return isRunning(session) && session.pauses.some((pause) => pause.endedAt === null);
}

export function overlapsRange(session: Session, range: TimeRange, now: number): boolean {
  return overlapMilliseconds(session.startedAt, session.endedAt ?? now, range) > 0;
}
