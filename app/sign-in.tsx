import { ComingSoonScreen } from '@/features/navigation/ComingSoonScreen';

export default function SignInRoute() {
  return (
    <ComingSoonScreen
      title="Sign in"
      promise="Accounts and cloud sync arrive later. Tocky already works entirely on your device."
      dismissLabel="Back to Tocky"
    />
  );
}
