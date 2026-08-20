import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTextStyle, useTheme } from '@/design-system';

export function GalleryHeading({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text accessibilityRole="header" {...useTextStyle('sectionTitle', theme.color.text)}>
      {children}
    </Text>
  );
}

export function GalleryCaption({ children }: { children: string }) {
  const theme = useTheme();
  const { style, ...textProps } = useTextStyle('captionSmall', theme.color.textSecondary);
  return (
    <Text style={[style, styles.centered]} {...textProps}>
      {children}
    </Text>
  );
}

export function GallerySection({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <View style={{ marginBottom: theme.spacing.md }}>
        <GalleryHeading>{title}</GalleryHeading>
      </View>
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.color.surface,
            borderColor: theme.color.border,
            borderRadius: theme.radius.card,
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export function GalleryGrid({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.grid, { gap: theme.spacing.lg }]}>{children}</View>;
}

export function GalleryItem({ caption, children }: { caption: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.item, { gap: theme.spacing.sm }]}>
      {children}
      <GalleryCaption>{caption}</GalleryCaption>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { width: '100%' },
  panel: { borderWidth: StyleSheet.hairlineWidth },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  item: { alignItems: 'center', minWidth: 84 },
  centered: { textAlign: 'center' },
});
