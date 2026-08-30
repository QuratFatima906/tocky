import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text, TockyOwl, useTheme } from '@/design-system';
import {
  formatDurationForSpeech,
  formatElapsed,
  IMPLAUSIBLY_LONG_SECONDS,
  sessionSeconds,
  type Session,
} from '@/domain';
import { useNow } from '@/hooks/useNow';
import { useSpokenElapsed } from '@/hooks/useSpokenElapsed';

const RING_SIZE = 288;
const RING_STROKE = 18;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const OWL_SIZE = 52;
const SECONDS_PER_SWEEP = 60 * 60;
const ELAPSED_TICK_MS = 1_000;

/**
 * The clock lives here rather than on the screen, so a tick re-renders the ring
 * and the numerals it moves and nothing else -- not the controls, not the note,
 * and not the handlers the screen rebuilds around them.
 *
 * Saying the elapsed time aloud is the same job as drawing it, for someone who
 * cannot see the ring, so it runs off the same clock.
 */
export function TimerRing({
  session,
  isPaused,
  categoryColor,
}: {
  session: Session;
  isPaused: boolean;
  categoryColor: string;
}) {
  const theme = useTheme();
  const now = useNow(isPaused ? null : ELAPSED_TICK_MS);
  const elapsedSeconds = sessionSeconds(session, now);

  useSpokenElapsed(elapsedSeconds, isPaused);
  // The ring is a clock face, not a target: one full sweep per hour tracked.
  const sweep = (elapsedSeconds % SECONDS_PER_SWEEP) / SECONDS_PER_SWEEP;
  const ringColor = isPaused ? theme.color.textTertiary : theme.category.glyph(categoryColor);

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignSelf: 'center' }}>
      <Svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={theme.color.surfaceMuted}
          strokeWidth={RING_STROKE}
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${RING_CIRCUMFERENCE * sweep} ${RING_CIRCUMFERENCE}`}
        />
      </Svg>

      <View
        style={[
          StyleSheet.absoluteFill,
          { alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs },
        ]}
      >
        <TockyOwl
          expression={owlExpressionFor(elapsedSeconds, isPaused)}
          bodyColor={ringColor}
          size={OWL_SIZE}
        />
        <Text variant="microLabel" color="textTertiary">
          {isPaused ? 'Paused' : 'Tracking'}
        </Text>
        <Text
          variant="timerLarge"
          accessibilityLabel={`${isPaused ? 'Paused at' : 'Tracking'} ${formatDurationForSpeech(elapsedSeconds)}`}
        >
          {formatElapsed(elapsedSeconds)}
        </Text>
      </View>
    </View>
  );
}

/** The same threshold that makes Tocky ask about the session — §6.1 wants the
 *  owl to have noticed too, rather than staying curious for two days. */
function owlExpressionFor(elapsedSeconds: number, isPaused: boolean) {
  if (isPaused) return 'sleepy';
  return elapsedSeconds >= IMPLAUSIBLY_LONG_SECONDS ? 'surprised' : 'curious';
}
