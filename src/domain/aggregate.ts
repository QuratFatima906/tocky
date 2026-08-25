import { dayRange, startOfDay, weekRange } from './calendar';
import { overlapsRange, sessionSecondsInRange, UNBOUNDED_RANGE } from './duration';
import type {
  Category,
  CategoryTotal,
  DayBreakdown,
  DaySessionEntry,
  DaySessions,
  Session,
  Task,
  TimeRange,
  WeekDay,
  WeekSummary,
} from './types';

export function breakdownForRange(
  sessions: readonly Session[],
  categories: readonly Category[],
  range: TimeRange,
  now: number,
): DayBreakdown {
  const knownCategoryIds = new Set(categories.map((category) => category.id));
  const secondsByCategoryId = new Map<string, number>();

  for (const session of sessions) {
    if (!knownCategoryIds.has(session.categoryId)) continue;
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

export function findActiveSession(sessions: readonly Session[]): Session | null {
  return sessions.find((session) => session.endedAt === null) ?? null;
}

export function mostRecentlyStarted(
  sessions: readonly Session[],
  limit: number,
): readonly Session[] {
  return [...sessions].sort((first, second) => second.startedAt - first.startedAt).slice(0, limit);
}

/**
 * Splits every session at local midnight, so a session that runs past midnight
 * is counted under both days for exactly the time it spent in each. The record
 * itself stays whole; only the day buckets divide it.
 */
export function groupSessionsByDay(
  sessions: readonly Session[],
  now: number,
): readonly DaySessions[] {
  const entriesByDay = new Map<number, DaySessionEntry[]>();

  for (const session of sessions) {
    const lastInstant = session.endedAt ?? now;

    for (let dayOffset = 0; startOfDay(session.startedAt, dayOffset) < lastInstant; dayOffset++) {
      const range = dayRange(session.startedAt, dayOffset);
      const seconds = sessionSecondsInRange(session, range, now);
      if (seconds === 0) continue;

      const entries = entriesByDay.get(range.start) ?? [];
      entries.push({
        session,
        seconds,
        startedAtInDay: Math.max(session.startedAt, range.start),
      });
      entriesByDay.set(range.start, entries);
    }
  }

  return [...entriesByDay.entries()]
    .sort(([firstDay], [secondDay]) => secondDay - firstDay)
    .map(([dayStart, entries]) => ({
      dayStart,
      totalSeconds: entries.reduce((total, entry) => total + entry.seconds, 0),
      entries: [...entries].sort((first, second) => second.startedAtInDay - first.startedAtInDay),
    }));
}

const DAYS_PER_WEEK = 7;

export function summariseWeek(
  sessions: readonly Session[],
  categories: readonly Category[],
  weekStart: number,
  now: number,
): WeekSummary {
  const range = weekRange(weekStart);
  const days = Array.from({ length: DAYS_PER_WEEK }, (_, dayOffset) => ({
    dayStart: startOfDay(range.start, dayOffset),
    breakdown: breakdownForRange(sessions, categories, dayRange(range.start, dayOffset), now),
  }));

  const withinWeek = sessions.filter((session) => overlapsRange(session, range, now));
  const secondsWithinWeek = withinWeek.map((session) => sessionSecondsInRange(session, range, now));
  const totalSeconds = days.reduce((total, day) => total + day.breakdown.totalSeconds, 0);

  return {
    range,
    totalSeconds,
    previousWeekSeconds: breakdownForRange(sessions, categories, weekRange(weekStart, -1), now)
      .totalSeconds,
    days,
    categoryTotals: breakdownForRange(sessions, categories, range, now).categoryTotals,
    longestDay: longestOf(days),
    sessionCount: withinWeek.length,
    averageBlockSeconds: withinWeek.length === 0 ? 0 : Math.floor(totalSeconds / withinWeek.length),
    longestSessionSeconds: secondsWithinWeek.reduce(
      (longest, seconds) => Math.max(longest, seconds),
      0,
    ),
    trackedDayCount: days.filter((day) => day.breakdown.totalSeconds > 0).length,
  };
}

function longestOf(days: readonly WeekDay[]): WeekDay | null {
  return days.reduce<WeekDay | null>(
    (longest, day) =>
      day.breakdown.totalSeconds > 0 &&
      (longest === null || day.breakdown.totalSeconds > longest.breakdown.totalSeconds)
        ? day
        : longest,
    null,
  );
}

export function trackedSecondsForTask(
  task: Task,
  sessions: readonly Session[],
  now: number,
): number {
  return sessions
    .filter((session) => session.linkedTaskId === task.id)
    .reduce((total, session) => total + sessionSecondsInRange(session, UNBOUNDED_RANGE, now), 0);
}

export function sessionTrackingTask(task: Task, sessions: readonly Session[]): Session | null {
  const active = findActiveSession(sessions);

  return active !== null && active.linkedTaskId === task.id ? active : null;
}
