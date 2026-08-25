import { View } from 'react-native';

import { useSessionStore, useSessionStoreSnapshot } from '@/data';
import { useBottomChromePartHeight, useReportBottomChrome, useTheme } from '@/design-system';
import { findActiveSession, type Session } from '@/domain';

import { NowTrackingBar } from './NowTrackingBar';

export function NowTrackingHost({
  isLive = true,
  onOpenTimer,
}: {
  isLive?: boolean;
  onOpenTimer: () => void;
}) {
  const { sessions } = useSessionStoreSnapshot();
  const activeSession = findActiveSession(sessions);

  if (activeSession === null) return null;

  return <PinnedNowTrackingBar session={activeSession} isLive={isLive} onOpenTimer={onOpenTimer} />;
}

function PinnedNowTrackingBar({
  session,
  isLive,
  onOpenTimer,
}: {
  session: Session;
  isLive: boolean;
  onOpenTimer: () => void;
}) {
  const theme = useTheme();
  const store = useSessionStore();
  const { categories } = useSessionStoreSnapshot();
  const reportHeight = useReportBottomChrome('nowTrackingBar');
  const tabBarHeight = useBottomChromePartHeight('tabBar');

  if (tabBarHeight === 0) return null;

  return (
    <View
      {...reportHeight}
      testID="now-tracking-host"
      style={{
        position: 'absolute',
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        bottom: tabBarHeight + theme.spacing.sm,
      }}
    >
      <NowTrackingBar
        isLive={isLive}
        session={session}
        category={categories.find((category) => category.id === session.categoryId)}
        onOpenTimer={onOpenTimer}
        onPause={store.pauseActiveSession}
        onResume={store.resumeActiveSession}
      />
    </View>
  );
}
