import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { TockyOwl, useTheme } from '@/design-system';

export default function HomeScreen() {
  const theme = useTheme();
  const titleVariant = theme.text.title;
  const linkVariant = theme.text.label;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.color.background, gap: theme.spacing.lg }]}
    >
      <TockyOwl expression="curious" size={96} />
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: titleVariant.fontFamily,
          fontSize: titleVariant.fontSize,
          lineHeight: titleVariant.fontSize * titleVariant.lineHeightRatio,
          color: theme.color.text,
        }}
      >
        Tocky
      </Text>
      {__DEV__ && (
        <Link
          href="/gallery"
          style={{
            fontFamily: linkVariant.fontFamily,
            fontSize: linkVariant.fontSize,
            lineHeight: linkVariant.fontSize * linkVariant.lineHeightRatio,
            color: theme.color.textOnAccent,
            backgroundColor: theme.color.accent,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.md,
            overflow: 'hidden',
          }}
        >
          Open design gallery
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
