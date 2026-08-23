import type { ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import type { ColorRole, ElevationLevel, Radius, Spacing } from '../tokens';

export type SurfaceProps = ViewProps & {
  children?: ReactNode;
  background?: ColorRole;
  elevation?: ElevationLevel;
  radius?: Radius;
  padding?: Spacing;
  gap?: Spacing;
  bordered?: boolean;
};

export function Surface({
  children,
  background = 'surface',
  elevation,
  radius,
  padding,
  gap,
  bordered = false,
  style,
  ...viewProps
}: SurfaceProps) {
  const theme = useTheme();

  const surfaceStyle: ViewStyle = {
    backgroundColor: theme.color[background],
    ...(radius !== undefined && { borderRadius: theme.radius[radius] }),
    ...(padding !== undefined && { padding: theme.spacing[padding] }),
    ...(gap !== undefined && { gap: theme.spacing[gap] }),
    ...(bordered && { borderWidth: 1, borderColor: theme.color.border }),
  };

  return (
    <View
      {...viewProps}
      style={[surfaceStyle, elevation !== undefined && theme.elevation[elevation], style]}
    >
      {children}
    </View>
  );
}

export function Card({ children, ...surfaceProps }: SurfaceProps) {
  return (
    <Surface radius="card" padding="xl" elevation="card" gap="md" {...surfaceProps}>
      {children}
    </Surface>
  );
}
