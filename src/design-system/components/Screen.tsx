import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomChromeHeight } from '@/features/navigation/BottomChrome';

import { useTheme } from '../theme/ThemeProvider';
import type { GradientName, Spacing } from '../tokens';

export type ScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
  gradient?: GradientName;
  padding?: Spacing;
  gap?: Spacing;
  edges?: { top?: boolean; bottom?: boolean };
  contentStyle?: ViewStyle;
  testID?: string;
};

export function Screen({
  children,
  scrollable = false,
  gradient,
  padding = 'xl',
  gap,
  edges = { top: true, bottom: true },
  contentStyle,
  testID,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomChromeHeight = useBottomChromeHeight();

  const layout: ViewStyle = {
    padding: theme.spacing[padding],
    paddingTop: ((edges.top ?? true) ? insets.top : 0) + theme.spacing[padding],
    paddingBottom:
      ((edges.bottom ?? true) ? Math.max(insets.bottom, bottomChromeHeight) : 0) +
      theme.spacing[padding],
    ...(gap !== undefined && { gap: theme.spacing[gap] }),
  };

  const body = scrollable ? (
    <ScrollView
      contentContainerStyle={[layout, contentStyle]}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, layout, contentStyle]} testID={testID}>
      {children}
    </View>
  );

  if (gradient === undefined) {
    return <View style={[styles.fill, { backgroundColor: theme.color.background }]}>{body}</View>;
  }

  const { colors, locations } = theme.gradient[gradient];

  return (
    <LinearGradient
      colors={[...colors] as [string, string, ...string[]]}
      locations={[...locations] as [number, number, ...number[]]}
      style={styles.fill}
    >
      {body}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
