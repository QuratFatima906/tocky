import { useLocalSearchParams, useRouter } from 'expo-router';

import { SessionDetailScreen } from '@/features/sessionDetail/SessionDetailScreen';

export default function SessionDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SessionDetailScreen
      sessionId={id}
      onBack={router.back}
      onResumed={() => {
        router.back();
        router.push('/timer');
      }}
    />
  );
}
