import { useRouter } from 'expo-router';

import { HistoryScreen } from '@/features/history/HistoryScreen';

export default function HistoryRoute() {
  const router = useRouter();

  return <HistoryScreen onOpenSession={(sessionId) => router.push(`/session/${sessionId}`)} />;
}
