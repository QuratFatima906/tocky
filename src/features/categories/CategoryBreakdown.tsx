import { View } from 'react-native';

import { CategoryTile, PressableScale, ProgressBar, Text, useTheme } from '@/design-system';
import { formatDuration, formatDurationForSpeech, type CategoryTotal } from '@/domain';

const BREAKDOWN_TILE_SIZE = 44;
const PROGRESS_HEIGHT = 6;

const SHARE_AS_PERCENT = 100;

export function CategoryBreakdown({
  title,
  categoryTotals,
  showShare = false,
  onSelectCategory,
}: {
  title: string;
  categoryTotals: readonly CategoryTotal[];
  showShare?: boolean;
  onSelectCategory: (categoryId: string) => void;
}) {
  const theme = useTheme();

  return (
    <View>
      <Text variant="sectionTitle" accessibilityRole="header">
        {title}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="label">{category.name}</Text>
              {showShare && (
                <Text variant="caption" color="textTertiary">
                  {Math.round(share * SHARE_AS_PERCENT)}%
                </Text>
              )}
            </View>
            <ProgressBar progress={share} color={category.color} height={PROGRESS_HEIGHT} />
          </View>

          <Text variant="numeric">{formatDuration(seconds)}</Text>
        </PressableScale>
      ))}
    </View>
  );
}
