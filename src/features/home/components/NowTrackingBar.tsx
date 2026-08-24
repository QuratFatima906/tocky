import { View } from 'react-native';

import { CategoryTile, IconButton, PressableScale, Surface, Text, useTheme } from '@/design-system';
import { formatElapsed, isPaused, sessionSeconds, type Category, type Session } from '@/domain';
import { useNow } from '@/hooks/useNow';

const ELAPSED_TICK_MS = 1_000;
const TILE_SIZE = 38;
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
  const elapsed = formatElapsed(sessionSeconds(session, now));
  const categoryName = category?.name ?? 'Uncategorised';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${paused ? 'Paused' : 'Now tracking'} ${categoryName}, ${elapsed}. Open the timer.`}
      onPress={onOpenTimer}
    >
      <Surface
        radius="xl"
        elevation="sheet"
        bordered
        padding="md"
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
      >
        <CategoryTile
          icon={category?.icon ?? ''}
          color={category?.color ?? theme.color.accent}
          size={TILE_SIZE}
        />

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
              {paused ? 'Paused' : 'Now tracking'} · {categoryName}
            </Text>
          </View>
          <Text variant="timerSmall">{elapsed}</Text>
        </View>

        <IconButton
          icon={paused ? 'start' : 'pause'}
          background="surfaceMuted"
          accessibilityLabel={paused ? `Resume ${categoryName}` : `Pause ${categoryName}`}
          onPress={() => (paused ? onResume(Date.now()) : onPause(Date.now()))}
        />
      </Surface>
    </PressableScale>
  );
}
