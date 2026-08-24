import { overlapsRange, sessionSecondsInRange } from './duration';
import type { Category, CategoryTotal, DayBreakdown, Session, TimeRange } from './types';

export function sessionsInRange(
  sessions: readonly Session[],
  range: TimeRange,
  now: number,
): readonly Session[] {
  return sessions.filter((session) => overlapsRange(session, range, now));
}

export function breakdownForRange(
  sessions: readonly Session[],
  categories: readonly Category[],
  range: TimeRange,
  now: number,
): DayBreakdown {
  const secondsByCategoryId = new Map<string, number>();

  for (const session of sessions) {
    const seconds = sessionSecondsInRange(session, range, now);
    if (seconds === 0) continue;
    secondsByCategoryId.set(
      session.categoryId,
      (secondsByCategoryId.get(session.categoryId) ?? 0) + seconds,
    );
  }

  const totalSeconds = [...secondsByCategoryId.values()].reduce((sum, value) => sum + value, 0);

  const categoryTotals = categories
    .flatMap<CategoryTotal>((category) => {
      const seconds = secondsByCategoryId.get(category.id) ?? 0;
      return seconds === 0 ? [] : [{ category, seconds, share: seconds / totalSeconds }];
    })
    .sort((first, second) => second.seconds - first.seconds);

  return { totalSeconds, categoryTotals };
}

export function totalSecondsInRange(
  sessions: readonly Session[],
  range: TimeRange,
  now: number,
): number {
  return sessions.reduce((total, session) => total + sessionSecondsInRange(session, range, now), 0);
}

export function findActiveSession(sessions: readonly Session[]): Session | null {
  return sessions.find((session) => session.endedAt === null) ?? null;
}

export function mostRecentlyStarted(
  sessions: readonly Session[],
  limit: number,
): readonly Session[] {
  return [...sessions].sort((first, second) => second.startedAt - first.startedAt).slice(0, limit);
}
