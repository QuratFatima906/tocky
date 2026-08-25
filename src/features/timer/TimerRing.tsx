import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text, TockyOwl, useTheme } from '@/design-system';
import { formatDurationForSpeech, formatElapsed } from '@/domain';

const RING_SIZE = 288;
const RING_STROKE = 18;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const OWL_SIZE = 52;
const SECONDS_PER_SWEEP = 60 * 60;

export function TimerRing({
  elapsedSeconds,
  isPaused,
  categoryColor,
}: {
  elapsedSeconds: number;
  isPaused: boolean;
  categoryColor: string;
}) {
  const theme = useTheme();
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
          expression={isPaused ? 'sleepy' : 'curious'}
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
