import { Link } from 'expo-router';

import { Card, Screen, Text } from '@/design-system';
import { SchemeSwitcher } from '@/features/gallery/SchemeSwitcher';

const SECTIONS = [
  { href: '/gallery/artwork', title: 'Artwork', detail: 'Icons, owl expressions, category tiles' },
  { href: '/gallery/primitives', title: 'Primitives', detail: 'Text, buttons, surfaces, screens' },
] as const;

export default function GalleryIndexScreen() {
  return (
    <Screen scrollable gap="xl">
      <SchemeSwitcher />
      {SECTIONS.map((section) => (
        <Link key={section.href} href={section.href} asChild>
          <Card accessibilityRole="link" accessibilityLabel={section.title}>
            <Text variant="sectionTitle">{section.title}</Text>
            <Text variant="bodySmall" color="textSecondary">
              {section.detail}
            </Text>
          </Card>
        </Link>
      ))}
    </Screen>
  );
}
