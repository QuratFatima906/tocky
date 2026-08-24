import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessionStore } from '@/data';
import { Screen, Text, useTheme } from '@/design-system';

import { CategoryBreakdown } from './components/CategoryBreakdown';
import { EmptyDay } from './components/EmptyDay';
import { HomeGreeting } from './components/HomeGreeting';
import { HomeSkeleton } from './components/HomeSkeleton';
import { NowTrackingBar } from './components/NowTrackingBar';
import { SessionRow } from './components/SessionRow';
import { TrackedTodayCard } from './components/TrackedTodayCard';
import { useHomeSnapshot } from './useHomeSnapshot';

export type HomeScreenProps = {
  userName?: string;
  onOpenProfile?: () => void;
  onOpenTimer?: () => void;
  onOpenSession?: (sessionId: string) => void;
  onOpenCategory?: (categoryId: string) => void;
};

const noop = () => {};

export function HomeScreen({
  userName,
  onOpenProfile = noop,
  onOpenTimer = noop,
  onOpenSession = noop,
  onOpenCategory = noop,
}: HomeScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const store = useSessionStore();
  const [nowTrackingBarHeight, setNowTrackingBarHeight] = useState(0);
  const {
    isLoading,
    greeting,
    today,
    secondsVersusYesterday,
    recentSessions,
    activeSession,
    categoriesById,
    now,
  } = useHomeSnapshot();

  const hasTrackedTime = today.categoryTotals.length > 0;

  return (
    <View style={{ flex: 1 }}>
      <Screen
        scrollable
        gap="xl"
        testID="home-screen"
        contentStyle={{
          paddingBottom:
            insets.bottom +
            theme.spacing.xl +
            (activeSession !== null ? nowTrackingBarHeight + theme.spacing.md : 0),
        }}
      >
        <HomeGreeting greeting={greeting} name={userName} now={now} onOpenProfile={onOpenProfile} />

        {isLoading ? (
          <HomeSkeleton />
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

      {activeSession !== null && (
        <View
          testID="now-tracking-bar"
          onLayout={({ nativeEvent }: LayoutChangeEvent) =>
            setNowTrackingBarHeight(nativeEvent.layout.height)
          }
          style={{
            position: 'absolute',
            left: theme.spacing.lg,
            right: theme.spacing.lg,
            bottom: insets.bottom + theme.spacing.md,
          }}
        >
          <NowTrackingBar
            session={activeSession}
            category={categoriesById.get(activeSession.categoryId)}
            onOpenTimer={onOpenTimer}
            onPause={store.pauseActiveSession}
            onResume={store.resumeActiveSession}
          />
        </View>
      )}
    </View>
  );
}
