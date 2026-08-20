import type { ReactNode } from 'react';
import { View } from 'react-native';

type DecorativeArtworkProps = {
  width: number;
  height: number;
  testID: string;
  children: ReactNode;
};

export function DecorativeArtwork({ width, height, testID, children }: DecorativeArtworkProps) {
  return (
    <View
      testID={testID}
      style={{ width, height }}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </View>
  );
}
