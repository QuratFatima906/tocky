import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useSessionStoreSnapshot } from '@/data';
import { IconButton, Screen, Skeleton, Surface, Text, TockyOwl, useTheme } from '@/design-system';
import {
  formatComparedToLastWeek,
  formatDuration,
  formatWeekday,
  startOfWeek,
  summariseWeek,
  type WeekSummary,
} from '@/domain';
import { useNow } from '@/hooks/useNow';

import { WeekChart } from './WeekChart';
import { CategoryBreakdown } from '../categories/CategoryBreakdown';

const WEEK_TICK_MS = 60_000;
const SKELETON_HEIGHTS = [96, 200, 96, 160];
const HERO_OWL_SIZE = 64;
const CALLOUT_OWL_SIZE = 48;
const ENOUGH_DAYS_TO_COMPARE = 2;

export function InsightsScreen({
  onSelectCategory,
}: {
  onSelectCategory: (categoryId: string) => void;
}) {
  const theme = useTheme();
  const { status, sessions, categories } = useSessionStoreSnapshot();
  const now = useNow(WEEK_TICK_MS);
  const [weeksBack, setWeeksBack] = useState(0);

  const summary = useMemo(
    () => summariseWeek(sessions, categories, startOfWeek(now, -weeksBack), now),
    [sessions, categories, now, weeksBack],
  );

  if (status === 'loading') {
    return (
      <Screen gap="xl" testID="insights-screen">
        <Text variant="title" accessibilityRole="header">
          Insights
        </Text>
        <Skeleton
          heights={SKELETON_HEIGHTS}
          accessibilityLabel="Loading your week"
          testID="insights-skeleton"
        />
      </Screen>
    );
  }

  return (
    <Screen gap="lg" testID="insights-screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="title" accessibilityRole="header">
          Insights
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <IconButton
            icon="back"
            accessibilityLabel="The week before"
            background="surface"
            onPress={() => setWeeksBack(weeksBack + 1)}
          />
          <Text variant="labelSmall" color="textSecondary">
            {weekName(weeksBack)}
          </Text>
          <IconButton
            icon="forward"
            accessibilityLabel="The week after"
            background="surface"
            disabled={weeksBack === 0}
            onPress={() => setWeeksBack(weeksBack - 1)}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: theme.spacing.xl, paddingBottom: theme.spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Surface radius="card" elevation="card" padding="lg">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <Text variant="eyebrow" color="textTertiary">
                Total tracked
              </Text>
              <Text variant="statHero">{formatDuration(summary.totalSeconds)}</Text>
              <Text variant="caption" color="textSecondary">
                {formatComparedToLastWeek(summary.totalSeconds - summary.previousWeekSeconds)}
              </Text>
            </View>
            <TockyOwl expression="wink" size={HERO_OWL_SIZE} />
          </View>
        </Surface>

        {summary.trackedDayCount < ENOUGH_DAYS_TO_COMPARE ? (
          <NotEnoughYet trackedDayCount={summary.trackedDayCount} />
        ) : (
          <>
            <WeekChart days={summary.days} longestDay={summary.longestDay} />

            <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
              <QuickStat name="Sessions" value={`${summary.sessionCount}`} unit="this week" />
              <QuickStat
                name="Average"
                value={formatDuration(summary.averageBlockSeconds)}
                unit="a session"
              />
              <QuickStat
                name="Longest"
                value={formatDuration(summary.longestSessionSeconds)}
                unit="one session"
              />
            </View>

            <CategoryBreakdown
              title="By category"
              categoryTotals={summary.categoryTotals}
              showShare
              onSelectCategory={onSelectCategory}
            />

            <WeekCallout summary={summary} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function QuickStat({ name, value, unit }: { name: string; value: string; unit: string }) {
  return (
    <Surface
      radius="xl"
      elevation="card"
      padding="lg"
      gap="xs"
      style={{ flex: 1, alignItems: 'center' }}
      accessible
      accessibilityLabel={`${name}: ${value} ${unit}`}
    >
      <Text variant="captionSmall" color="textTertiary">
        {name}
      </Text>
      <Text variant="numeric">{value}</Text>
      <Text variant="captionSmall" color="textTertiary" align="center">
        {unit}
      </Text>
    </Surface>
  );
}

function WeekCallout({ summary }: { summary: WeekSummary }) {
  const theme = useTheme();
  const { longestDay, categoryTotals } = summary;
  const topCategory = categoryTotals[0];
  if (longestDay === null || topCategory === undefined) return null;

  const dayName = formatWeekday(longestDay.dayStart);

  return (
    <Surface
      radius="card"
      elevation="hairline"
      padding="lg"
      background="surfaceMuted"
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
    >
      <TockyOwl expression="curious" size={CALLOUT_OWL_SIZE} />
      <Text variant="bodySmall" color="textSecondary" style={{ flex: 1 }}>
        {dayName} had the most tracked — {formatDuration(longestDay.breakdown.totalSeconds)}, mostly{' '}
        {topCategory.category.name}.
      </Text>
    </Surface>
  );
}

function NotEnoughYet({ trackedDayCount }: { trackedDayCount: number }) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.lg, paddingTop: theme.spacing.xl }}>
      <TockyOwl expression="sleepy" size={HERO_OWL_SIZE} />
      <Text variant="bodyMedium" color="textSecondary" align="center">
        {trackedDayCount === 0
          ? 'Nothing tracked this week yet.'
          : 'One day in. Track another and the week takes shape.'}
      </Text>
    </View>
  );
}

function weekName(weeksBack: number): string {
  if (weeksBack === 0) return 'This week';
  if (weeksBack === 1) return 'Last week';

  return `${weeksBack} weeks ago`;
}
