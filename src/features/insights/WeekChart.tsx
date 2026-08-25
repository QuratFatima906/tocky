import { View } from 'react-native';

import { Surface, Text, useTheme } from '@/design-system';
import { formatDuration, formatDurationForSpeech, formatWeekday, type WeekDay } from '@/domain';

const BAR_HEIGHT = 124;
const BAR_WIDTH = 22;
const MINIMUM_VISIBLE_SEGMENT = 3;

export function WeekChart({
  days,
  longestDay,
}: {
  days: readonly WeekDay[];
  longestDay: WeekDay | null;
}) {
  const tallestSeconds = longestDay?.breakdown.totalSeconds ?? 0;

  return (
    <Surface radius="card" elevation="card" padding="lg" gap="lg" testID="week-chart">
      <Text variant="sectionTitle" accessibilityRole="header">
        Each day
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        {days.map((day) => (
          <DayColumn
            key={day.dayStart}
            day={day}
            tallestSeconds={tallestSeconds}
            isTallest={day.dayStart === longestDay?.dayStart}
          />
        ))}
      </View>
    </Surface>
  );
}

function DayColumn({
  day,
  tallestSeconds,
  isTallest,
}: {
  day: WeekDay;
  tallestSeconds: number;
  isTallest: boolean;
}) {
  const theme = useTheme();
  const { totalSeconds, categoryTotals } = day.breakdown;
  const columnHeight = tallestSeconds === 0 ? 0 : (totalSeconds / tallestSeconds) * BAR_HEIGHT;

  return (
    <View
      accessible
      accessibilityLabel={`${formatWeekday(day.dayStart)}, ${
        totalSeconds === 0 ? 'nothing tracked' : formatDurationForSpeech(totalSeconds)
      }`}
      style={{ alignItems: 'center', justifyContent: 'flex-end', gap: theme.spacing.xs }}
    >
      <Text variant="captionSmall" color="textSecondary" numberOfLines={1}>
        {isTallest && totalSeconds > 0 ? formatDuration(totalSeconds) : ' '}
      </Text>

      <View
        style={{
          width: BAR_WIDTH,
          height: Math.max(columnHeight, MINIMUM_VISIBLE_SEGMENT),
          borderRadius: theme.radius.sm,
          overflow: 'hidden',
          backgroundColor: totalSeconds === 0 ? theme.color.surfaceMuted : 'transparent',
          justifyContent: 'flex-end',
        }}
      >
        {categoryTotals.map(({ category, seconds }) => (
          <View
            key={category.id}
            style={{
              height: Math.max((seconds / totalSeconds) * columnHeight, MINIMUM_VISIBLE_SEGMENT),
              backgroundColor: theme.category.glyph(category.color),
            }}
          />
        ))}
      </View>

      <Text variant="captionSmall" color="textTertiary">
        {weekdayInitial(day.dayStart)}
      </Text>
    </View>
  );
}

function weekdayInitial(dayStart: number): string {
  return formatWeekday(dayStart).charAt(0);
}
