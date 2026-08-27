import { useRouter } from 'expo-router';

import { useSessionStoreSnapshot } from '@/data';
import { HomeScreen } from '@/features/home/HomeScreen';

export default function HomeRoute() {
  const router = useRouter();
  const { profileName } = useSessionStoreSnapshot();

  return (
    <HomeScreen
      {...(profileName !== null && { userName: profileName })}
      onOpenSession={(sessionId) => router.push(`/session/${sessionId}`)}
      onOpenProfile={() => router.push('/settings')}
    />
  );
}
