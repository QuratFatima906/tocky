import { ComingSoonScreen } from '@/features/navigation/ComingSoonScreen';

export default function TimerRoute() {
  return (
    <ComingSoonScreen
      title="Timer"
      promise="Your running session will live here."
      dismissLabel="Back to Home"
    />
  );
}
