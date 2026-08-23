import { Link, Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MINIMUM_TOUCH_TARGET, TockyOwl, useTextStyle, useTheme } from '@/design-system';

const DEV_ENTRY_ROUTE = process.env.EXPO_PUBLIC_DEV_ROUTE;

export default function HomeScreen() {
  const theme = useTheme();
  const title = useTextStyle('title', theme.color.text);
  const link = useTextStyle('label', theme.color.textOnAccent);

  if (__DEV__ && DEV_ENTRY_ROUTE !== undefined && DEV_ENTRY_ROUTE !== '') {
    return <Redirect href={DEV_ENTRY_ROUTE as Parameters<typeof Redirect>[0]['href']} />;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.color.background, gap: theme.spacing.lg }]}
    >
      <TockyOwl expression="curious" size={96} />
      <Text accessibilityRole="header" {...title}>
        Tocky
      </Text>
      {__DEV__ && (
        <Link
          href="/gallery"
          style={[
            link.style,
            styles.devLink,
            {
              backgroundColor: theme.color.accent,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.xl,
            },
          ]}
        >
          Open design gallery
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  devLink: {
    minHeight: MINIMUM_TOUCH_TARGET,
    lineHeight: MINIMUM_TOUCH_TARGET,
    textAlign: 'center',
    overflow: 'hidden',
  },
});
