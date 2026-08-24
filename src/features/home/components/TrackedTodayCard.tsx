import { View } from 'react-native';

import { Card, Text, radius, useTheme } from '@/design-system';
import { formatComparedToYesterday, formatDuration, formatDurationForSpeech } from '@/domain';
import type { CategoryTotal } from '@/domain';

const SEGMENT_BAR_HEIGHT = 14;
const LEGEND_SWATCH_SIZE = 9;
const MINIMUM_VISIBLE_SHARE = 0.02;

export function TrackedTodayCard({
  totalSeconds,
  categoryTotals,
  secondsVersusYesterday,
}: {
  totalSeconds: number;
  categoryTotals: readonly CategoryTotal[];
  secondsVersusYesterday: number;
}) {
  const theme = useTheme();
  const hasTrackedTime = categoryTotals.length > 0;

  return (
    <Card gap="lg">
      <View
        style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}
      >
        <Text variant="eyebrow" color="textTertiary">
          Tracked today
        </Text>
        {hasTrackedTime && (
          <Text
            variant="caption"
            color={secondsVersusYesterday > 0 ? 'successText' : 'textSecondary'}
          >
            {formatComparedToYesterday(secondsVersusYesterday)}
          </Text>
        )}
      </View>

      <Text
        variant="statHero"
        accessibilityLabel={`${formatDurationForSpeech(totalSeconds)} tracked today`}
      >
        {formatDuration(totalSeconds)}
      </Text>

      {hasTrackedTime && (
        <>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ flexDirection: 'row', gap: theme.spacing.xs, height: SEGMENT_BAR_HEIGHT }}
          >
            {categoryTotals.map(({ category, share }) => (
              <View
                key={category.id}
                style={{
                  flex: Math.max(share, MINIMUM_VISIBLE_SHARE),
                  backgroundColor: category.color,
                  borderRadius: radius.pill,
                }}
              />
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg }}>
            {categoryTotals.map(({ category }) => (
              <View
                key={category.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
              >
                <View
                  style={{
                    width: LEGEND_SWATCH_SIZE,
                    height: LEGEND_SWATCH_SIZE,
                    borderRadius: 3,
                    backgroundColor: category.color,
                  }}
                />
                <Text variant="caption" color="textSecondary">
                  {category.name}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}
