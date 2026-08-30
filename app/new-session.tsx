import { useRouter } from 'expo-router';

import { NewSessionScreen } from '@/features/newSession/NewSessionScreen';

export default function NewSessionRoute() {
  const router = useRouter();

  return (
    <NewSessionScreen
      onDismiss={router.back}
      onStarted={() => {
        router.back();
        // Switching opens this modal from the timer, so pushing would stack a
        // second timer over the first and leave ending or collapsing the new
        // session on the old route, which by then is tracking nothing.
        router.navigate('/timer');
      }}
    />
  );
}
