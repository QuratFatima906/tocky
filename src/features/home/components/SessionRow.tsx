import { View } from 'react-native';

import { CategoryTile, PressableScale, Surface, Text, useTheme } from '@/design-system';
import {
  formatDuration,
  formatDurationForSpeech,
  formatSessionRange,
  relativeDayLabel,
  sessionSeconds,
  type Category,
  type Session,
} from '@/domain';

export function SessionRow({
  session,
  category,
  now,
  onPress,
}: {
  session: Session;
  category: Category | undefined;
  now: number;
  onPress: (sessionId: string) => void;
}) {
  const theme = useTheme();
  const seconds = sessionSeconds(session, now);
  const title = session.label ?? category?.name ?? 'Session';
  const categoryName = category?.name ?? 'Uncategorised';
  const dayLabel = relativeDayLabel(session.startedAt, now);
  const timeRange = formatSessionRange(session.startedAt, session.endedAt);
  const whenTracked = dayLabel === null ? timeRange : `${dayLabel}, ${timeRange}`;

  return (
    <PressableScale
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${categoryName}, ${whenTracked}, ${formatDurationForSpeech(seconds)}`}
      onPress={() => onPress(session.id)}
    >
      <Surface
        radius="xl"
        elevation="card"
        padding="lg"
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
      >
        <CategoryTile icon={category?.icon} color={category?.color ?? theme.color.textTertiary} />

        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="caption" color="textTertiary" numberOfLines={1}>
            {categoryName} · {whenTracked}
          </Text>
        </View>

        <Text variant="numericSmall" color="textSecondary">
          {formatDuration(seconds)}
        </Text>
      </Surface>
    </PressableScale>
  );
}
