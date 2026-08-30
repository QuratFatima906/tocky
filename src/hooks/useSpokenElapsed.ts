import { useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

import { formatDurationForSpeech } from '@/domain';

const SECONDS_PER_ANNOUNCEMENT = 60;

/**
 * VoiceOver reads a label when focus lands on it and never again, so a timer
 * that ticks every second is silent after the first read. Announcing every
 * minute instead of every tick keeps the elapsed time audible without talking
 * over everything else on the screen.
 *
 * The minute a session is already in is never announced -- the first
 * announcement is the first boundary crossed while listening -- so opening the
 * timer does not immediately repeat what the ring has just been read out as.
 */
export function useSpokenElapsed(elapsedSeconds: number, isPaused: boolean): void {
  const minutesElapsed = Math.floor(elapsedSeconds / SECONDS_PER_ANNOUNCEMENT);
  const lastSpokenMinute = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) {
      lastSpokenMinute.current = null;
      return;
    }

    if (lastSpokenMinute.current === null || lastSpokenMinute.current === minutesElapsed) {
      lastSpokenMinute.current = minutesElapsed;
      return;
    }

    lastSpokenMinute.current = minutesElapsed;
    AccessibilityInfo.announceForAccessibility(
      `Tracking ${formatDurationForSpeech(minutesElapsed * SECONDS_PER_ANNOUNCEMENT)}`,
    );
  }, [isPaused, minutesElapsed]);
}
