import { Alert } from 'react-native';

import type { Category } from '@/domain';

/**
 * Starting a session while another runs replaces it. Tocky asks first, always,
 * rather than quietly ending what the user was already tracking.
 */
export function confirmSwitchToCategory({
  from,
  to,
  onConfirm,
}: {
  from: Category | undefined;
  to: Category;
  onConfirm: () => void;
}): void {
  Alert.alert(
    `Switch to ${to.name}?`,
    `Your ${from?.name ?? 'current'} session ends the moment ${to.name} starts, so no time goes untracked.`,
    [
      { text: 'Keep tracking', style: 'cancel' },
      { text: 'Switch', onPress: onConfirm },
    ],
  );
}
