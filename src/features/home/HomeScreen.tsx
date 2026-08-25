import { View } from 'react-native';

import { Screen, Skeleton, Text, useTheme } from '@/design-system';

import { CategoryBreakdown } from './components/CategoryBreakdown';
import { EmptyDay } from './components/EmptyDay';
import { HomeGreeting } from './components/HomeGreeting';
import { SessionRow } from './components/SessionRow';
import { TrackedTodayCard } from './components/TrackedTodayCard';
import { useHomeSnapshot } from './useHomeSnapshot';

export type HomeScreenProps = {
  userName?: string;
  onOpenProfile?: () => void;
  onOpenSession?: (sessionId: string) => void;
  onOpenCategory?: (categoryId: string) => void;
};

const HOME_SKELETON_HEIGHTS = [56, 168, 72, 72, 72];

const noop = () => {};

export function HomeScreen({
  userName,
  onOpenProfile = noop,
  onOpenSession = noop,
  onOpenCategory = noop,
}: HomeScreenProps) {
  const theme = useTheme();
  const {
    isLoading,
    greeting,
    today,
    secondsVersusYesterday,
    recentSessions,
    categoriesById,
    now,
  } = useHomeSnapshot();

  const hasTrackedTime = today.categoryTotals.length > 0;

  return (
    <Screen scrollable gap="xl" testID="home-screen">
      <HomeGreeting greeting={greeting} name={userName} now={now} onOpenProfile={onOpenProfile} />

      {isLoading ? (
        <Skeleton
          heights={HOME_SKELETON_HEIGHTS}
          accessibilityLabel="Loading your day"
          testID="home-skeleton"
        />
      ) : (
        <>
          <TrackedTodayCard
            totalSeconds={today.totalSeconds}
            categoryTotals={today.categoryTotals}
            secondsVersusYesterday={secondsVersusYesterday}
          />

          {hasTrackedTime ? (
            <CategoryBreakdown
              categoryTotals={today.categoryTotals}
              onSelectCategory={onOpenCategory}
            />
          ) : (
            <EmptyDay hasEarlierSessions={recentSessions.length > 0} />
          )}

          {recentSessions.length > 0 && (
            <View style={{ gap: theme.spacing.md }}>
              <Text variant="sectionTitle" accessibilityRole="header">
                Recent
              </Text>
              {recentSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  category={categoriesById.get(session.categoryId)}
                  now={now}
                  onPress={onOpenSession}
                />
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
