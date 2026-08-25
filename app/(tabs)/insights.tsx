import { useRouter } from 'expo-router';

import { InsightsScreen } from '@/features/insights/InsightsScreen';

export default function InsightsRoute() {
  const router = useRouter();

  return <InsightsScreen onSelectCategory={() => router.push('/(tabs)/history')} />;
}
