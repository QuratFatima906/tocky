import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CATEGORY_PRESETS,
  OWL_EXPRESSIONS,
  TOCKY_ICON_NAMES,
  TockyIcon,
  TockyOwl,
  useTheme,
  useThemePreference,
  type ThemePreference,
} from '@/design-system';

import { GalleryCaption, GalleryGrid, GalleryItem, GallerySection } from './GallerySection';

const CONTROL_ICONS = ['start', 'pause', 'stop', 'switch', 'add', 'edit'] as const;
const NAVIGATION_ICONS = ['home', 'history', 'insights', 'tasks'] as const;
const TILE_SIZE = 48;
const GLYPH_SIZE = 24;
const THEME_OPTIONS: readonly ThemePreference[] = ['light', 'dark', 'system'];

function SchemeSwitcher() {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  const variant = theme.text.labelSmall;

  return (
    <View style={[styles.switcher, { gap: theme.spacing.sm }]}>
      {THEME_OPTIONS.map((option) => {
        const isSelected = preference === option;
        return (
          <Text
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Preview in ${option} theme`}
            onPress={() => setPreference(option)}
            style={{
              fontFamily: variant.fontFamily,
              fontSize: variant.fontSize,
              lineHeight: variant.fontSize * variant.lineHeightRatio,
              color: isSelected ? theme.color.textOnAccent : theme.color.textSecondary,
              backgroundColor: isSelected ? theme.color.accent : theme.color.surfaceMuted,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
              overflow: 'hidden',
            }}
          >
            {option}
          </Text>
        );
      })}
    </View>
  );
}

function CategoryTilePreview({ hue, name }: { hue: string; name: string }) {
  const theme = useTheme();
  const surface = theme.category.surface(hue);

  return (
    <View
      style={[
        styles.tile,
        {
          width: TILE_SIZE,
          height: TILE_SIZE,
          borderRadius: theme.radius.lg,
          backgroundColor: surface,
        },
      ]}
    >
      <TockyIcon
        name={name.toLowerCase() as (typeof TOCKY_ICON_NAMES)[number]}
        color={theme.category.glyph(hue)}
        cutoutColor={theme.scheme === 'dark' ? theme.color.surface : surface}
        size={GLYPH_SIZE}
      />
    </View>
  );
}

export function ArtGallery() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const titleVariant = theme.text.title;

  return (
    <ScrollView
      style={{ backgroundColor: theme.color.background }}
      contentContainerStyle={{
        padding: theme.spacing.xl,
        paddingTop: insets.top + theme.spacing.xl,
        paddingBottom: insets.bottom + theme.spacing['3xl'],
        gap: theme.spacing.xl,
      }}
    >
      <View style={{ gap: theme.spacing.md }}>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: titleVariant.fontFamily,
            fontSize: titleVariant.fontSize,
            lineHeight: titleVariant.fontSize * titleVariant.lineHeightRatio,
            letterSpacing: titleVariant.letterSpacing,
            color: theme.color.text,
          }}
        >
          Tocky artwork
        </Text>
        <SchemeSwitcher />
      </View>

      <GallerySection title="Owl expressions">
        <GalleryGrid>
          {OWL_EXPRESSIONS.map((expression) => (
            <GalleryItem key={expression} caption={expression}>
              <TockyOwl expression={expression} size={72} />
            </GalleryItem>
          ))}
        </GalleryGrid>
        <GalleryCaption>Body, beak and eye-ring shades all derive from two hues.</GalleryCaption>
      </GallerySection>

      <GallerySection title="Owl in category colours">
        <GalleryGrid>
          {CATEGORY_PRESETS.map((preset) => (
            <GalleryItem key={preset.name} caption={preset.name}>
              <TockyOwl expression="curious" bodyColor={preset.hue} size={64} />
            </GalleryItem>
          ))}
        </GalleryGrid>
      </GallerySection>

      <GallerySection title="Category tiles">
        <GalleryGrid>
          {CATEGORY_PRESETS.map((preset) => (
            <GalleryItem key={preset.name} caption={preset.name}>
              <CategoryTilePreview hue={preset.hue} name={preset.icon} />
            </GalleryItem>
          ))}
        </GalleryGrid>
        <GalleryCaption>
          Every glyph colour is derived to clear 3:1 against its own tile.
        </GalleryCaption>
      </GallerySection>

      <GallerySection title="Control icons">
        <GalleryGrid>
          {CONTROL_ICONS.map((name) => (
            <GalleryItem key={name} caption={name}>
              <TockyIcon name={name} color={theme.color.text} size={28} />
            </GalleryItem>
          ))}
        </GalleryGrid>
      </GallerySection>

      <GallerySection title="Navigation icons">
        <GalleryGrid>
          {NAVIGATION_ICONS.map((name) => (
            <GalleryItem key={name} caption={name}>
              <TockyIcon name={name} color={theme.color.accent} size={28} />
            </GalleryItem>
          ))}
        </GalleryGrid>
      </GallerySection>

      <GallerySection title="Every icon">
        <GalleryGrid>
          {TOCKY_ICON_NAMES.map((name) => (
            <GalleryItem key={name} caption={name}>
              <TockyIcon name={name} color={theme.color.textSecondary} size={24} />
            </GalleryItem>
          ))}
        </GalleryGrid>
      </GallerySection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  switcher: { flexDirection: 'row' },
  tile: { alignItems: 'center', justifyContent: 'center' },
});
