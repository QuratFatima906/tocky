import { View } from 'react-native';

import { Screen, Text, TockyOwl, useTheme } from '@/design-system';

const OWL_SIZE = 88;

export function ComingSoonScreen({ title, promise }: { title: string; promise: string }) {
  const theme = useTheme();

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
      </View>
    </Screen>
  );
}
