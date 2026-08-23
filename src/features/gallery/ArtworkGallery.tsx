import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CATEGORY_PRESETS,
  OWL_EXPRESSIONS,
  TOCKY_ICON_NAMES,
  TockyIcon,
  TockyOwl,
  useTheme,
  type CategoryIconName,
} from '@/design-system';

import { GalleryCaption, GalleryGrid, GalleryItem, GallerySection } from './GallerySection';
import { SchemeSwitcher } from './SchemeSwitcher';

const CONTROL_ICONS = ['start', 'pause', 'stop', 'switch', 'add', 'edit'] as const;
const NAVIGATION_ICONS = ['home', 'history', 'insights', 'tasks'] as const;
const TILE_SIZE = 48;
const GLYPH_SIZE = 24;

function CategoryTilePreview({ hue, icon }: { hue: string; icon: CategoryIconName }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.tile,
        {
          width: TILE_SIZE,
          height: TILE_SIZE,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.category.surface(hue),
        },
      ]}
    >
      <TockyIcon name={icon} color={theme.category.glyph(hue)} size={GLYPH_SIZE} />
    </View>
  );
}

export function ArtworkGallery() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
      <SchemeSwitcher />

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
              <CategoryTilePreview hue={preset.hue} icon={preset.icon} />
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
  tile: { alignItems: 'center', justifyContent: 'center' },
});
