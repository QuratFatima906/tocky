import { useRouter } from 'expo-router';

import { useSessionStore } from '@/data';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';

export default function OnboardingRoute() {
  const router = useRouter();
  const store = useSessionStore();

  return (
    <OnboardingScreen
      onDone={store.completeOnboarding}
      onSignIn={() => router.navigate('/sign-in')}
    />
  );
}
