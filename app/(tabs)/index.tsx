import { useRouter } from 'expo-router';

import { HomeScreen } from '@/features/home/HomeScreen';

export default function HomeRoute() {
  const router = useRouter();

  return <HomeScreen onOpenSession={(sessionId) => router.push(`/session/${sessionId}`)} />;
}
