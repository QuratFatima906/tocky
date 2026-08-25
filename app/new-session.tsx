import { ComingSoonScreen } from '@/features/navigation/ComingSoonScreen';

export default function NewSessionRoute() {
  return (
    <ComingSoonScreen
      title="New session"
      promise="Pick a category to start tracking."
      dismissLabel="Close"
    />
  );
}
