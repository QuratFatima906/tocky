import { useCallback, useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';

import { useSessionStore } from '@/data';
import {
  findActiveSession,
  findRunningSessionProblem,
  formatDuration,
  sessionSeconds,
  type RunningSessionProblem,
  type Session,
} from '@/domain';

/**
 * Asks about a running session the clock has made nonsense of — one that has
 * run for days because the app was killed, or that starts in the future
 * because the device clock moved backwards.
 *
 * It asks rather than acts. Keeping is the default on both, and nothing is
 * changed unless the user picks something: a session that ran overnight is
 * every bit as likely to be real work as a forgotten timer, and the app has
 * no way to tell which.
 *
 * The check runs when the app opens and every time it comes back to the
 * foreground, because that is when a session that outlived its use is found.
 */
export function useRunningSessionWatch({
  onEditSession,
}: {
  onEditSession: (sessionId: string) => void;
}): void {
  const store = useSessionStore();
  // Asked once per session. A problem it has already been asked about is one
  // the user has answered, and asking again on every foreground is nagging.
  const askedAboutSessionId = useRef<string | null>(null);

  const askAboutRunningSession = useCallback(() => {
    const now = Date.now();
    const snapshot = store.getSnapshot();
    if (snapshot.status !== 'ready') return;

    const active = findActiveSession(snapshot.sessions);
    if (active === null) {
      askedAboutSessionId.current = null;
      return;
    }

    const problem = findRunningSessionProblem(active, now);
    if (problem === null || askedAboutSessionId.current === active.id) return;

    askedAboutSessionId.current = active.id;
    const categoryName =
      snapshot.categories.find((category) => category.id === active.categoryId)?.name ?? 'this';

    Alert.alert(
      ...promptFor(problem, active, categoryName, now),
      buttonsFor(problem, {
        onEnd: () => store.endActiveSession(Date.now()),
        onEdit: () => onEditSession(active.id),
      }),
    );
  }, [store, onEditSession]);

  useEffect(() => {
    askAboutRunningSession();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') askAboutRunningSession();
    });

    return () => subscription.remove();
  }, [askAboutRunningSession]);
}

function promptFor(
  problem: RunningSessionProblem,
  session: Session,
  categoryName: string,
  now: number,
): [title: string, message: string] {
  if (problem === 'startsInTheFuture') {
    return [
      'This session starts in the future',
      `Tocky has ${categoryName} beginning later than right now, which usually means the device clock changed. It has been left exactly as recorded.`,
    ];
  }

  return [
    `Still tracking ${categoryName}?`,
    `This session has been running for ${formatDuration(sessionSeconds(session, now))}. Tocky has kept every second of it.`,
  ];
}

function buttonsFor(
  problem: RunningSessionProblem,
  { onEnd, onEdit }: { onEnd: () => void; onEdit: () => void },
) {
  // Keep is last, which is where iOS puts the action it treats as the default.
  const edit = { text: 'Fix the time', onPress: onEdit };
  const keep = { text: 'Keep tracking', style: 'cancel' as const };

  // Ending a session that starts in the future would record nothing at all.
  return problem === 'startsInTheFuture'
    ? [edit, keep]
    : [{ text: 'End it now', onPress: onEnd }, edit, keep];
}
