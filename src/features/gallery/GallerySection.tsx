import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, type TextVariant } from '@/design-system';

function useVariantStyle(variantName: TextVariant, color: string) {
  const theme = useTheme();
  const variant = theme.text[variantName];
  return {
    fontFamily: variant.fontFamily,
    fontSize: variant.fontSize,
    lineHeight: variant.fontSize * variant.lineHeightRatio,
    letterSpacing: variant.letterSpacing,
    textTransform: variant.textTransform,
    color,
  } as const;
}

export function GalleryHeading({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text accessibilityRole="header" style={useVariantStyle('sectionTitle', theme.color.text)}>
      {children}
    </Text>
  );
}

export function GalleryCaption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text style={[useVariantStyle('captionSmall', theme.color.textSecondary), styles.centered]}>
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
