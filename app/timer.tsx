import { useRouter } from 'expo-router';

import { TimerScreen } from '@/features/timer/TimerScreen';

export default function TimerRoute() {
  const router = useRouter();

  return (
    <TimerScreen
      onCollapse={router.back}
      onSwitchCategory={() => router.push('/new-session')}
      onEnded={router.back}
    />
  );
}
