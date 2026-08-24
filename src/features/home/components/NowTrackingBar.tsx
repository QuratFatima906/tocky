import { View } from 'react-native';

import { CategoryTile, IconButton, PressableScale, Surface, Text, useTheme } from '@/design-system';
import {
  formatDurationForSpeech,
  formatElapsed,
  isPaused,
  sessionSeconds,
  type Category,
  type Session,
} from '@/domain';
import { useNow } from '@/hooks/useNow';

const ELAPSED_TICK_MS = 1_000;
const LIVE_DOT_SIZE = 6;

export function NowTrackingBar({
  session,
  category,
  onOpenTimer,
  onPause,
  onResume,
}: {
  session: Session;
  category: Category | undefined;
  onOpenTimer: () => void;
  onPause: (at: number) => void;
  onResume: (at: number) => void;
}) {
  const theme = useTheme();
  const now = useNow(ELAPSED_TICK_MS);
  const paused = isPaused(session);
  const elapsedSeconds = sessionSeconds(session, now);
  const categoryName = category?.name ?? 'Uncategorised';
  const state = paused ? 'Paused' : 'Now tracking';

  return (
    <Surface
      radius="xl"
      elevation="sheet"
      bordered
      padding="md"
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
    >
      <PressableScale
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${state}, ${categoryName}, ${formatDurationForSpeech(elapsedSeconds)}. Open the timer.`}
        onPress={onOpenTimer}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
      >
        <CategoryTile icon={category?.icon} color={category?.color ?? theme.color.accent} />

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <View
              style={{
                width: LIVE_DOT_SIZE,
                height: LIVE_DOT_SIZE,
                borderRadius: LIVE_DOT_SIZE / 2,
                backgroundColor: paused ? theme.color.textTertiary : theme.color.accent,
              }}
            />
            <Text variant="microLabel" color="textTertiary">
              {state} · {categoryName}
            </Text>
          </View>
          <Text variant="timerSmall">{formatElapsed(elapsedSeconds)}</Text>
        </View>
      </PressableScale>

      <IconButton
        icon={paused ? 'start' : 'pause'}
        background="surfaceMuted"
        accessibilityLabel={paused ? `Resume ${categoryName}` : `Pause ${categoryName}`}
        onPress={() => (paused ? onResume(Date.now()) : onPause(Date.now()))}
      />
    </Surface>
  );
}
