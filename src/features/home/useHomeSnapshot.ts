import { useMemo } from 'react';

import { useSessionStoreSnapshot } from '@/data';
import {
  breakdownForRange,
  dayRange,
  findActiveSession,
  greetingForHour,
  mostRecentlyStarted,
  sameClockTimeOnPreviousDay,
  startOfDay,
  type Category,
  type DayBreakdown,
  type Session,
} from '@/domain';
import { useNow } from '@/hooks/useNow';

const AGGREGATE_TICK_MS = 60_000;
const RECENT_SESSION_LIMIT = 3;

export type HomeSnapshot = {
  readonly isLoading: boolean;
  readonly greeting: string;
  readonly today: DayBreakdown;
  readonly secondsVersusYesterday: number;
  readonly recentSessions: readonly Session[];
  readonly activeSession: Session | null;
  readonly categoriesById: ReadonlyMap<string, Category>;
  readonly now: number;
};

export function useHomeSnapshot(): HomeSnapshot {
  const { status, categories, sessions } = useSessionStoreSnapshot();
  const now = useNow(AGGREGATE_TICK_MS);

  return useMemo(() => {
    const today = dayRange(now);
    const upToNowYesterday = {
      start: startOfDay(now, -1),
      end: sameClockTimeOnPreviousDay(now),
    };

    const todaysBreakdown = breakdownForRange(sessions, categories, today, now);
    const activeSession = findActiveSession(sessions);

    return {
      isLoading: status === 'loading',
      greeting: greetingForHour(new Date(now).getHours()),
      today: todaysBreakdown,
      secondsVersusYesterday:
        todaysBreakdown.totalSeconds -
        breakdownForRange(sessions, categories, upToNowYesterday, now).totalSeconds,
      recentSessions: mostRecentlyStarted(
        sessions.filter((session) => session.id !== activeSession?.id),
        RECENT_SESSION_LIMIT,
      ),
      activeSession,
      categoriesById: new Map(categories.map((category) => [category.id, category])),
      now,
    };
  }, [categories, now, sessions, status]);
}
