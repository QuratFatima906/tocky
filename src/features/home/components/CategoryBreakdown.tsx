import { View } from 'react-native';

import { CategoryTile, PressableScale, ProgressBar, Text, useTheme } from '@/design-system';
import { formatDuration, formatDurationForSpeech, type CategoryTotal } from '@/domain';

const BREAKDOWN_TILE_SIZE = 44;
const PROGRESS_HEIGHT = 6;

export function CategoryBreakdown({
  categoryTotals,
  onSelectCategory,
}: {
  categoryTotals: readonly CategoryTotal[];
  onSelectCategory: (categoryId: string) => void;
}) {
  const theme = useTheme();

  return (
    <View>
      <Text variant="sectionTitle" accessibilityRole="header">
        Breakdown
      </Text>

      {categoryTotals.map(({ category, seconds, share }) => (
        <PressableScale
          key={category.id}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${category.name}, ${formatDurationForSpeech(seconds)}`}
          onPress={() => onSelectCategory(category.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
            paddingVertical: theme.spacing.md,
          }}
        >
          <CategoryTile icon={category.icon} color={category.color} size={BREAKDOWN_TILE_SIZE} />

          <View style={{ flex: 1, gap: theme.spacing.sm }}>
            <Text variant="label">{category.name}</Text>
            <ProgressBar progress={share} color={category.color} height={PROGRESS_HEIGHT} />
          </View>

          <Text variant="numeric">{formatDuration(seconds)}</Text>
        </PressableScale>
      ))}
    </View>
  );
}
