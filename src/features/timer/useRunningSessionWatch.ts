import { useCallback, useEffect } from 'react';
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
 * run for a working day and more because the app was killed, or that starts in
 * the future because the device clock moved backwards.
 *
 * It asks rather than acts. Keeping is the default on both, and nothing is
 * changed unless the user picks something: a session that ran overnight is
 * every bit as likely to be real work as a forgotten timer, and the app has
 * no way to tell which.
 *
 * The check runs when the app opens, when it comes back to the foreground, and
 * after any write — not on a timer, because none of these become true while
 * someone is watching, and all of them are true the moment they look.
 */
export function useRunningSessionWatch({
  onEditSession,
}: {
  onEditSession: (sessionId: string) => void;
}): void {
  const store = useSessionStore();

  const askAboutRunningSession = useCallback(() => {
    const now = Date.now();
    const snapshot = store.getSnapshot();
    if (snapshot.status !== 'ready') return;

    const active = findActiveSession(snapshot.sessions);
    if (active === null) {
      // Nothing left to have an opinion about, so the next session starts fresh.
      if (snapshot.askedAboutSessionId !== null) store.setAskedAboutSession(null);
      return;
    }

    const problem = findRunningSessionProblem(active, now);
    if (problem === null || snapshot.askedAboutSessionId === active.id) return;

    store.setAskedAboutSession(active.id);
    const categoryName =
      snapshot.categories.find((category) => category.id === active.categoryId)?.name ?? 'this';

    Alert.alert(
      ...promptFor(problem, active, categoryName, now),
      buttonsFor(problem, active, store, onEditSession),
    );
  }, [store, onEditSession]);

  useEffect(() => {
    askAboutRunningSession();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') askAboutRunningSession();
    });
    // Also on every write, so the check does not depend on the store happening
    // to be ready the instant this mounted. Writes are rare and it exits early.
    const unsubscribe = store.subscribe(askAboutRunningSession);

    return () => {
      subscription.remove();
      unsubscribe();
    };
  }, [askAboutRunningSession, store]);
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
      `Tocky has ${categoryName} beginning later than right now, which usually means the device clock changed. However long it has really been running cannot be worked out from a clock that moved.`,
    ];
  }

  return [
    `Still tracking ${categoryName}?`,
    `This session has been running for ${formatDuration(sessionSeconds(session, now))}. Tocky has kept every second of it.`,
  ];
}

/**
 * Every action offered has to be one the user can actually carry out. Editing
 * a running session can only nudge its start by five and fifteen minutes —
 * there is still no time picker — so it is no answer to a session forty hours
 * long or one starting next year, and is not offered for either. What is
 * offered instead repairs the session in one tap, and only when asked for.
 */
function buttonsFor(
  problem: RunningSessionProblem,
  session: Session,
  store: ReturnType<typeof useSessionStore>,
  onEditSession: (sessionId: string) => void,
) {
  // Keep is last, which is where both platforms put the default action.
  const keep = { text: 'Keep tracking', style: 'cancel' as const };

  if (problem === 'startsInTheFuture') {
    return [
      {
        // Ending it would record nothing at all, and the elapsed time is not
        // knowable, so the honest repair is to start counting again from now.
        text: 'Start it now',
        onPress: () =>
          store.editSession(session.id, {
            categoryId: session.categoryId,
            label: session.label,
            startedAt: Date.now(),
            endedAt: null,
            note: session.note,
          }),
      },
      keep,
    ];
  }

  return [
    { text: 'End it now', onPress: () => store.endActiveSession(Date.now()) },
    { text: 'Edit the session', onPress: () => onEditSession(session.id) },
    keep,
  ];
}
