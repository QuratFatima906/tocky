import { View } from 'react-native';

import { useSessionStore, useSessionStoreSnapshot } from '@/data';
import { useTheme } from '@/design-system';
import { findActiveSession, type Session } from '@/domain';

import { useBottomChromePartHeight, useReportBottomChrome } from './BottomChrome';
import { NowTrackingBar } from './NowTrackingBar';

export function NowTrackingHost({ onOpenTimer }: { onOpenTimer: () => void }) {
  const { sessions } = useSessionStoreSnapshot();
  const activeSession = findActiveSession(sessions);

  if (activeSession === null) return null;

  return <PinnedNowTrackingBar session={activeSession} onOpenTimer={onOpenTimer} />;
}

function PinnedNowTrackingBar({
  session,
  onOpenTimer,
}: {
  session: Session;
  onOpenTimer: () => void;
}) {
  const theme = useTheme();
  const store = useSessionStore();
  const { categories } = useSessionStoreSnapshot();
  const reportHeight = useReportBottomChrome('nowTrackingBar');
  const tabBarHeight = useBottomChromePartHeight('tabBar');

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
        session={session}
        category={categories.find((category) => category.id === session.categoryId)}
        onOpenTimer={onOpenTimer}
        onPause={store.pauseActiveSession}
        onResume={store.resumeActiveSession}
      />
    </View>
  );
}
