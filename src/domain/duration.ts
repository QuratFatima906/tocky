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

/**
 * A session nobody has stopped counts every second the clock hands it, and the
 * clock is not always telling the truth. It can run for days because the app
 * was killed, or start in the future because the device clock moved backwards
 * — where `sessionSeconds` clamps to zero and the timer sits at 00:00 saying
 * nothing. Neither is fixed here: the session is left exactly as recorded and
 * the user is asked, because only they know which one it was.
 */
export type RunningSessionProblem = 'startsInTheFuture' | 'runsImplausiblyLong';

/** Longer than a working day of *tracked* time, so a long pause never counts. */
export const IMPLAUSIBLY_LONG_SECONDS = 8 * 60 * 60;

export function findRunningSessionProblem(
  session: Session,
  now: number,
): RunningSessionProblem | null {
  if (!isRunning(session)) return null;
  if (session.startedAt > now) return 'startsInTheFuture';

  return sessionSeconds(session, now) >= IMPLAUSIBLY_LONG_SECONDS ? 'runsImplausiblyLong' : null;
}

export type SessionTimeProblem = 'endsBeforeItStarts' | 'startsInTheFuture' | 'overlapsAnother';

/**
 * The rules an edited session has to satisfy before it replaces what was
 * recorded. Two sessions overlapping would let the same minute be counted
 * twice, which would quietly make every total above it wrong.
 */
export function findSessionTimeProblem(
  candidate: Pick<Session, 'id' | 'startedAt' | 'endedAt'>,
  sessions: readonly Session[],
  now: number,
): SessionTimeProblem | null {
  if (candidate.endedAt !== null && candidate.endedAt <= candidate.startedAt) {
    return 'endsBeforeItStarts';
  }

  if (candidate.startedAt > now) return 'startsInTheFuture';

  const range: TimeRange = { start: candidate.startedAt, end: candidate.endedAt ?? now };
  const overlapsAnother = sessions.some(
    (session) => session.id !== candidate.id && overlapsRange(session, range, now),
  );

  return overlapsAnother ? 'overlapsAnother' : null;
}
