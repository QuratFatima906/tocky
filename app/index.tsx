import { StyleSheet, View } from 'react-native';

import { Text, TockyOwl, useTheme } from '@/design-system';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.color.background, gap: theme.spacing.lg }]}
    >
      <TockyOwl expression="curious" size={96} />
      <Text variant="title" accessibilityRole="header">
        Tocky
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
