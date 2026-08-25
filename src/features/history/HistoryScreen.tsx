import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { useSessionStoreSnapshot } from '@/data';
import { Screen, Skeleton, Surface, Text, TextField, TockyOwl, useTheme } from '@/design-system';
import {
  dayGroupHeading,
  formatDuration,
  groupSessionsByDay,
  type Category,
  type DaySessionEntry,
} from '@/domain';
import { useNow } from '@/hooks/useNow';

import { HistorySessionRow } from './HistorySessionRow';

const DAY_TOTAL_TICK_MS = 30_000;
const SKELETON_HEIGHTS = [72, 180, 180];
const OWL_SIZE = 88;

type DayGroup = {
  heading: string;
  totalSeconds: number;
  entries: readonly DaySessionEntry[];
};

export function HistoryScreen({ onOpenSession }: { onOpenSession: (sessionId: string) => void }) {
  const theme = useTheme();
  const { status, sessions, categories } = useSessionStoreSnapshot();
  const now = useNow(DAY_TOTAL_TICK_MS);
  const [query, setQuery] = useState('');

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const days = useMemo<readonly DayGroup[]>(
    () =>
      groupSessionsByDay(sessions, now).flatMap<DayGroup>((day) => {
        const heading = dayGroupHeading(day.dayStart, now);
        const entries = day.entries.filter((entry) =>
          matchesQuery(entry, categoriesById.get(entry.session.categoryId), heading, query),
        );

        return entries.length === 0
          ? []
          : [
              {
                heading,
                entries,
                totalSeconds: entries.reduce((total, entry) => total + entry.seconds, 0),
              },
            ];
      }),
    [sessions, now, categoriesById, query],
  );

  if (status === 'loading') {
    return (
      <Screen gap="xl" testID="history-screen">
        <Text variant="title" accessibilityRole="header">
          History
        </Text>
        <Skeleton
          heights={SKELETON_HEIGHTS}
          accessibilityLabel="Loading your history"
          testID="history-skeleton"
        />
      </Screen>
    );
  }

  return (
    <Screen gap="lg" testID="history-screen">
      <Text variant="title" accessibilityRole="header">
        History
      </Text>

      {sessions.length > 0 && (
        <TextField
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Search your sessions"
          placeholder="Search by name, category or day"
          icon="search"
        />
      )}

      <FlatList
        data={days}
        style={{ flex: 1 }}
        keyExtractor={(day) => day.heading}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.xl, paddingBottom: theme.spacing.xl }}
        ListEmptyComponent={
          <NothingToShow hasSessions={sessions.length > 0} isSearching={query.trim() !== ''} />
        }
        renderItem={({ item: day }) => (
          <View style={{ gap: theme.spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="sectionTitle" accessibilityRole="header">
                {day.heading}
              </Text>
              <Text variant="numericSmall" color="textTertiary">
                {formatDuration(day.totalSeconds)}
              </Text>
            </View>

            <Surface radius="xl" elevation="card" style={{ overflow: 'hidden' }}>
              {day.entries.map((entry, index) => (
                <HistorySessionRow
                  key={`${entry.session.id}-${entry.startedAtInDay}`}
                  entry={entry}
                  category={categoriesById.get(entry.session.categoryId)}
                  isLastInDay={index === day.entries.length - 1}
                  onPress={onOpenSession}
                />
              ))}
            </Surface>
          </View>
        )}
      />
    </Screen>
  );
}

function matchesQuery(
  entry: DaySessionEntry,
  category: Category | undefined,
  heading: string,
  query: string,
): boolean {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === '') return true;

  return [entry.session.label, category?.name, heading, entry.session.note].some(
    (candidate) => candidate?.toLowerCase().includes(trimmed) === true,
  );
}

function NothingToShow({
  hasSessions,
  isSearching,
}: {
  hasSessions: boolean;
  isSearching: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.lg, paddingTop: theme.spacing['3xl'] }}>
      <TockyOwl expression={isSearching ? 'curious' : 'sleepy'} size={OWL_SIZE} />
      <Text variant="bodyMedium" color="textSecondary" align="center">
        {isSearching
          ? 'Nothing matches that yet.'
          : hasSessions
            ? 'Nothing tracked on these days.'
            : 'Nothing tracked yet — tap + to start.'}
      </Text>
    </View>
  );
}
