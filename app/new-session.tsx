import { useRouter } from 'expo-router';

import { NewSessionScreen } from '@/features/newSession/NewSessionScreen';

export default function NewSessionRoute() {
  const router = useRouter();

  return <NewSessionScreen onDismiss={router.back} />;
}
