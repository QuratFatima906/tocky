import { View } from 'react-native';

import { Surface, useTheme } from '@/design-system';

const PLACEHOLDER_HEIGHTS = [56, 168, 72, 72, 72];

export function HomeSkeleton() {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading your day"
      style={{ gap: theme.spacing.xl }}
      testID="home-skeleton"
    >
      {PLACEHOLDER_HEIGHTS.map((height, index) => (
        <Surface
          key={`${height}-${index}`}
          background="surfaceMuted"
          radius="card"
          style={{ height }}
        />
      ))}
    </View>
  );
}
