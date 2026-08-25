import { View } from 'react-native';

import { CategoryTile, PressableScale, Text, TockyIcon, useTheme } from '@/design-system';
import type { Category } from '@/domain';

const CHOICE_TILE_SIZE = 44;
const SELECTED_BADGE_SIZE = 18;
// A percentage basis, not a computed width: three of these plus their two gaps
// fit a row, a fourth cannot, and flexGrow spends whatever is left over.
const CHOICE_BASIS_PERCENT = 30;

export function CategoryPicker({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: {
  categories: readonly Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}
    >
      {categories.map((category) => {
        const isSelected = category.id === selectedCategoryId;

        return (
          <PressableScale
            key={category.id}
            accessible
            accessibilityRole="radio"
            accessibilityLabel={category.name}
            accessibilityState={{ checked: isSelected }}
            onPress={() => onSelectCategory(category.id)}
            style={[
              {
                flexGrow: 1,
                flexBasis: `${CHOICE_BASIS_PERCENT}%`,
                alignItems: 'center',
                gap: theme.spacing.sm,
                paddingVertical: theme.spacing.lg,
                paddingHorizontal: theme.spacing.sm,
                borderRadius: theme.radius.xl,
                backgroundColor: theme.color.surface,
                borderWidth: 2,
                borderColor: isSelected ? theme.color.accent : theme.color.surface,
              },
              isSelected ? theme.elevation.raised : theme.elevation.card,
            ]}
          >
            {isSelected && (
              <View
                style={{
                  position: 'absolute',
                  top: theme.spacing.sm,
                  right: theme.spacing.sm,
                }}
              >
                <TockyIcon name="check" color={theme.color.accent} size={SELECTED_BADGE_SIZE} />
              </View>
            )}

            <CategoryTile icon={category.icon} color={category.color} size={CHOICE_TILE_SIZE} />
            <Text variant="labelSmall" align="center" numberOfLines={1}>
              {category.name}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
