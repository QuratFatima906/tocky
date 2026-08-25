import { View } from 'react-native';

import { Surface } from './Surface';
import { useTheme } from '../theme/ThemeProvider';

export type SkeletonProps = {
  heights: readonly number[];
  accessibilityLabel: string;
  testID?: string;
};

export function Skeleton({ heights, accessibilityLabel, testID }: SkeletonProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      style={{ gap: theme.spacing.xl }}
      testID={testID}
    >
      {heights.map((height, index) => (
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
