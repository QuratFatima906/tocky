import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  IconButton,
  Surface,
  Text,
  useTheme,
  type ButtonSize,
  type ButtonVariant,
  type TextVariant,
} from '@/design-system';

import { GalleryCaption, GalleryGrid, GalleryItem, GallerySection } from './GallerySection';
import { SchemeSwitcher } from './SchemeSwitcher';

const TEXT_SPECIMENS: readonly { variant: TextVariant; sample: string }[] = [
  { variant: 'hero', sample: 'Where did my time go?' },
  { variant: 'title', sample: 'Morning, Alex' },
  { variant: 'heading', sample: "This week's breakdown" },
  { variant: 'sectionTitle', sample: 'Breakdown' },
  { variant: 'statHero', sample: '4h 18m' },
  { variant: 'timerLarge', sample: '1:42:18' },
  { variant: 'timerSmall', sample: '01:42:18' },
  { variant: 'bodyLarge', sample: 'Coding took 46% of your tracked time.' },
  { variant: 'body', sample: 'The workhorse for lists, notes and details.' },
  { variant: 'label', sample: 'Building Tocky' },
  { variant: 'caption', sample: 'Work · 9:12 – 10:36' },
  { variant: 'microLabel', sample: 'Now tracking' },
];

const BUTTON_VARIANTS: readonly ButtonVariant[] = ['primary', 'secondary', 'destructive', 'ghost'];
const BUTTON_SIZES: readonly ButtonSize[] = ['small', 'medium', 'large'];

export function PrimitiveGallery() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.color.background }}
      contentContainerStyle={{
        padding: theme.spacing.xl,
        paddingTop: insets.top + theme.spacing.md,
        paddingBottom: insets.bottom + theme.spacing['3xl'],
        gap: theme.spacing.xl,
      }}
    >
      <SchemeSwitcher />

      <GallerySection title="Type scale">
        {TEXT_SPECIMENS.map(({ variant, sample }) => (
          <View key={variant} style={{ gap: theme.spacing.xs }}>
            <Text variant="captionSmall" color="textTertiary">
              {variant}
            </Text>
            <Text variant={variant}>{sample}</Text>
          </View>
        ))}
      </GallerySection>

      <GallerySection title="Text colour roles">
        <Text color="text">text · primary reading colour</Text>
        <Text color="textSecondary">textSecondary · supporting detail</Text>
        <Text color="textTertiary">textTertiary · timestamps and meta</Text>
        <Text color="successText">successText · +22m vs yesterday</Text>
        <Text color="errorText">errorText · delete this session</Text>
        <GalleryCaption>Every role clears WCAG AA against this surface.</GalleryCaption>
      </GallerySection>

      <GallerySection title="Buttons">
        {BUTTON_VARIANTS.map((variant) => (
          <Button key={variant} label={variant} variant={variant} icon="start" onPress={() => {}} />
        ))}
        <GalleryCaption>Primary carries the three-stop brand gradient.</GalleryCaption>
      </GallerySection>

      <GallerySection title="Button sizes">
        {BUTTON_SIZES.map((size) => (
          <Button key={size} label={`${size} · 44pt minimum`} size={size} onPress={() => {}} />
        ))}
      </GallerySection>

      <GallerySection title="Button states">
        <Button label="Default" onPress={() => {}} />
        <Button label="Loading" loading onPress={() => {}} />
        <Button label="Disabled" disabled onPress={() => {}} />
        <Button label="Full width" fullWidth icon="add" onPress={() => {}} />
      </GallerySection>

      <GallerySection title="Icon buttons">
        <GalleryGrid>
          <GalleryItem caption="plain">
            <IconButton icon="pause" accessibilityLabel="Pause" onPress={() => {}} />
          </GalleryItem>
          <GalleryItem caption="filled">
            <IconButton
              icon="start"
              accessibilityLabel="Start"
              background="surfaceMuted"
              onPress={() => {}}
            />
          </GalleryItem>
          <GalleryItem caption="outlined">
            <IconButton
              icon="stop"
              accessibilityLabel="End"
              border="errorBorder"
              iconColor="errorText"
              size={72}
              onPress={() => {}}
            />
          </GalleryItem>
          <GalleryItem caption="disabled">
            <IconButton icon="switch" accessibilityLabel="Switch" disabled onPress={() => {}} />
          </GalleryItem>
        </GalleryGrid>
        <GalleryCaption>Clamped to 44pt even when asked for less.</GalleryCaption>
      </GallerySection>

      <GallerySection title="Surfaces and elevation">
        <Surface background="surfaceMuted" radius="lg" padding="lg">
          <Text variant="label">surfaceMuted · no elevation</Text>
        </Surface>
        <Surface radius="lg" padding="lg" elevation="hairline">
          <Text variant="label">hairline · chips and rows</Text>
        </Surface>
        <Card>
          <Text variant="label">Card · the default treatment</Text>
          <Text variant="bodySmall" color="textSecondary">
            Radius, padding, gap and shadow all from tokens.
          </Text>
        </Card>
        <Surface radius="card" padding="xl" elevation="sheet">
          <Text variant="label">sheet · bottom sheets</Text>
        </Surface>
      </GallerySection>

      <GallerySection title="Category surfaces">
        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          {['#8C7DE8', '#2FBFA0', '#F2B21E'].map((hue) => (
            <Surface
              key={hue}
              radius="lg"
              padding="md"
              style={{ backgroundColor: theme.category.surface(hue), flex: 1 }}
            >
              <Text variant="labelSmall" style={{ color: theme.category.foreground(hue) }}>
                Readable
              </Text>
            </Surface>
          ))}
        </View>
      </GallerySection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
