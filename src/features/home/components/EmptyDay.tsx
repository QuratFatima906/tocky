import { View } from 'react-native';

import { Text, TockyOwl, useTheme } from '@/design-system';

const OWL_SIZE = 96;

export function EmptyDay() {
  const theme = useTheme();

  return (
    <View
      style={{ alignItems: 'center', gap: theme.spacing.lg, paddingVertical: theme.spacing.xl }}
    >
      <TockyOwl expression="sleepy" size={OWL_SIZE} />
      <Text variant="bodyMedium" color="textSecondary" align="center">
        Nothing tracked yet — tap + to start
      </Text>
    </View>
  );
}
