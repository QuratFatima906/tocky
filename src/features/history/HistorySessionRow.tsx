import { View } from 'react-native';

import { CategoryTile, PressableScale, Text, useTheme } from '@/design-system';
import {
  formatClockTime,
  formatDuration,
  formatDurationForSpeech,
  type Category,
  type DaySessionEntry,
} from '@/domain';

const TILE_SIZE = 36;
const START_TIME_WIDTH = 62;

export function HistorySessionRow({
  entry,
  category,
  isLastInDay,
  onPress,
}: {
  entry: DaySessionEntry;
  category: Category | undefined;
  isLastInDay: boolean;
  onPress: (sessionId: string) => void;
}) {
  const theme = useTheme();
  const { session, seconds, startedAtInDay } = entry;
  const title = session.label ?? category?.name ?? 'Session';
  const categoryName = category?.name ?? 'Uncategorised';
  const startedAt = formatClockTime(startedAtInDay);

  return (
    <PressableScale
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${categoryName}, from ${startedAt}, ${formatDurationForSpeech(seconds)}`}
      onPress={() => onPress(session.id)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
        ...(isLastInDay
          ? {}
          : { borderBottomWidth: 1, borderBottomColor: theme.color.borderSubtle }),
      }}
    >
      <Text
        variant="numericSmall"
        color="textTertiary"
        numberOfLines={1}
        style={{ width: START_TIME_WIDTH }}
      >
        {startedAt}
      </Text>

      <CategoryTile
        icon={category?.icon}
        color={category?.color ?? theme.color.textTertiary}
        size={TILE_SIZE}
      />

      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" color="textTertiary" numberOfLines={1}>
          {categoryName}
        </Text>
      </View>

      <Text variant="numericSmall" color="textSecondary">
        {formatDuration(seconds)}
      </Text>
    </PressableScale>
  );
}
