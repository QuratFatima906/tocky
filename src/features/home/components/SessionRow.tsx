import { View } from 'react-native';

import { CategoryTile, PressableScale, Surface, Text, useTheme } from '@/design-system';
import {
  formatDuration,
  formatDurationForSpeech,
  formatSessionRange,
  sessionSeconds,
  type Category,
  type Session,
} from '@/domain';

const TILE_SIZE = 38;

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
  const timeRange = formatSessionRange(session.startedAt, session.endedAt);

  return (
    <PressableScale
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${category?.name ?? 'Uncategorised'}, ${timeRange}, ${formatDurationForSpeech(seconds)}`}
      onPress={() => onPress(session.id)}
    >
      <Surface
        radius="xl"
        elevation="card"
        padding="lg"
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
      >
        <CategoryTile
          icon={category?.icon ?? ''}
          color={category?.color ?? theme.color.textTertiary}
          size={TILE_SIZE}
        />

        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="caption" color="textTertiary">
            {category?.name ?? 'Uncategorised'} · {timeRange}
          </Text>
        </View>

        <Text variant="numericSmall" color="textSecondary">
          {formatDuration(seconds)}
        </Text>
      </Surface>
    </PressableScale>
  );
}
