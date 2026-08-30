import { useRouter } from 'expo-router';

import { HelpScreen } from '@/features/settings/HelpScreen';

export default function HelpRoute() {
  const router = useRouter();

  return <HelpScreen onBack={router.back} />;
}
