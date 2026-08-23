import type { Pause, Session } from './types';

export function pausedSeconds(pauses: readonly Pause[], now: number): number {
  return pauses.reduce((total, pause) => {
    const end = pause.endedAt ?? now;
    return total + Math.max(0, Math.floor((end - pause.startedAt) / 1000));
  }, 0);
}

export function sessionSeconds(session: Session, now: number): number {
  const end = session.endedAt ?? now;
  const elapsed = Math.max(0, Math.floor((end - session.startedAt) / 1000));
  return Math.max(0, elapsed - pausedSeconds(session.pauses, now));
}

export function isRunning(session: Session): boolean {
  return session.endedAt === null;
}

export function isPaused(session: Session): boolean {
  return isRunning(session) && session.pauses.some((pause) => pause.endedAt === null);
}
