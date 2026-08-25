import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, Text, TockyOwl, useTheme } from '@/design-system';

const OWL_SIZE = 88;

export function ComingSoonScreen({
  title,
  promise,
  dismissLabel,
}: {
  title: string;
  promise: string;
  dismissLabel?: string;
}) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen gap="xl">
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>

      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg }}
      >
        <TockyOwl expression="sleepy" size={OWL_SIZE} />
        <Text variant="bodyMedium" color="textSecondary" align="center">
          {promise}
        </Text>
        {dismissLabel !== undefined && (
          <Button label={dismissLabel} variant="secondary" size="small" onPress={router.back} />
        )}
      </View>
    </Screen>
  );
}
